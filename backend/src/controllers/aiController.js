/**
 * aiController.js
 *
 * Controller for Demand Intelligence endpoint.
 * Evaluates authorization, builds structured factual context, and calls aiService.
 */

const Demand = require("../models/Demand");
const DemandParticipant = require("../models/DemandParticipant");
const Supply = require("../models/Supply");
const { findBestSupplyMatches } = require("../services/matchingService");
const { analyzeDemandIntelligence } = require("../services/aiService");

// ── GET /api/ai/demands/:demandId/intelligence ──────────────────────────────
async function getDemandIntelligenceHandler(req, res, next) {
  try {
    const { demandId } = req.params;
    const user = req.user;

    // 1. Load demand
    const demandDoc = await Demand.findById(demandId).lean();
    if (!demandDoc) {
      return res.status(404).json({
        success: false,
        message: "Demand not found.",
      });
    }

    // 2. Authorization checks
    if (user.role === "CONSUMER") {
      const isCreator =
        demandDoc.createdBy && demandDoc.createdBy.toString() === user._id.toString();

      const isParticipant = await DemandParticipant.exists({
        demand: demandId,
        consumer: user._id,
      });

      if (!isCreator && !isParticipant) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only view intelligence for demands you created or joined.",
        });
      }
    } else if (user.role === "FARMER") {
      // Farmers can view intelligence for open/filling demands or demands relevant to their crop category
      const farmerSupplies = await Supply.exists({ farmer: user._id });
      if (!farmerSupplies && demandDoc.status === "FULFILLED") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Demand is closed and not relevant to your inventory.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied. Unauthorized role.",
      });
    }

    // 3. Calculate deterministic matches & factual context
    const matchResult = await findBestSupplyMatches(demandId);
    const matches = matchResult.matches || [];

    const remaining = Math.max(demandDoc.quantity - demandDoc.fulfilledQuantity, 0);
    const totalPotentialSupply = matches.reduce((sum, m) => sum + (m.availableQuantity || 0), 0);

    const potentialCoveragePercentage = remaining > 0
      ? Math.min(Math.round((totalPotentialSupply / remaining) * 100), 100)
      : 100;

    const scores = matches.map((m) => m.score || 0);
    const highestMatchScore = scores.length > 0 ? Math.max(...scores) : 0;
    const averageMatchScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    let daysUntilDeadline = null;
    if (demandDoc.deliveryDate) {
      const diffTime = new Date(demandDoc.deliveryDate) - new Date();
      daysUntilDeadline = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
    }

    const structuredContext = {
      demand: {
        productName:       demandDoc.productName,
        category:          demandDoc.category,
        quantity:          demandDoc.quantity,
        fulfilledQuantity: demandDoc.fulfilledQuantity,
        remainingQuantity: remaining,
        unit:              demandDoc.unit || "kg",
        location:          demandDoc.location,
        deliveryDate:      demandDoc.deliveryDate,
        daysUntilDeadline,
        status:            demandDoc.status,
      },
      supplySummary: {
        totalPotentialSupply,
        numberOfPotentialFarmers: matches.length,
        highestMatchScore,
        averageMatchScore,
        potentialCoveragePercentage,
      },
      matches: matches.map((m) => ({
        farmerName:          m.farmerName || "Farmer",
        productName:         m.productName,
        availableQuantity:   m.availableQuantity,
        suggestedCommitment: m.suggestedCommitment,
        score:               m.score,
        distanceKm:          m.distanceKm,
        reasons:             m.reasons || [],
      })),
    };

    // 4. Call AI service
    const aiResult = await analyzeDemandIntelligence(structuredContext);

    if (!aiResult.success) {
      return res.status(503).json({
        success: false,
        message: aiResult.message || "Demand intelligence is currently unavailable.",
      });
    }

    return res.json({
      success: true,
      data: aiResult.data,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDemandIntelligenceHandler,
};
