const mongoose = require("mongoose");

/**
 * Tracks which consumer joined which demand and how much quantity they
 * requested. One document per (demand, consumer) pair — the unique
 * compound index prevents double-joining.
 *
 * consumerCount on the Demand document is kept in sync for fast display;
 * the authoritative per-consumer breakdown lives here.
 */
const demandParticipantSchema = new mongoose.Schema(
  {
    demand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Demand",
      required: [true, "Demand reference is required."],
    },
    consumer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Consumer reference is required."],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required."],
      min: [0.01, "Quantity must be greater than 0."],
    },
  },
  { timestamps: true }
);

// One consumer can only join a given demand once
demandParticipantSchema.index({ demand: 1, consumer: 1 }, { unique: true });

module.exports = mongoose.model("DemandParticipant", demandParticipantSchema);
