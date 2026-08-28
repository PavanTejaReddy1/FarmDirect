const express = require("express");
const router = express.Router();
const { getCommitments, createCommitment } =
  require("../controllers/commitmentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/",  protect, authorizeRoles("FARMER"), getCommitments);
router.post("/", protect, authorizeRoles("FARMER"), createCommitment);

module.exports = router;
