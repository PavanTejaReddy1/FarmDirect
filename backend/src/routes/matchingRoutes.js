const express = require("express");
const router = express.Router();
const {
  getDemandMatchesHandler,
  getRecommendationHandler,
  getMyOpportunitiesHandler,
} = require("../controllers/matchingController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// All matching routes require authentication
router.use(protect);

// GET /api/matching/my-opportunities — FARMER only
router.get("/my-opportunities", authorizeRoles("FARMER"), getMyOpportunitiesHandler);

// GET /api/matching/demands/:demandId — any authenticated user
router.get("/demands/:demandId", getDemandMatchesHandler);

// GET /api/matching/demands/:demandId/recommendation — any authenticated user
router.get("/demands/:demandId/recommendation", getRecommendationHandler);

module.exports = router;
