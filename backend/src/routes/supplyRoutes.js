const express = require("express");
const router = express.Router();
const { getSupplies, createSupply, getSupplyById } =
  require("../controllers/supplyController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/",    protect, authorizeRoles("FARMER"), getSupplies);
router.post("/",   protect, authorizeRoles("FARMER"), createSupply);
router.get("/:id", protect, authorizeRoles("FARMER"), getSupplyById);

module.exports = router;
