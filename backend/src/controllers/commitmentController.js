const mongoose = require("mongoose");
const Commitment = require("../models/Commitment");
const Demand = require("../models/Demand");
const Supply = require("../models/Supply");

// ── GET /api/commitments — authenticated farmers see own commitments ───────
async function getCommitments(req, res, next) {
  try {
    const filter = {};
    // Scope to the authenticated farmer
    if (req.user) filter.farmer = req.user._id;

    const commitments = await Commitment.find(filter)
      .populate("demand", "productName category quantity fulfilledQuantity unit location deliveryDate status")
      .populate("supply", "productName farmerName quantity committedQuantity unit location status")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: commitments });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/commitments — FARMER only ──────────────────────────────────
async function createCommitment(req, res, next) {
  const { demandId, supplyId, quantity } = req.body;

  if (!demandId || !supplyId) {
    return res.status(400).json({ success: false, message: "demandId and supplyId are required." });
  }
  if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
    return res.status(400).json({ success: false, message: "quantity must be a number greater than 0." });
  }

  const qty = Number(quantity);
  const session = await mongoose.startSession();

  try {
    let commitment;

    await session.withTransaction(async () => {
      const demand = await Demand.findById(demandId).session(session);
      if (!demand) {
        const err = new Error("Demand not found."); err.statusCode = 404; throw err;
      }

      const supply = await Supply.findById(supplyId).session(session);
      if (!supply) {
        const err = new Error("Supply not found."); err.statusCode = 404; throw err;
      }

      // ── Ownership check: supply must belong to the authenticated farmer ──
      if (supply.farmer && supply.farmer.toString() !== req.user._id.toString()) {
        const err = new Error("You can only commit your own supply.");
        err.statusCode = 403;
        throw err;
      }

      if (demand.status === "FULFILLED") {
        const err = new Error("This demand is already fully fulfilled.");
        err.statusCode = 400; throw err;
      }

      const remainingDemand = demand.quantity - demand.fulfilledQuantity;
      if (qty > remainingDemand) {
        const err = new Error(`Requested quantity (${qty}) exceeds remaining demand (${remainingDemand}).`);
        err.statusCode = 400; throw err;
      }

      const remainingSupply = supply.quantity - supply.committedQuantity;
      if (qty > remainingSupply) {
        const err = new Error(`Requested quantity (${qty}) exceeds your available supply (${remainingSupply}).`);
        err.statusCode = 400; throw err;
      }

      [commitment] = await Commitment.create(
        [{
          demand: demand._id,
          supply: supply._id,
          farmer: req.user._id,           // identity from JWT
          farmerName: req.user.name,      // denormalised for display
          quantity: qty,
          status: "PENDING",
        }],
        { session }
      );

      demand.fulfilledQuantity += qty;
      demand.recalcStatus();
      await demand.save({ session });

      supply.committedQuantity += qty;
      supply.recalcStatus();
      await supply.save({ session });
    });

    await commitment.populate("demand", "productName category quantity fulfilledQuantity unit location deliveryDate status");
    await commitment.populate("supply", "productName farmerName quantity committedQuantity unit location status");

    res.status(201).json({ success: true, data: commitment });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
}

module.exports = { getCommitments, createCommitment };
