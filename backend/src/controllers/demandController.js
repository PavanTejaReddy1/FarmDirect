const Demand = require("../models/Demand");
const DemandParticipant = require("../models/DemandParticipant");

// ── GET /api/demands — public ─────────────────────────────────────────────
async function getDemands(req, res, next) {
  try {
    const { search, category, location, status } = req.query;
    const filter = {};
    if (search)   filter.productName = { $regex: search, $options: "i" };
    if (category) filter.category   = { $regex: `^${category}$`, $options: "i" };
    if (location) filter.location   = { $regex: `^${location}$`, $options: "i" };
    if (status)   filter.status     = status.toUpperCase();

    const demands = await Demand.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: demands });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/demands — CONSUMER only ────────────────────────────────────
// protect + authorizeRoles("CONSUMER") applied in the route file.
async function createDemand(req, res, next) {
  try {
    const { productName, category, quantity, unit, location, deliveryDate, note } = req.body;

    const demand = await Demand.create({
      productName,
      category,
      quantity,
      unit: unit || "kg",
      location,
      deliveryDate,
      note: note || "",
      fulfilledQuantity: 0,
      consumerCount: 1,
      status: "OPEN",
      createdBy: req.user._id,        // identity from JWT, never from body
    });

    res.status(201).json({ success: true, data: demand });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/demands/:id — public ─────────────────────────────────────────
async function getDemandById(req, res, next) {
  try {
    const demand = await Demand.findById(req.params.id);
    if (!demand) {
      return res.status(404).json({ success: false, message: "Demand not found." });
    }
    res.json({ success: true, data: demand });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/demands/:id/join — CONSUMER only ────────────────────────────
// protect + authorizeRoles("CONSUMER") applied in the route file.
async function joinDemand(req, res, next) {
  try {
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (!quantity || isNaN(qty) || qty <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "quantity must be a number greater than 0." });
    }

    const demand = await Demand.findById(req.params.id);
    if (!demand) {
      return res.status(404).json({ success: false, message: "Demand not found." });
    }
    if (demand.status === "FULFILLED") {
      return res
        .status(400)
        .json({ success: false, message: "This demand is already fully fulfilled." });
    }

    const remaining = demand.quantity - demand.fulfilledQuantity;
    if (qty > remaining) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${qty}) exceeds the remaining demand (${remaining}).`,
      });
    }

    // ── Track the individual consumer join (unique per consumer per demand) ──
    const consumerId = req.user._id;
    const existing = await DemandParticipant.findOne({
      demand: demand._id,
      consumer: consumerId,
    });

    if (existing) {
      // Consumer already joined — add to their existing quantity
      existing.quantity += qty;
      await existing.save();
    } else {
      await DemandParticipant.create({
        demand: demand._id,
        consumer: consumerId,
        quantity: qty,
      });
      demand.consumerCount += 1;
    }

    demand.fulfilledQuantity += qty;
    demand.recalcStatus();
    await demand.save();

    res.json({ success: true, data: demand });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDemands, createDemand, getDemandById, joinDemand };
