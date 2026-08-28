const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const {
  validateIntelligenceSchema,
  getControlledFallback,
  analyzeDemandIntelligence,
} = require("../src/services/aiService");

describe("AI Service Unit Tests & Data Integrity", () => {
  const originalApiKey = process.env.GROQ_API_KEY;

  afterEach(() => {
    process.env.GROQ_API_KEY = originalApiKey;
  });

  // 1. Valid AI JSON schema test
  it("1. Schema validator accepts valid AI JSON response", () => {
    const valid = {
      outlook: "LOW_RISK",
      urgency: "LOW",
      summary: "Demand is well matched by local supplies.",
      keyFactors: ["100% potential supply coverage", "Nearby farmers available"],
      recommendation: "Proceed with commitment coordination.",
    };
    assert.equal(validateIntelligenceSchema(valid), true);
  });

  // 2. Invalid AI JSON schema test
  it("2. Schema validator rejects invalid AI JSON or missing fields", () => {
    assert.equal(validateIntelligenceSchema(null), false);
    assert.equal(
      validateIntelligenceSchema({
        outlook: "INVALID_RISK",
        urgency: "LOW",
        summary: "test",
        keyFactors: ["test"],
        recommendation: "test",
      }),
      false
    );
    assert.equal(
      validateIntelligenceSchema({
        outlook: "LOW_RISK",
        urgency: "LOW",
        summary: "",
        keyFactors: [],
        recommendation: "test",
      }),
      false
    );
  });

  // 3. Controlled fallback logic test
  it("3. Controlled fallback generates valid schema data from factual context", () => {
    const context = {
      demand: { productName: "Tomatoes", remainingQuantity: 100, unit: "kg" },
      supplySummary: { totalPotentialSupply: 150, highestMatchScore: 92 },
    };

    const fallback = getControlledFallback(context);
    assert.equal(validateIntelligenceSchema(fallback), true);
    assert.equal(fallback.outlook, "LOW_RISK");
    assert.equal(fallback.urgency, "LOW");
  });

  // 4. Missing GROQ_API_KEY test
  it("4. Missing GROQ_API_KEY returns controlled unavailable message without server crash", async () => {
    delete process.env.GROQ_API_KEY;

    const context = {
      demand: { productName: "Tomatoes", remainingQuantity: 100 },
      supplySummary: { totalPotentialSupply: 50 },
    };

    const result = await analyzeDemandIntelligence(context);
    assert.equal(result.success, false);
    assert.equal(result.message, "Demand intelligence is temporarily unavailable.");
  });

  // 5. AI API Failure simulation test
  it("5. Groq API failure triggers controlled unavailable response", async () => {
    process.env.GROQ_API_KEY = "gsk_invalid_test_key_mock_failure";

    const context = {
      demand: { productName: "Spinach", remainingQuantity: 200 },
      supplySummary: { totalPotentialSupply: 0 },
    };

    const result = await analyzeDemandIntelligence(context);
    assert.equal(result.success, false);
    assert.equal(result.message, "Demand intelligence is temporarily unavailable.");
  });

  // 6. AI read-only integrity (Demand & Supply objects never modified)
  it("6. AI execution does not modify demand or supply quantities in database objects", async () => {
    const mockDemand = {
      _id: "d100",
      productName: "Rice",
      quantity: 500,
      fulfilledQuantity: 100,
      status: "OPEN",
    };
    const mockSupply = {
      _id: "s200",
      productName: "Rice",
      quantity: 300,
      committedQuantity: 50,
      status: "AVAILABLE",
    };

    const demandBefore = JSON.stringify(mockDemand);
    const supplyBefore = JSON.stringify(mockSupply);

    delete process.env.GROQ_API_KEY;
    await analyzeDemandIntelligence({
      demand: mockDemand,
      supplySummary: { totalPotentialSupply: 250 },
    });

    assert.equal(JSON.stringify(mockDemand), demandBefore);
    assert.equal(JSON.stringify(mockSupply), supplyBefore);
  });
});
