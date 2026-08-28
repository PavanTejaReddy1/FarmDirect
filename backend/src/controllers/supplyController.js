const Supply = require("../models/Supply");

// ── GET /api/supplies — authenticated farmers see own supply ──────────────
// protect applied in the route file; a farmer only sees their own items.
// GET is protected so supply data isn't public.
async function getSupplies(req, res, next) {
  try {
    const { category, location, status } = req.query;
    const filter = {};

    // Scope to the authenticated farmer's supplies
    if (req.user) {
      filter.farmer = req.user._id;
    }
    if (category) filter.category = { $regex: `^${category}$`, $options: "i" };
    if (location) filter.location = { $regex: `^${location}$`, $options: "i" };
    if (status)   filter.status   = status.toUpperCase();

    const supplies = await Supply.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: supplies });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/supplies — FARMER only ─────────────────────────────────────
async function createSupply(req, res, next) {
  try {
    const { productName, category, quantity, unit, location, availableFrom, availableUntil, note } =
      req.body;

    const supply = await Supply.create({
      farmer: req.user._id,           // identity from JWT
      farmerName: req.user.name,      // denormalised for display / back-compat
      productName,
      category,
      quantity,
      unit: unit || "kg",
      location: location || req.user.location,
      availableFrom: availableFrom || undefined,
      availableUntil: availableUntil || undefined,
      note: note || "",
      committedQuantity: 0,
      status: "AVAILABLE",
    });

    res.status(201).json({ success: true, data: supply });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/supplies/:id ─────────────────────────────────────────────────
async function getSupplyById(req, res, next) {
  try {
    const supply = await Supply.findById(req.params.id);
    if (!supply) {
      return res.status(404).json({ success: false, message: "Supply not found." });
    }
    // Only the owning farmer may retrieve it by ID
    if (
      supply.farmer &&
      req.user &&
      supply.farmer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    res.json({ success: true, data: supply });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSupplies, createSupply, getSupplyById };
