/**
 * matchingController.js
 *
 * Thin HTTP wrapper around matchingService.js.
 * All business logic lives in the service — controllers only handle
 * request/response shaping, auth checks, and error forwarding.
 */

const {
  getDemandMatches,
  findFulfillmentCombination,
  findBestSupplyMatches,
  calculateMatchScore,
} = require("../services/matchingService");

const Demand = require("../models/Demand");
const Supply = require("../models/Supply");

// ── GET /api/matching/demands/:demandId ──────────────────────────────────────
// Returns the best supply matches for a given demand.
// Access:
//   - CONSUMER who owns the demand
//   - FARMER (any) — sees the demand opportunity with match data for their own supply
async function getDemandMatchesHandler(req, res, next) {
  try {
    const result = await getDemandMatches(req.params.demandId, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/matching/demands/:demandId/recommendation ───────────────────────
// Returns the greedy fulfillment combination for a demand.
async function getRecommendationHandler(req, res, next) {
  try {
    const result = await findFulfillmentCombination(req.params.demandId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/matching/my-opportunities ───────────────────────────────────────
// FARMER only.
// Returns all unfulfilled demands, each annotated with the best match score
// this farmer's supply can achieve.
// farmerId comes from req.user._id — never from query params.
async function getMyOpportunitiesHandler(req, res, next) {
  try {
    const farmerId = req.user._id;

    // Load this farmer's available supplies (not fully committed)
    const mySupplies = await Supply.find({
      farmer: farmerId,
      status: { $ne: "FULLY_COMMITTED" },
    }).lean();

    // Load all open / partially-fulfilled demands
    const demands = await Demand.find({
      status: { $in: ["OPEN", "PARTIALLY_FULFILLED"] },
    }).lean();

    // For each demand, find the best match score across the farmer's supplies
    const opportunities = demands.map((demand) => {
      let bestMatch = null;

      for (const supply of mySupplies) {
        const match = calculateMatchScore(demand, supply);
        if (!match.isCompatible) continue;
        if (!bestMatch || match.score > bestMatch.score) {
          bestMatch = match;
        }
      }

      const remaining = Math.max(demand.quantity - demand.fulfilledQuantity, 0);

      return {
        demand: {
          id:               demand._id,
          productName:      demand.productName,
          category:         demand.category,
          unit:             demand.unit,
          quantity:         demand.quantity,
          fulfilledQuantity: demand.fulfilledQuantity,
          remaining,
          location:         demand.location,
          deliveryDate:     demand.deliveryDate,
          consumerCount:    demand.consumerCount,
          status:           demand.status,
        },
        matchScore:      bestMatch ? bestMatch.score : 0,
        scoreBreakdown:  bestMatch ? bestMatch.scoreBreakdown : null,
        reasons:         bestMatch ? bestMatch.reasons : [],
        warnings:        bestMatch ? bestMatch.warnings : ["No matching supply in your inventory"],
        bestSupplyId:    bestMatch ? bestMatch.supplyId : null,
        suggestedCommitment: bestMatch ? bestMatch.suggestedCommitment : 0,
        distanceKm:      bestMatch ? bestMatch.distanceKm : null,
        hasMatchingSupply: bestMatch !== null,
      };
    });

    // Sort by matchScore descending — best opportunities first
    opportunities.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ success: true, data: opportunities });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDemandMatchesHandler,
  getRecommendationHandler,
  getMyOpportunitiesHandler,
};
