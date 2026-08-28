const mongoose = require("mongoose");

const SUPPLY_STATUS = ["AVAILABLE", "PARTIALLY_COMMITTED", "FULLY_COMMITTED"];

const supplySchema = new mongoose.Schema(
  {
    // ── Auth: who owns this supply ────────────────────────────────────
    // Optional so legacy documents without farmer still load fine.
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Keep farmerName for backward-compat display (populated from User
    // on create when auth is present; kept as a string for old records).
    farmerName: {
      type: String,
      trim: true,
      default: "",
    },
    productName: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required."],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required."],
      min: [0.01, "Quantity must be greater than 0."],
    },
    committedQuantity: {
      type: Number,
      default: 0,
      min: [0, "Committed quantity cannot be negative."],
    },
    unit: {
      type: String,
      default: "kg",
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required."],
      trim: true,
    },
    availableFrom: { type: Date },
    availableUntil: { type: Date },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: SUPPLY_STATUS,
        message: `Status must be one of: ${SUPPLY_STATUS.join(", ")}.`,
      },
      default: "AVAILABLE",
    },
  },
  { timestamps: true }
);

supplySchema.methods.recalcStatus = function () {
  if (this.committedQuantity >= this.quantity) {
    this.status = "FULLY_COMMITTED";
  } else if (this.committedQuantity > 0) {
    this.status = "PARTIALLY_COMMITTED";
  } else {
    this.status = "AVAILABLE";
  }
};

module.exports = mongoose.model("Supply", supplySchema);
