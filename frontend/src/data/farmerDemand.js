// Mock data for the farmer dashboard.
// Shape is API-ready — a future fetch() can replace these exports unchanged.

export const farmerProfile = {
  id: "farmer-001",
  name: "Suresh Reddy",
  farmName: "Reddy Organic Farms",
  location: "Anantapur, Andhra Pradesh",
  distanceToHyd: 72, // km to Hyderabad
  crops: ["Vegetables", "Fruits", "Leafy Greens"],
};

// ─── Demand opportunities ─────────────────────────────────────────────────
// These mirror the consumer-side collectiveDemands but carry farmer-specific
// fields: distanceKm, matchScore (deterministic frontend calc), and category.

export const demandOpportunities = [
  {
    id: "cd-001",
    name: "Vine Tomatoes",
    category: "Vegetables",
    unit: "kg",
    totalDemand: 320,
    matched: 245,
    remaining: 75,
    consumers: 58,
    targetDate: "2026-09-05",
    location: "Kondapur",
    directPrice: 34,
    marketPrice: 52,
    status: "filling",
    distanceKm: 68,
    description: "Ripe vine tomatoes from farms within 80 km of Hyderabad.",
  },
  {
    id: "cd-002",
    name: "Mixed Leafy Greens",
    category: "Leafy Greens",
    unit: "kg",
    totalDemand: 140,
    matched: 96,
    remaining: 44,
    consumers: 33,
    targetDate: "2026-09-08",
    location: "Gachibowli",
    directPrice: 28,
    marketPrice: 45,
    status: "open",
    distanceKm: 74,
    description: "Seasonal spinach, methi, and palak — harvested weekly.",
  },
  {
    id: "cd-003",
    name: "Yelakki Bananas",
    category: "Fruits",
    unit: "dozen",
    totalDemand: 210,
    matched: 205,
    remaining: 5,
    consumers: 71,
    targetDate: "2026-09-03",
    location: "Kondapur",
    directPrice: 42,
    marketPrice: 60,
    status: "filling",
    distanceKm: 68,
    description: "Small, sweet bananas — demand nearly filled.",
  },
  {
    id: "cd-004",
    name: "Toor Dal",
    category: "Grains & Pulses",
    unit: "kg",
    totalDemand: 500,
    matched: 180,
    remaining: 320,
    consumers: 45,
    targetDate: "2026-09-15",
    location: "Madhapur",
    directPrice: 110,
    marketPrice: 145,
    status: "open",
    distanceKm: 80,
    description: "Red gram dal — large unfilled pool, strong opportunity.",
  },
  {
    id: "cd-007",
    name: "Raw Mango",
    category: "Fruits",
    unit: "kg",
    totalDemand: 200,
    matched: 35,
    remaining: 165,
    consumers: 12,
    targetDate: "2026-09-20",
    location: "Gachibowli",
    directPrice: 55,
    marketPrice: 80,
    status: "open",
    distanceKm: 74,
    description: "Tangy raw mangoes — early demand, lots of room to fill.",
  },
  {
    id: "cd-008",
    name: "Sona Masoori Rice",
    category: "Grains & Pulses",
    unit: "kg",
    totalDemand: 800,
    matched: 620,
    remaining: 180,
    consumers: 130,
    targetDate: "2026-09-12",
    location: "Madhapur",
    directPrice: 58,
    marketPrice: 75,
    status: "filling",
    distanceKm: 80,
    description: "Premium Sona Masoori rice — large consumer base.",
  },
];

// ─── Match score calculation (deterministic, frontend-only) ───────────────
// Inputs: demand opportunity + farmer profile + farmer supply list.
// Returns 0–100. Replace with real ML signal later.
export function calcMatchScore(opportunity, supply) {
  let score = 0;

  // Category match (40 pts)
  const categoryMatch = farmerProfile.crops.includes(opportunity.category);
  if (categoryMatch) score += 40;

  // Supply coverage of remaining demand (30 pts)
  if (supply) {
    const coverage = Math.min(supply.availableQty / opportunity.remaining, 1);
    score += Math.round(coverage * 30);
  } else {
    // No declared supply yet — give partial credit based on category
    if (categoryMatch) score += 10;
  }

  // Distance score (20 pts) — closer = better
  const distScore = Math.max(0, 20 - Math.round((opportunity.distanceKm / 150) * 20));
  score += distScore;

  // Date headroom (10 pts) — more days = better
  const daysLeft = Math.max(
    0,
    Math.round(
      (new Date(opportunity.targetDate + "T00:00:00") - new Date()) / (1000 * 60 * 60 * 24)
    )
  );
  score += daysLeft >= 10 ? 10 : daysLeft >= 5 ? 6 : daysLeft >= 2 ? 3 : 0;

  return Math.min(score, 100);
}

// ─── Farmer's declared supply ─────────────────────────────────────────────
export const mySupplyInitial = [
  {
    id: "sup-001",
    name: "Vine Tomatoes",
    category: "Vegetables",
    availableQty: 200,
    committedQty: 75,
    unit: "kg",
    availableFrom: "2026-09-01",
    availableUntil: "2026-09-10",
    location: "Anantapur",
    notes: "Freshly harvested, Grade A.",
    status: "partial", // available | partial | committed
  },
  {
    id: "sup-002",
    name: "Raw Mango",
    category: "Fruits",
    availableQty: 180,
    committedQty: 0,
    unit: "kg",
    availableFrom: "2026-09-05",
    availableUntil: "2026-09-20",
    location: "Anantapur",
    notes: "",
    status: "available",
  },
];

// ─── Demands the farmer has committed supply toward ───────────────────────
export const committedDemandsInitial = [
  {
    id: "commit-001",
    demandId: "cd-001",
    name: "Vine Tomatoes",
    category: "Vegetables",
    unit: "kg",
    committedQty: 75,
    totalDemand: 320,
    location: "Kondapur",
    requiredDate: "2026-09-05",
    status: "pending", // pending | partial | fulfilled
  },
];

// ─── Filter / sort helpers ────────────────────────────────────────────────
export const FARMER_CATEGORIES = [
  "All",
  "Vegetables",
  "Fruits",
  "Leafy Greens",
  "Grains & Pulses",
  "Dairy",
  "Herbs & Spices",
];

export const FARMER_LOCATIONS = [
  "All",
  "Kondapur",
  "Gachibowli",
  "Madhapur",
  "Kukatpally",
  "Banjara Hills",
];

export const SUPPLY_UNITS = ["kg", "g", "dozen", "bunch", "litre", "tray (30)", "piece"];

export const SUPPLY_STATUS_LABELS = {
  available: "Available",
  partial: "Partially Committed",
  committed: "Fully Committed",
};

export const COMMIT_STATUS_LABELS = {
  pending: "Pending",
  partial: "Partially Fulfilled",
  fulfilled: "Fulfilled",
};

// Back-compat — the old FarmerCard on the landing FarmerPreview section
// still expects nearbyDemand with the original shape.
export const nearbyDemand = demandOpportunities.slice(0, 3).map((d) => ({
  id: d.id,
  name: d.name,
  unit: d.unit,
  required: d.totalDemand,
  supplyAvailable: Math.round(d.remaining * 0.7),
  potentialBuyers: d.consumers,
  expectedPrice: d.directPrice,
  distanceKm: d.distanceKm,
}));
