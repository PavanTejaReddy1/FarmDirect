// Mock collective-demand data for the consumer dashboard.
// Shape is deliberately API-shaped so a later fetch() can drop in unchanged.

export const CATEGORIES = [
  "All",
  "Vegetables",
  "Fruits",
  "Leafy Greens",
  "Grains & Pulses",
  "Dairy",
  "Herbs & Spices",
];

export const LOCATIONS = [
  "All",
  "Kondapur",
  "Gachibowli",
  "Madhapur",
  "Kukatpally",
  "Banjara Hills",
];

export const STATUS_LABELS = {
  open: "Open",
  filling: "Filling fast",
  matched: "Matched",
  closed: "Closed",
};

// Collective demands visible to all consumers
export const collectiveDemands = [
  {
    id: "cd-001",
    name: "Vine Tomatoes",
    category: "Vegetables",
    unit: "kg",
    totalDemand: 320,
    matched: 245,
    consumers: 58,
    targetDate: "2026-09-05",
    location: "Kondapur",
    directPrice: 34,
    marketPrice: 52,
    status: "filling",
    description: "Ripe, locally grown vine tomatoes from farms within 40 km.",
  },
  {
    id: "cd-002",
    name: "Mixed Leafy Greens",
    category: "Leafy Greens",
    unit: "kg",
    totalDemand: 140,
    matched: 96,
    consumers: 33,
    targetDate: "2026-09-08",
    location: "Gachibowli",
    directPrice: 28,
    marketPrice: 45,
    status: "open",
    description: "Seasonal mix of spinach, methi, and palak — harvested weekly.",
  },
  {
    id: "cd-003",
    name: "Yelakki Bananas",
    category: "Fruits",
    unit: "dozen",
    totalDemand: 210,
    matched: 205,
    consumers: 71,
    targetDate: "2026-09-03",
    location: "Kondapur",
    directPrice: 42,
    marketPrice: 60,
    status: "filling",
    description: "Small, sweet bananas from Nalgonda farms.",
  },
  {
    id: "cd-004",
    name: "Toor Dal",
    category: "Grains & Pulses",
    unit: "kg",
    totalDemand: 500,
    matched: 180,
    consumers: 45,
    targetDate: "2026-09-15",
    location: "Madhapur",
    directPrice: 110,
    marketPrice: 145,
    status: "open",
    description: "Red gram dal sourced directly from Karimnagar farmers.",
  },
  {
    id: "cd-005",
    name: "Fresh Coriander",
    category: "Herbs & Spices",
    unit: "bunch",
    totalDemand: 300,
    matched: 300,
    consumers: 88,
    targetDate: "2026-09-01",
    location: "Kukatpally",
    directPrice: 8,
    marketPrice: 15,
    status: "matched",
    description: "Crisp, fragrant coriander from Rangareddy district.",
  },
  {
    id: "cd-006",
    name: "Country Eggs",
    category: "Dairy",
    unit: "tray (30)",
    totalDemand: 150,
    matched: 60,
    consumers: 27,
    targetDate: "2026-09-10",
    location: "Banjara Hills",
    directPrice: 185,
    marketPrice: 240,
    status: "open",
    description: "Free-range country eggs from a small poultry unit near Vikarabad.",
  },
  {
    id: "cd-007",
    name: "Raw Mango",
    category: "Fruits",
    unit: "kg",
    totalDemand: 200,
    matched: 35,
    consumers: 12,
    targetDate: "2026-09-20",
    location: "Gachibowli",
    directPrice: 55,
    marketPrice: 80,
    status: "open",
    description: "Tangy raw mangoes for pickles and chutneys.",
  },
  {
    id: "cd-008",
    name: "Sona Masoori Rice",
    category: "Grains & Pulses",
    unit: "kg",
    totalDemand: 800,
    matched: 620,
    consumers: 130,
    targetDate: "2026-09-12",
    location: "Madhapur",
    directPrice: 58,
    marketPrice: 75,
    status: "filling",
    description: "Premium Sona Masoori rice from Nalgonda.",
  },
];

// Current user context
export const currentUser = {
  name: "Priya Sharma",
  location: "Kondapur, Hyderabad",
  joinedDemands: ["cd-001", "cd-003"],
};

// User's own created demands (personal)
export const myDemands = [
  {
    id: "my-001",
    name: "Vine Tomatoes",
    category: "Vegetables",
    quantity: 10,
    unit: "kg",
    matched: 10,
    status: "matched",
    deliveryDate: "2026-09-05",
    location: "Kondapur",
    note: "Preferably vine-ripened, no early harvest.",
    createdAt: "2026-08-20",
  },
  {
    id: "my-002",
    name: "Yelakki Bananas",
    category: "Fruits",
    quantity: 4,
    unit: "dozen",
    matched: 4,
    status: "matched",
    deliveryDate: "2026-09-03",
    location: "Kondapur",
    note: "",
    createdAt: "2026-08-22",
  },
];

// ─── Back-compat aliases for the landing page ConsumerPreview section ────────
// ConsumerPreview.jsx and the old DemandCard expect the original shape.
// Map the first three collectiveDemands into the old structure so the
// landing page continues to work without any visual change.
export const demandItems = collectiveDemands.slice(0, 3).map((d) => ({
  id: d.id,
  name: d.name,
  unit: d.unit,
  collectiveDemand: d.totalDemand,
  matched: d.matched,
  directPrice: d.directPrice,
  marketPrice: d.marketPrice,
  households: d.consumers,
  area: `${d.location}, Hyderabad`,
}));

export const currentUserDemand = {
  location: currentUser.location,
};
