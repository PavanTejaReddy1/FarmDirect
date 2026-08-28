const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  calculateMatchScore,
  scoreQuantity,
  scoreDate,
} = require("../src/services/matchingService");
const { scoreProductCompatibility, normalise } = require("../src/utils/productNormalization");
const { scoreLocation, getDistanceKm } = require("../src/services/locationService");

describe("FarmDirect Matching Engine Unit Tests", () => {
  // ── 1. Exact product match ───────────────────────────────────────────────
  it("1. Exact product match scores 35 points", () => {
    const res = scoreProductCompatibility("Fresh Tomatoes", "tomato");
    assert.equal(res.isCompatible, true);
    assert.equal(res.score, 35);
    assert.equal(res.reason, "Exact product match");
  });

  // ── 2. Product mismatch ──────────────────────────────────────────────────
  it("2. Product mismatch scores 0 points and is marked incompatible", () => {
    const res = scoreProductCompatibility("Tomatoes", "Apples");
    assert.equal(res.isCompatible, false);
    assert.equal(res.score, 0);
    assert.equal(res.reason, "Incompatible product");
  });

  it("2b. Product normalisation normalises variants and filler words", () => {
    assert.equal(normalise("Fresh Organic Tomatoes"), "tomato");
    assert.equal(normalise("Red Onions"), "red onion");
  });

  // ── 3. Quantity coverage ────────────────────────────────────────────────
  it("3. Quantity coverage scoring", () => {
    // 100% coverage -> 25 points
    const full = scoreQuantity(500, 500);
    assert.equal(full.score, 25);

    // 50% coverage -> 18 points
    const half = scoreQuantity(250, 500);
    assert.equal(half.score, 18);

    // 10% coverage -> 6 points
    const low = scoreQuantity(50, 500);
    assert.equal(low.score, 6);
  });

  // ── 4. Location scoring ─────────────────────────────────────────────────
  it("4. Location distance scoring bands", () => {
    // Kondapur to Gachibowli (~4 km -> 0-25km band -> 20 pts)
    const close = scoreLocation("Kondapur", "Gachibowli");
    assert.equal(close.score, 20);
    assert.ok(close.distanceKm !== null && close.distanceKm <= 25);

    // Kondapur to Vikarabad (~50 km -> 26-50km band -> 16 pts)
    const mid = scoreLocation("Kondapur", "Vikarabad");
    assert.equal(mid.score, 16);
    assert.equal(mid.distanceKm, 50);

    // Unknown location -> conservative default (7 pts)
    const unknown = scoreLocation("Kondapur", "Unknown Village XYZ");
    assert.equal(unknown.score, 7);
  });

  // ── 5. Date compatibility ───────────────────────────────────────────────
  it("5. Date compatibility scoring", () => {
    const today = new Date().toISOString().slice(0, 10);
    const futureDate = new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10);
    const pastDate = new Date(Date.now() - 86400000 * 10).toISOString().slice(0, 10);

    // Available during required window -> 10 pts
    const good = scoreDate(pastDate, futureDate, today);
    assert.equal(good.score, 10);

    // Supply starts after required date -> 0 pts
    const late = scoreDate(futureDate, futureDate, today);
    assert.equal(late.score, 0);
  });

  // ── 6. Fully committed supply excluded ─────────────────────────────────
  it("6. Fully committed supply returns 0 available quantity", () => {
    const demand = { productName: "Tomatoes", quantity: 500, fulfilledQuantity: 0, location: "Kondapur" };
    const supply = { _id: "s1", productName: "Tomatoes", quantity: 300, committedQuantity: 300, location: "Gachibowli" };
    const result = calculateMatchScore(demand, supply);
    assert.equal(result.availableQuantity, 0);
    assert.equal(result.suggestedCommitment, 0);
  });

  // ── 7. Incompatible supply excluded ────────────────────────────────────
  it("7. Incompatible product returns score 0 and isCompatible=false", () => {
    const demand = { productName: "Tomatoes", quantity: 500, fulfilledQuantity: 0 };
    const supply = { _id: "s1", productName: "Rice", quantity: 300, committedQuantity: 0 };
    const result = calculateMatchScore(demand, supply);
    assert.equal(result.isCompatible, false);
    assert.equal(result.score, 0);
  });

  // ── 8–10. Greedy combination test (Full, Partial, No fulfillment) ────
  it("8 & 9. Example test: 500 kg demand satisfied by supplies A (300kg), B (150kg), C (100kg)", () => {
    const demand = {
      _id: "d1",
      productName: "Tomatoes",
      quantity: 500,
      fulfilledQuantity: 0,
      location: "Kondapur",
      deliveryDate: new Date(Date.now() + 86400000 * 5),
    };

    const supplyA = { _id: "sa", farmerName: "Farmer A", productName: "Tomatoes", quantity: 300, committedQuantity: 0, location: "Gachibowli" };
    const supplyB = { _id: "sb", farmerName: "Farmer B", productName: "Tomatoes", quantity: 150, committedQuantity: 0, location: "Madhapur" };
    const supplyC = { _id: "sc", farmerName: "Farmer C", productName: "Tomatoes", quantity: 100, committedQuantity: 0, location: "Kukatpally" };

    const matches = [
      calculateMatchScore(demand, supplyA),
      calculateMatchScore(demand, supplyB),
      calculateMatchScore(demand, supplyC),
    ].sort((a, b) => b.score - a.score);

    let stillNeeded = demand.quantity;
    const allocated = [];

    for (const match of matches) {
      if (stillNeeded <= 0) break;
      const alloc = Math.min(match.availableQuantity, stillNeeded);
      allocated.push({ supplyId: match.supplyId, allocated: alloc });
      stillNeeded -= alloc;
    }

    const totalAllocated = allocated.reduce((sum, item) => sum + item.allocated, 0);

    assert.equal(stillNeeded, 0);
    assert.equal(totalAllocated, 500);
    assert.equal(allocated[0].allocated, 300); // Supply A
    assert.equal(allocated[1].allocated, 150); // Supply B
    assert.equal(allocated[2].allocated, 50);  // Supply C (50 allocated out of 100 available)

    // Verify no supply allocated beyond available
    assert.ok(allocated[0].allocated <= supplyA.quantity);
    assert.ok(allocated[1].allocated <= supplyB.quantity);
    assert.ok(allocated[2].allocated <= supplyC.quantity);
  });

  it("10. Partial fulfillment when available supply < demand", () => {
    const demand = { _id: "d1", productName: "Spinach", quantity: 500, fulfilledQuantity: 0, location: "Kondapur" };
    const supplyA = { _id: "sa", productName: "Spinach", quantity: 200, committedQuantity: 0, location: "Gachibowli" };

    const match = calculateMatchScore(demand, supplyA);
    const alloc = Math.min(match.availableQuantity, demand.quantity);

    assert.equal(alloc, 200);
    assert.equal(demand.quantity - alloc, 300); // 300 kg remaining
  });

  it("11. No fulfillment possible when no supplies exist or compatible", () => {
    const demand = { _id: "d1", productName: "Dragon Fruit", quantity: 100, fulfilledQuantity: 0 };
    const supplyA = { _id: "sa", productName: "Potatoes", quantity: 500, committedQuantity: 0 };

    const match = calculateMatchScore(demand, supplyA);
    assert.equal(match.isCompatible, false);
  });
});
