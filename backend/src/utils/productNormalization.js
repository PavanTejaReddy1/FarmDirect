/**
 * productNormalization.js
 *
 * Normalises product names for matching and scores product compatibility.
 *
 * Scoring (max 35 pts):
 *   35  — exact normalised match
 *   20  — one string contains the other after normalisation
 *   15  — same category AND one known synonym matches
 *    0  — completely incompatible
 *
 * We do NOT use arbitrary Levenshtein distance for domain objects that
 * have clear categories. When no synonym match exists we return 0 rather
 * than a misleading partial score.
 */

// ─── Normalisation ────────────────────────────────────────────────────────────

/**
 * Normalise a product name to a canonical lowercase string:
 *   - lowercase
 *   - trim whitespace
 *   - remove common filler words ("fresh", "organic", "local", "grade a", "premium")
 *   - collapse trailing 's' to handle singular/plural (simple stemming)
 *   - collapse multiple spaces
 *
 * Examples:
 *   "Fresh Tomatoes"     → "tomato"
 *   "Organic tomato"     → "tomato"
 *   "Vine Tomatoes"      → "vine tomato"
 *   "Mixed Leafy Greens" → "mixed leafy green"
 */
function normalise(name) {
  if (!name || typeof name !== "string") return "";

  const FILLER = /\b(fresh|organic|local|grade\s*a|premium|raw|ripe|seasonal|farm)\b/gi;

  let n = name
    .toLowerCase()
    .trim()
    .replace(FILLER, "")           // remove filler words
    .replace(/\s+/g, " ")          // collapse spaces
    .trim();

  // Simple plural → singular: trailing "ies" → "y", trailing "es"/"s" → stem
  // Only applied to the last token so "greens" → "green" but "glass" stays.
  n = n
    .split(" ")
    .map((word) => {
      if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
      if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
      if (word.endsWith("s")  && word.length > 3) return word.slice(0, -1);
      return word;
    })
    .join(" ")
    .trim();

  return n;
}

// ─── Synonym groups ───────────────────────────────────────────────────────────
// Each entry is a set of tokens that refer to the same product.
// Matching ANY token in the same group earns a synonym credit.

const SYNONYM_GROUPS = [
  new Set(["tomato", "vine tomato", "cherry tomato", "roma tomato"]),
  new Set(["leafy green", "spinach", "palak", "methi", "fenugreek", "amaranth"]),
  new Set(["banana", "yelakki banana", "plantain"]),
  new Set(["mango", "raw mango", "alphonso", "dasheri", "kesar"]),
  new Set(["rice", "sona masoori", "basmati", "red rice", "brown rice"]),
  new Set(["dal", "toor dal", "moong dal", "chana dal", "red gram", "yellow lentil"]),
  new Set(["onion", "red onion", "shallot"]),
  new Set(["potato", "sweet potato"]),
  new Set(["chilli", "green chilli", "red chilli", "capsicum", "bell pepper"]),
  new Set(["coriander", "cilantro", "dhania"]),
  new Set(["egg", "country egg", "poultry egg", "hen egg"]),
];

/**
 * Returns the synonym group that contains `normalisedName`, or null.
 */
function findSynonymGroup(normalisedName) {
  for (const group of SYNONYM_GROUPS) {
    for (const token of group) {
      if (normalisedName === token || normalisedName.includes(token) || token.includes(normalisedName)) {
        return group;
      }
    }
  }
  return null;
}

// ─── Score ────────────────────────────────────────────────────────────────────

/**
 * scoreProductCompatibility(demandName, supplyName)
 *
 * Returns { score: 0–35, reason: string, isCompatible: boolean }
 *
 * isCompatible=false means the supply is wholly unsuitable and should be
 * excluded from matching before even computing other factors.
 */
function scoreProductCompatibility(demandName, supplyName) {
  const dNorm = normalise(demandName);
  const sNorm = normalise(supplyName);

  if (!dNorm || !sNorm) {
    return { score: 0, reason: "Missing product name", isCompatible: false };
  }

  // Exact match after normalisation
  if (dNorm === sNorm) {
    return { score: 35, reason: "Exact product match", isCompatible: true };
  }

  // One contains the other (e.g. "vine tomato" ↔ "tomato")
  if (dNorm.includes(sNorm) || sNorm.includes(dNorm)) {
    return { score: 20, reason: "Close product match (variant)", isCompatible: true };
  }

  // Synonym group check
  const dGroup = findSynonymGroup(dNorm);
  const sGroup = findSynonymGroup(sNorm);

  if (dGroup && sGroup && dGroup === sGroup) {
    return { score: 15, reason: "Known product synonym", isCompatible: true };
  }

  // No match
  return { score: 0, reason: "Incompatible product", isCompatible: false };
}

module.exports = { normalise, scoreProductCompatibility, findSynonymGroup };
