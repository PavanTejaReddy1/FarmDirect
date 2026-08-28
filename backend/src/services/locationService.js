/**
 * locationService.js
 *
 * Provides deterministic location-based distance scoring for the matching
 * engine.
 *
 * CURRENT IMPLEMENTATION
 * ─────────────────────
 * A configurable mock coordinate map covers the known locations used in
 * FarmDirect's initial markets. When both locations are found in the map
 * we compute real Haversine distance. When one or both locations are
 * unknown we return a conservative mid-range score (7 pts).
 *
 * UPGRADING TO REAL COORDINATES
 * ──────────────────────────────
 * Replace the LOCATION_COORDINATES map with real lat/lng from the User
 * model (once users provide their coordinates) and the Haversine function
 * stays unchanged. No other code needs to change.
 *
 * SCORING BANDS (max 20 pts)
 * ──────────────────────────
 *   0 – 25 km  → 20   (same district, highly practical)
 *  26 – 50 km  → 16   (neighbouring district)
 *  51 – 100 km → 12   (within the state, manageable)
 * 101 – 200 km → 7    (long haul, possible for bulk)
 *   > 200 km   → 2    (cross-region, unlikely for fresh produce)
 *    unknown   → 7    (conservative default — no false positive)
 */

// ─── Mock coordinate map ──────────────────────────────────────────────────────
// All coordinates are approximate city/town centres in decimal degrees.

const LOCATION_COORDINATES = {
  // Hyderabad metro
  "Kondapur":      { lat: 17.4700, lng: 78.3500 },
  "Gachibowli":    { lat: 17.4401, lng: 78.3489 },
  "Madhapur":      { lat: 17.4486, lng: 78.3908 },
  "Kukatpally":    { lat: 17.4948, lng: 78.3996 },
  "Banjara Hills": { lat: 17.4126, lng: 78.4480 },
  "Hyderabad":     { lat: 17.3850, lng: 78.4867 },
  "Secunderabad":  { lat: 17.4399, lng: 78.4983 },
  "LB Nagar":      { lat: 17.3483, lng: 78.5479 },
  "Miyapur":       { lat: 17.4950, lng: 78.3432 },
  "Uppal":         { lat: 17.3981, lng: 78.5592 },
  // Farming districts within ~200 km of Hyderabad
  "Shankarpally":  { lat: 17.4538, lng: 78.1348 },
  "Vikarabad":     { lat: 17.3358, lng: 77.9020 },
  "Rangareddy":    { lat: 17.2400, lng: 78.1000 },
  "Nalgonda":      { lat: 17.0575, lng: 79.2670 },
  "Karimnagar":    { lat: 18.4386, lng: 79.1288 },
  "Anantapur":     { lat: 14.6819, lng: 77.6006 },
  "Warangal":      { lat: 17.9784, lng: 79.5941 },
  "Nizamabad":     { lat: 18.6726, lng: 78.0940 },
  "Khammam":       { lat: 17.2473, lng: 80.1514 },
  "Adilabad":      { lat: 19.6641, lng: 78.5320 },
  "Mahbubnagar":   { lat: 16.7488, lng: 77.9842 },
};

// ─── Haversine formula ────────────────────────────────────────────────────────

/**
 * Returns the great-circle distance in kilometres between two
 * (lat, lng) points.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Score bands ──────────────────────────────────────────────────────────────

const DISTANCE_BANDS = [
  { maxKm: 25,  score: 20, label: "Within 25 km" },
  { maxKm: 50,  score: 16, label: "Within 50 km" },
  { maxKm: 100, score: 12, label: "Within 100 km" },
  { maxKm: 200, score: 7,  label: "Within 200 km" },
];
const SCORE_OVER_200 = 2;
const SCORE_UNKNOWN  = 7; // conservative default when location is unrecognised

/**
 * Look up coordinates for a location string.
 * Tries an exact key first, then a case-insensitive partial match.
 */
function getCoords(locationName) {
  if (!locationName) return null;
  const key = Object.keys(LOCATION_COORDINATES).find(
    (k) => k.toLowerCase() === locationName.trim().toLowerCase()
  );
  if (key) return LOCATION_COORDINATES[key];

  // Try partial match — "Kondapur, Hyderabad" should still hit "Kondapur"
  const partial = Object.keys(LOCATION_COORDINATES).find((k) =>
    locationName.toLowerCase().includes(k.toLowerCase())
  );
  return partial ? LOCATION_COORDINATES[partial] : null;
}

/**
 * scoreLocation(demandLocation, supplyLocation)
 *
 * Returns { score: 0–20, distanceKm: number|null, reason: string }
 */
function scoreLocation(demandLocation, supplyLocation) {
  const dc = getCoords(demandLocation);
  const sc = getCoords(supplyLocation);

  if (!dc || !sc) {
    return {
      score: SCORE_UNKNOWN,
      distanceKm: null,
      reason: "Location distance unknown — using conservative default",
    };
  }

  const km = Math.round(haversineKm(dc.lat, dc.lng, sc.lat, sc.lng));

  for (const band of DISTANCE_BANDS) {
    if (km <= band.maxKm) {
      return { score: band.score, distanceKm: km, reason: `${band.label} (${km} km)` };
    }
  }

  return {
    score: SCORE_OVER_200,
    distanceKm: km,
    reason: `Over 200 km away (${km} km)`,
  };
}

/**
 * getDistanceKm(locationA, locationB)
 *
 * Convenience function for sorting / display. Returns null when unknown.
 */
function getDistanceKm(locationA, locationB) {
  const a = getCoords(locationA);
  const b = getCoords(locationB);
  if (!a || !b) return null;
  return Math.round(haversineKm(a.lat, a.lng, b.lat, b.lng));
}

module.exports = { scoreLocation, getDistanceKm, haversineKm, LOCATION_COORDINATES };
