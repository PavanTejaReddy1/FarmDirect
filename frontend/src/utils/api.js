/**
 * Central API utility for FarmDirect.
 *
 * All fetch calls live here — never import fetch directly in a component.
 * Base URL comes from VITE_API_URL (.env).
 *
 * credentials: "include" is set globally so the HTTP-only JWT cookie is
 * automatically sent with every request. As a resilient fallback for cross-origin
 * environments (where browsers may block third-party cookies), an Authorization
 * header is also attached if an auth token is saved.
 */

const BASE = import.meta.env.VITE_API_URL || "https://farm-direct-nine.vercel.app/api";

function getAuthToken() {
  try {
    return localStorage.getItem("fd_token");
  } catch {
    return null;
  }
}

function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem("fd_token", token);
    } else {
      localStorage.removeItem("fd_token");
    }
  } catch {
    // Ignore storage errors in restricted iframe/browser modes
  }
}

// ─── core helpers ────────────────────────────────────────────────────────────

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    credentials: "include", // always send cookie
    headers,
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
  register: async (body) => {
    const data = await post("/auth/register", body);
    if (data?.token) setAuthToken(data.token);
    return data;
  },
  login: async (email, password) => {
    const data = await post("/auth/login", { email, password });
    if (data?.token) setAuthToken(data.token);
    return data;
  },
  logout: async () => {
    try {
      return await post("/auth/logout", {});
    } finally {
      setAuthToken(null);
    }
  },
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
