const mongoose = require("mongoose");

const COMMITMENT_STATUS = ["PENDING", "PARTIALLY_FULFILLED", "FULFILLED"];

const commitmentSchema = new mongoose.Schema(
  {
    demand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Demand",
      required: [true, "Demand reference is required."],
    },
    supply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supply",
      required: [true, "Supply reference is required."],
    },
    // ── Auth: the farmer who made this commitment ─────────────────────
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Retained for backward-compat with existing documents
    farmerName: {
      type: String,
      trim: true,
      default: "",
    },
    quantity: {
      type: Number,
      required: [true, "Commitment quantity is required."],
      min: [0.01, "Commitment quantity must be greater than 0."],
    },
    status: {
      type: String,
      enum: {
        values: COMMITMENT_STATUS,
        message: `Status must be one of: ${COMMITMENT_STATUS.join(", ")}.`,
      },
      default: "PENDING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Commitment", commitmentSchema);
