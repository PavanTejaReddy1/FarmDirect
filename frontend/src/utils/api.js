/**
 * Central API utility for FarmDirect.
 *
 * All fetch calls live here — never import fetch directly in a component.
 * Base URL comes from VITE_API_URL (.env).
 *
 * credentials: "include" is set globally so the HTTP-only JWT cookie is
 * automatically sent with every request — this is the only place it needs
 * to be set.
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── core helpers ────────────────────────────────────────────────────────────

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",                 // always send the cookie
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const json = await res.json();

  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed: ${res.status}`);
  }

  return json.data;
}

function get(path, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== "All")
  ).toString();
  return request(qs ? `${path}?${qs}` : path);
}

function post(path, body) {
  return request(path, { method: "POST", body: JSON.stringify(body) });
}

// ─── Health ──────────────────────────────────────────────────────────────────

export const checkHealth = () => get("/health");

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Grouped as authApi so AuthContext can import a single namespace.

export const authApi = {
  register: (body) => post("/auth/register", body),
  login: (email, password) => post("/auth/login", { email, password }),
  logout: () => post("/auth/logout", {}),
  getMe: () => get("/auth/me"),
};

// ─── Demands ─────────────────────────────────────────────────────────────────

export const fetchDemands    = (filters = {}) => get("/demands", filters);
export const createDemand    = (body)         => post("/demands", body);
export const fetchDemandById = (id)           => get(`/demands/${id}`);
export const joinDemand      = (id, quantity) => post(`/demands/${id}/join`, { quantity });

// ─── Supplies ────────────────────────────────────────────────────────────────

export const fetchSupplies    = (filters = {}) => get("/supplies", filters);
export const createSupply     = (body)          => post("/supplies", body);
export const fetchSupplyById  = (id)            => get(`/supplies/${id}`);

// ─── Commitments ─────────────────────────────────────────────────────────────

export const fetchCommitments  = ()     => get("/commitments");
export const createCommitment  = (body) => post("/commitments", body);

// ─── Matching ─────────────────────────────────────────────────────────────────

/**
 * Fetch best supply matches for a demand (any authenticated user).
 * Returns { demand, matches[] } where each match has score + scoreBreakdown.
 */
export const fetchDemandMatches = (demandId) =>
  get(`/matching/demands/${demandId}`);

/**
 * Fetch the greedy fulfillment combination for a demand.
 * Returns { fulfillmentStatus, totalRecommendedQuantity, matches[], ... }
 */
export const fetchFulfillmentRecommendation = (demandId) =>
  get(`/matching/demands/${demandId}/recommendation`);

/**
 * Fetch demand opportunities ranked by match score for the logged-in farmer.
 * Returns an array sorted by matchScore descending.
 * FARMER role required.
 */
export const fetchMyOpportunities = () => get("/matching/my-opportunities");

// ─── AI Intelligence ──────────────────────────────────────────────────────────

/**
 * Fetch AI-powered Demand Intelligence summary for a demand.
 * Explicitly triggered by user action — never called automatically in a loop.
 */
export const fetchDemandIntelligence = (demandId) =>
  get(`/ai/demands/${demandId}/intelligence`);
export const getDemandIntelligence = fetchDemandIntelligence;

