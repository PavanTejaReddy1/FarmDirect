const express = require("express");
const router = express.Router();
const { getDemandIntelligenceHandler } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

// All AI intelligence routes require authentication
router.use(protect);

// GET /api/ai/demands/:demandId/intelligence
router.get("/demands/:demandId/intelligence", getDemandIntelligenceHandler);

module.exports = router;

