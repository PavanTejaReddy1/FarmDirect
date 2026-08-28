/**
 * aiService.js
 *
 * Demand Intelligence layer powered by Groq API.
 *
 * READ-ONLY ANALYSIS ONLY.
 * Never modifies database quantities or overrides deterministic logic.
 */

const SYSTEM_PROMPT = `
You are the FarmDirect Demand Intelligence assistant.

Analyze only the supplied structured data.

Never invent quantities, farmers, prices, dates, locations, or statistics.

If information is missing, say it is unavailable.

Do not make financial, legal, or safety claims.

Your role is to summarize the current demand/supply situation and provide a cautious recommendation.

You MUST respond ONLY with a single valid JSON object containing exactly these fields:
{
  "outlook": "LOW_RISK" | "MODERATE_RISK" | "HIGH_RISK",
  "urgency": "LOW" | "MEDIUM" | "HIGH",
  "summary": "Clear 1-2 sentence overview of the demand and supply situation.",
  "keyFactors": ["Factor 1", "Factor 2", "Factor 3"],
  "recommendation": "Actionable, cautious recommendation."
}

Do not surround the JSON with markdown code blocks or additional text.
`.trim();

/**
 * Validates that an object strictly adheres to the Demand Intelligence schema.
 */
function validateIntelligenceSchema(data) {
  if (!data || typeof data !== "object") return false;

  const validOutlooks  = ["LOW_RISK", "MODERATE_RISK", "HIGH_RISK"];
  const validUrgencies = ["LOW", "MEDIUM", "HIGH"];

  if (!validOutlooks.includes(data.outlook)) return false;
  if (!validUrgencies.includes(data.urgency)) return false;
  if (typeof data.summary !== "string" || !data.summary.trim()) return false;
  if (!Array.isArray(data.keyFactors) || data.keyFactors.length === 0) return false;
  if (typeof data.recommendation !== "string" || !data.recommendation.trim()) return false;

  return true;
}

/**
 * Fallback response calculated deterministically when AI is unavailable or malformed.
 */
function getControlledFallback(context) {
  const remaining = context.demand?.remainingQuantity ?? 0;
  const potential = context.supplySummary?.totalPotentialSupply ?? 0;

  let outlook = "MODERATE_RISK";
  let urgency = "MEDIUM";

  if (potential >= remaining && remaining > 0) {
    outlook = "LOW_RISK";
    urgency = "LOW";
  } else if (potential === 0 && remaining > 0) {
    outlook = "HIGH_RISK";
    urgency = "HIGH";
  }

  return {
    outlook,
    urgency,
    summary: `Demand for ${context.demand?.productName || "this crop"} has ${remaining} units remaining with ${potential} potential supply identified.`,
    keyFactors: [
      `Remaining demand: ${remaining} ${context.demand?.unit || "units"}`,
      `Potential available supply: ${potential} ${context.demand?.unit || "units"}`,
      `Highest match score: ${context.supplySummary?.highestMatchScore ?? 0}%`,
    ],
    recommendation: "Review active farmer supply matches and coordinate pool commitments.",
  };
}

/**
 * Helper to call Groq API endpoint.
 */
async function callGroqApi(context, isRetry = false) {
  const apiKey = process.env.GROQ_API_KEY;
  const model  = process.env.GROQ_MODEL || "qwen/qwen3.6-27b";

  if (!apiKey) {
    return { success: false, unavailable: true, message: "Demand intelligence is temporarily unavailable." };
  }

  const userMessage = JSON.stringify(context, null, 2);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Structured demand data:\n${userMessage}` },
  ];

  if (isRetry) {
    messages.push({
      role: "user",
      content: "CRITICAL: Return ONLY a raw JSON object matching the requested schema. No markdown backticks.",
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2, // low temperature for consistent analytical output
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false, unavailable: true, message: "Demand intelligence is temporarily unavailable." };
    }

    const json = await res.json();
    const rawContent = json.choices?.[0]?.message?.content;

    if (!rawContent) {
      return { success: false, unavailable: true, message: "Demand intelligence is temporarily unavailable." };
    }

    // Sanitize markdown code blocks if model included them despite instructions
    const cleaned = rawContent.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(cleaned);

    if (validateIntelligenceSchema(parsed)) {
      return { success: true, data: parsed };
    }

    return { success: false, invalidSchema: true };
  } catch (err) {
    clearTimeout(timeoutId);
    return { success: false, unavailable: true, message: "Demand intelligence is temporarily unavailable." };
  }
}

/**
 * Main export: analyzeDemandIntelligence(context)
 */
async function analyzeDemandIntelligence(context) {
  // Try calling Groq API
  let result = await callGroqApi(context, false);

  // If missing key or network error -> return unavailable
  if (result.unavailable) {
    return { success: false, message: result.message };
  }

  // If schema was invalid, retry once
  if (result.invalidSchema) {
    result = await callGroqApi(context, true);
    if (result.success) {
      return { success: true, data: result.data };
    }
    // Controlled fallback if second attempt fails
    return { success: true, data: getControlledFallback(context) };
  }

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, message: "Demand intelligence is temporarily unavailable." };
}

module.exports = {
  analyzeDemandIntelligence,
  validateIntelligenceSchema,
  getControlledFallback,
};

