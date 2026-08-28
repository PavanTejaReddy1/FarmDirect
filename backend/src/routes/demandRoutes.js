const express = require("express");
const router = express.Router();
const { getDemands, createDemand, getDemandById, joinDemand } =
  require("../controllers/demandController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/",          getDemands);                                         // public
router.post("/",         protect, authorizeRoles("CONSUMER"), createDemand); // CONSUMER only
router.get("/:id",       getDemandById);                                      // public
router.post("/:id/join", protect, authorizeRoles("CONSUMER"), joinDemand);   // CONSUMER only

module.exports = router;
