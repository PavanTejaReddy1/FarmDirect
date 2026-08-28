/**
 * matchingService.js
 *
 * The deterministic FarmDirect matching engine.
 *
 * SCORE FORMULA (total 100 pts)
 * ─────────────────────────────
 *  A. Product compatibility   35 pts  (productNormalization.js)
 *  B. Quantity suitability    25 pts  (how much of remaining demand supply covers)
 *  C. Location proximity      20 pts  (locationService.js — Haversine)
 *  D. Date compatibility      10 pts  (supply window vs demand deadline)
 *  E. Price compatibility     10 pts  (supply price vs demand expected price)
 *
 * PRICE NOTE
 * ──────────
 * The current Demand and Supply models do not store a price field.
 * The spec says: "If price information doesn't exist, do NOT invent a
 * score; redistribute the available points proportionally."
 * When price is unavailable the 10 pts are redistributed:
 *   Product  → +3.5  (≈35%)   → 38.5  rounded to 38
 *   Quantity → +2.5  (≈25%)   → 27.5  rounded to 28
 *   Location → +2    (≈20%)   → 22
 *   Date     → +1    (≈10%)   → 11
 *   Price    →  0    (N/A)
 * Total cap stays at 100 via the final Math.min.
 *
 * We keep this redistribution logic explicit so it is easy to disable
 * once price fields are added to the models.
 */

const Demand  = require("../models/Demand");
const Supply  = require("../models/Supply");
const { scoreProductCompatibility } = require("../utils/productNormalization");
const { scoreLocation, getDistanceKm } = require("./locationService");

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_RESULTS = 10; // returned by findBestSupplyMatches

// ─── A. Product ───────────────────────────────────────────────────────────────

// Delegated to productNormalization — 35 pts max, returns reason string.

// ─── B. Quantity suitability ─────────────────────────────────────────────────

/**
 * Score how well `availableQty` covers `remainingDemand` (max 25 pts).
 *
 *   coverage = availableQty / remainingDemand   (capped at 1.0)
 *
 *   ≥ 100% → 25   (can fully cover remaining demand on its own)
 *   ≥  75% → 22
 *   ≥  50% → 18
 *   ≥  25% → 12
 *   ≥  10% → 6
 *    <  10% → 2
 */
function scoreQuantity(availableQty, remainingDemand) {
  if (!remainingDemand || remainingDemand <= 0) return { score: 0, reason: "No remaining demand", coverage: 0 };
  if (!availableQty || availableQty <= 0)       return { score: 0, reason: "No available supply", coverage: 0 };

  const coverage = Math.min(availableQty / remainingDemand, 1);
  const pct = Math.round(coverage * 100);

  let score, label;
  if (coverage >= 1.0)   { score = 25; label = "Can fully cover remaining demand"; }
  else if (coverage >= 0.75) { score = 22; label = `Can cover ${pct}% of remaining demand`; }
  else if (coverage >= 0.50) { score = 18; label = `Can cover ${pct}% of remaining demand`; }
  else if (coverage >= 0.25) { score = 12; label = `Can cover ${pct}% of remaining demand`; }
  else if (coverage >= 0.10) { score =  6; label = `Can cover ${pct}% of remaining demand`; }
  else                        { score =  2; label = `Can cover only ${pct}% of remaining demand`; }

  return { score, reason: label, coverage };
}

// ─── D. Date compatibility ────────────────────────────────────────────────────

/**
 * Score based on whether the supply's availability window overlaps the
 * demand's delivery deadline (max 10 pts).
 *
 * Rules:
 *   10 — supply.availableFrom  ≤ demand.deliveryDate AND
 *         supply.availableUntil ≥ demand.deliveryDate  (full overlap)
 *    5 — supply.availableFrom  ≤ demand.deliveryDate  (starts in time,
 *         might expire early — we don't know end date)
 *    0 — supply.availableFrom  > demand.deliveryDate  (arrives too late)
 *    5 — supply has no dates  (no information — neutral)
 */
function scoreDate(supplyAvailableFrom, supplyAvailableUntil, demandDeliveryDate) {
  if (!demandDeliveryDate) return { score: 5, reason: "Demand delivery date unknown" };

  const deadline = new Date(demandDeliveryDate);

  // Supply has no availability dates — neutral
  if (!supplyAvailableFrom && !supplyAvailableUntil) {
    return { score: 5, reason: "Supply availability dates not specified" };
  }

  const from  = supplyAvailableFrom  ? new Date(supplyAvailableFrom)  : null;
  const until = supplyAvailableUntil ? new Date(supplyAvailableUntil) : null;

  // Starts after deadline
  if (from && from > deadline) {
    return { score: 0, reason: "Supply not available before required date" };
  }

  // Starts on time AND ends on or after deadline
  if (from && from <= deadline && until && until >= deadline) {
    return { score: 10, reason: "Supply available within the required window" };
  }

  // Starts on time but no known end date (or ends before deadline)
  if (from && from <= deadline) {
    return { score: 5, reason: "Supply starts before deadline — end date uncertain" };
  }

  return { score: 5, reason: "Partial date compatibility" };
}

// ─── E. Price compatibility ───────────────────────────────────────────────────

/**
 * Currently neither Demand nor Supply store a price field that belongs to
 * the matching calculation. Return null to trigger redistribution.
 *
 * When price fields exist, implement here and remove the redistribution.
 */
function scorePrice(/* demand, supply */) {
  return null; // explicitly absent → triggers point redistribution
}

// ─── Redistribution when price is absent ─────────────────────────────────────

function redistributeIfNoPriceScore(raw) {
  // raw: { product, quantity, location, date, price: null }
  if (raw.price !== null) return raw; // price scored — no redistribution needed

  // Redistribute 10 pts proportionally (35 : 25 : 20 : 10 = 7 : 5 : 4 : 2 shares)
  return {
    product:  Math.round(raw.product  * (38 / 35)),
    quantity: Math.round(raw.quantity * (28 / 25)),
    location: Math.round(raw.location * (22 / 20)),
    date:     Math.round(raw.date     * (12 / 10)),
    price:    null,
  };
}

// ─── Core: calculateMatchScore ────────────────────────────────────────────────

/**
 * calculateMatchScore(demand, supply)
 *
 * Accepts plain objects (document.toObject() or lean query results).
 * Returns a MatchResult:
 * {
 *   supplyId, farmerId, farmerName,
 *   productName, availableQuantity, remainingDemand,
 *   suggestedCommitment,
 *   score (0–100),
 *   scoreBreakdown: { product, quantity, location, date, price },
 *   reasons: string[],
 *   warnings: string[],
 *   distanceKm: number|null,
 *   isCompatible: boolean,
 * }
 */
function calculateMatchScore(demand, supply) {
  const remainingDemand = Math.max(
    (demand.quantity || 0) - (demand.fulfilledQuantity || 0),
    0
  );
  const availableSupply = Math.max(
    (supply.quantity || 0) - (supply.committedQuantity || 0),
    0
  );

  const reasons  = [];
  const warnings = [];

  // ── A. Product ──────────────────────────────────────────────────────────
  const productResult = scoreProductCompatibility(demand.productName, supply.productName);
  if (!productResult.isCompatible) {
    return {
      supplyId: supply._id,
      farmerId: supply.farmer,
      farmerName: supply.farmerName || "Unknown",
      productName: supply.productName,
      availableQuantity: availableSupply,
      remainingDemand,
      suggestedCommitment: 0,
      score: 0,
      scoreBreakdown: { product: 0, quantity: 0, location: 0, date: 0, price: null },
      reasons: [],
      warnings: [productResult.reason],
      distanceKm: null,
      isCompatible: false,
    };
  }
  reasons.push(productResult.reason);

  // ── B. Quantity ─────────────────────────────────────────────────────────
  const quantityResult = scoreQuantity(availableSupply, remainingDemand);
  if (quantityResult.score > 0) reasons.push(quantityResult.reason);
  else warnings.push(quantityResult.reason);

  // ── C. Location ─────────────────────────────────────────────────────────
  const locationResult = scoreLocation(demand.location, supply.location);
  reasons.push(locationResult.reason);

  // ── D. Date ─────────────────────────────────────────────────────────────
  const dateResult = scoreDate(
    supply.availableFrom,
    supply.availableUntil,
    demand.deliveryDate
  );
  if (dateResult.score === 0) warnings.push(dateResult.reason);
  else reasons.push(dateResult.reason);

  // ── E. Price ─────────────────────────────────────────────────────────────
  const priceScore = scorePrice(demand, supply); // null = no data
  if (priceScore === null) warnings.push("Price comparison not available — points redistributed");

  // ── Redistribution ───────────────────────────────────────────────────────
  const rawBreakdown = {
    product:  productResult.score,
    quantity: quantityResult.score,
    location: locationResult.score,
    date:     dateResult.score,
    price:    priceScore,
  };
  const breakdown = redistributeIfNoPriceScore(rawBreakdown);

  const score = Math.min(
    breakdown.product + breakdown.quantity + breakdown.location + breakdown.date,
    100
  );

  // ── Suggested commitment ─────────────────────────────────────────────────
  const suggestedCommitment = Math.min(availableSupply, remainingDemand);

  return {
    supplyId:            supply._id?.toString() ?? supply._id,
    farmerId:            supply.farmer?.toString() ?? null,
    farmerName:          supply.farmerName || "Unknown",
    productName:         supply.productName,
    availableQuantity:   availableSupply,
    remainingDemand,
    suggestedCommitment,
    score,
    scoreBreakdown:      breakdown,
    reasons,
    warnings,
    distanceKm:          locationResult.distanceKm,
    isCompatible:        true,
  };
}

// ─── findBestSupplyMatches ────────────────────────────────────────────────────

/**
 * findBestSupplyMatches(demandId, requestingUser?)
 *
 * 1. Load demand from DB.
 * 2. Compute remainingDemand.
 * 3. Load eligible supplies (not fully committed, not expired).
 * 4. Score each supply.
 * 5. Exclude incompatible.
 * 6. Sort: score desc → coverage desc → distanceKm asc.
 * 7. Return top MAX_RESULTS.
 *
 * requestingUser is attached for future ownership/privacy checks.
 */
async function findBestSupplyMatches(demandId, requestingUser = null) {
  const demand = await Demand.findById(demandId).lean();
  if (!demand) throw Object.assign(new Error("Demand not found."), { statusCode: 404 });

  if (demand.status === "FULFILLED") {
    return { demand, matches: [], message: "This demand is already fulfilled." };
  }

  const remainingDemand = demand.quantity - demand.fulfilledQuantity;
  const today = new Date();

  // Load supplies that are not fully committed and not completely expired
  const supplies = await Supply.find({
    status: { $ne: "FULLY_COMMITTED" },
    $or: [
      { availableUntil: { $gte: today } },
      { availableUntil: null },
    ],
  }).lean();

  const scored = supplies
    .map((s) => calculateMatchScore(demand, s))
    .filter((m) => m.isCompatible && m.score > 0);

  // Sort: score desc, then coverage desc, then distance asc
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const covA = a.remainingDemand > 0 ? a.availableQuantity / a.remainingDemand : 0;
    const covB = b.remainingDemand > 0 ? b.availableQuantity / b.remainingDemand : 0;
    if (covB !== covA) return covB - covA;
    const dA = a.distanceKm ?? 999;
    const dB = b.distanceKm ?? 999;
    return dA - dB;
  });

  return {
    demand: {
      id: demand._id,
      productName: demand.productName,
      category: demand.category,
      quantity: demand.quantity,
      fulfilledQuantity: demand.fulfilledQuantity,
      remainingDemand,
      unit: demand.unit,
      location: demand.location,
      deliveryDate: demand.deliveryDate,
      status: demand.status,
    },
    matches: scored.slice(0, MAX_RESULTS),
  };
}

// ─── findFulfillmentCombination ───────────────────────────────────────────────

/**
 * findFulfillmentCombination(demandId)
 *
 * Greedy algorithm:
 *   1. Get scored, sorted matches for the demand.
 *   2. Walk the list in order (highest score first).
 *   3. From each supply allocate min(supplyAvailable, stillNeeded).
 *   4. Continue until demand satisfied or no more supplies.
 *
 * Returns:
 * {
 *   demandId, requestedQuantity, remainingQuantity,
 *   totalRecommendedQuantity, fulfillmentPercentage,
 *   fulfillmentStatus: "FULLY_FULFILLED" | "PARTIALLY_FULFILLED" | "NOT_FULFILLABLE",
 *   matches: MatchResult[] (with allocatedQuantity added)
 * }
 */
async function findFulfillmentCombination(demandId) {
  const { demand, matches, message } = await findBestSupplyMatches(demandId);

  if (message) {
    // Already fulfilled or no demand
    return {
      demandId,
      requestedQuantity: demand?.quantity ?? 0,
      remainingQuantity: 0,
      totalRecommendedQuantity: 0,
      fulfillmentPercentage: 100,
      fulfillmentStatus: "FULLY_FULFILLED",
      matches: [],
      message,
    };
  }

  let stillNeeded = demand.remainingDemand;
  const chosen = [];

  for (const match of matches) {
    if (stillNeeded <= 0) break;
    const allocate = Math.min(match.availableQuantity, stillNeeded);
    if (allocate <= 0) continue;
    chosen.push({ ...match, allocatedQuantity: allocate });
    stillNeeded -= allocate;
  }

  const totalRecommended = demand.remainingDemand - stillNeeded;
  const pct = demand.quantity > 0
    ? Math.min(
        Math.round(
          ((demand.fulfilledQuantity + totalRecommended) / demand.quantity) * 100
        ),
        100
      )
    : 0;

  let fulfillmentStatus;
  if (stillNeeded <= 0)                       fulfillmentStatus = "FULLY_FULFILLED";
  else if (totalRecommended > 0)              fulfillmentStatus = "PARTIALLY_FULFILLED";
  else                                         fulfillmentStatus = "NOT_FULFILLABLE";

  return {
    demandId,
    requestedQuantity:        demand.quantity,
    remainingQuantity:        stillNeeded,
    totalRecommendedQuantity: totalRecommended,
    fulfillmentPercentage:    pct,
    fulfillmentStatus,
    matches: chosen,
  };
}

// ─── getDemandMatches (convenience wrapper) ───────────────────────────────────

/**
 * getDemandMatches(demandId, requestingUser?)
 * Thin wrapper that can later apply user-specific filtering.
 */
async function getDemandMatches(demandId, requestingUser = null) {
  return findBestSupplyMatches(demandId, requestingUser);
}

module.exports = {
  calculateMatchScore,
  findBestSupplyMatches,
  findFulfillmentCombination,
  getDemandMatches,
  // Exported for unit tests
  scoreQuantity,
  scoreDate,
};
