const mongoose = require("mongoose");

const DEMAND_STATUS = ["OPEN", "PARTIALLY_FULFILLED", "FULFILLED"];

const demandSchema = new mongoose.Schema(
  {
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
    fulfilledQuantity: {
      type: Number,
      default: 0,
      min: [0, "Fulfilled quantity cannot be negative."],
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
    deliveryDate: {
      type: Date,
      required: [true, "Delivery date is required."],
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    consumerCount: {
      type: Number,
      default: 1,
      min: [1, "Consumer count must be at least 1."],
    },
    directPrice: {
      type: Number,
      default: null,
      min: [0, "Direct price cannot be negative."],
    },
    marketPrice: {
      type: Number,
      default: null,
      min: [0, "Market price cannot be negative."],
    },
    status: {
      type: String,
      enum: {
        values: DEMAND_STATUS,
        message: `Status must be one of: ${DEMAND_STATUS.join(", ")}.`,
      },
      default: "OPEN",
    },
    // ── Auth: who created this demand ─────────────────────────────────
    // Optional so legacy documents without a createdBy still load fine.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

demandSchema.methods.recalcStatus = function () {
  if (this.fulfilledQuantity >= this.quantity) {
    this.status = "FULFILLED";
  } else if (this.fulfilledQuantity > 0) {
    this.status = "PARTIALLY_FULFILLED";
  } else {
    this.status = "OPEN";
  }
};

module.exports = mongoose.model("Demand", demandSchema);
