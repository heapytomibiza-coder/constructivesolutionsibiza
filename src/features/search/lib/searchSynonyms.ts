/**
 * Search Synonyms (with optional weights)
 * Expand user queries to match more results.
 * Fast, controlled, no AI required.
 * 
 * HOW IT WORKS:
 * - User types "sparky" → expands to ["sparky", "electrician", "electrical", "electrics"]
 * - Query uses OR clause to match any expanded term
 * 
 * WEIGHTS (optional):
 * - High weight (1.0) = strong semantic match, keeps score high
 * - Low weight (0.3) = weak association, result score is reduced
 * - Plain strings default to weight 1.0 (backward-compatible)
 */

export type WeightedSynonym = { term: string; weight: number };
export type SynonymEntry = string | WeightedSynonym;

function toWeighted(entry: SynonymEntry): WeightedSynonym {
  return typeof entry === "string" ? { term: entry, weight: 1.0 } : entry;
}

export const SEARCH_SYNONYMS: Record<string, SynonymEntry[]> = {
  // === PLUMBING ===
  leak: ["water leak", "pipe leak", "sink leak", "leaking", "dripping"],
  drain: ["blocked drain", "drain blockage", "unblock drain", "clogged", "clog"],
  toilet: ["wc", "loo", "toilet repair", "cistern", "flush"],
  tap: ["faucet", "mixer tap", "tap repair", "dripping tap"],
  pipe: ["pipes", "piping", "pipework", "burst pipe"],
  plumber: [
    { term: "plumbing", weight: 1.0 },
    { term: "leak repair", weight: 0.8 },
    { term: "pipes", weight: 0.3 },
    { term: "water", weight: 0.2 },
  ],
  boiler: ["boiler repair", "boiler service", "heating"],
  
  // === ELECTRICAL ===
  electrician: [
    { term: "sparky", weight: 1.0 },
    { term: "electrical", weight: 1.0 },
    { term: "electrics", weight: 1.0 },
    { term: "wiring", weight: 0.7 },
  ],
  sparky: ["electrician", "electrical", "electrics"],
  socket: ["plug socket", "power outlet", "outlet", "plug"],
  light: ["lighting", "lights", "lamp", "fixture"],
  fuse: ["fuse box", "fusebox", "circuit breaker", "trip switch"],
  
  // === HVAC / CLIMATE ===
  aircon: ["ac", "air conditioning", "a/c", "air con", "air conditioner"],
  hvac: ["heating", "ventilation", "cooling", "climate"],
  heating: ["heater", "radiator", "central heating", "heat"],
  
  // === BUILDING / CONSTRUCTION ===
  plaster: ["plastering", "skim", "skim coat", "render"],
  paint: ["painting", "decorator", "decorating", "repaint"],
  tile: ["tiling", "tiles", "retile", "grout"],
  floor: ["flooring", "floors", "laminate", "wood floor"],
  microcement: ["microcemento", "mircocement", "micro cement", "micro-cement", "mirco"],
  mircocement: ["microcement", "microcemento", "micro cement"],
  mirco: ["microcement", "micro cement", "microcemento"],
  microcemento: ["microcement", "micro cement"],
  wall: ["walls", "partition", "drywall"],
  roof: ["roofing", "roofer", "tiles", "guttering"],
  window: ["windows", "glazing", "glass", "double glazing"],
  door: ["doors", "doorway", "lock"],
  
  // === OUTDOOR ===
  pool: ["swimming pool", "pool maintenance", "pool cleaning", "piscina"],
  garden: ["gardening", "landscaping", "lawn", "jardin"],
  patio: ["terrace", "deck", "decking", "outdoor"],
  fence: ["fencing", "gate", "boundary"],
  
  // === GENERAL ===
  handyman: ["odd jobs", "diy", "general repairs", "maintenance"],
  emergency: ["urgent", "asap", "24h", "same day"],
  repair: ["fix", "mend", "broken", "replace", "replaced", "replacement"],
  replace: ["replacement", "replaced", "swap", "change"],
  replaced: ["replace", "replacement", "swap", "change"],
  install: ["installation", "fit", "fitting", "mount"],
  kitchen: ["cocina", "kitchen fitting", "kitchen installation"],
  bathroom: ["baño", "bathroom fitting", "bathroom installation"],
};

// === EXPANSION SAFEGUARDS ===
const MAX_EXPANSIONS = 8;
const MIN_TERM_LENGTH = 2;

/**
 * Expand a query into multiple search terms.
 * Returns terms with their associated synonym weight (for score reduction).
 */
export interface ExpandedTerm {
  term: string;
  weight: number;
}

export function expandQueryWeighted(query: string): ExpandedTerm[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized || normalized.length < MIN_TERM_LENGTH) return [];

  const expansions = new Map<string, number>(); // term → best weight

  const words = normalized.split(/\s+/).filter(w => w.length >= MIN_TERM_LENGTH);

  // Add each word with full weight
  words.forEach(w => expansions.set(w, 1.0));

  // Full phrase with full weight
  if (words.length > 1) {
    expansions.set(normalized, 1.0);
  }

  // Expand each word through synonyms
  for (const word of words) {
    for (const [key, values] of Object.entries(SEARCH_SYNONYMS)) {
      const weighted = values.map(toWeighted);

      if (word === key || word.includes(key)) {
        // Key itself is a direct match → full weight
        expansions.set(key, Math.max(expansions.get(key) ?? 0, 1.0));
        for (const { term, weight } of weighted) {
          if (term.length >= MIN_TERM_LENGTH) {
            expansions.set(term, Math.max(expansions.get(term) ?? 0, weight));
          }
        }
      }

      for (const { term } of weighted) {
        if (word === term || word.includes(term)) {
          expansions.set(key, Math.max(expansions.get(key) ?? 0, 1.0));
          for (const { term: t, weight: w } of weighted) {
            if (t.length >= MIN_TERM_LENGTH) {
              expansions.set(t, Math.max(expansions.get(t) ?? 0, w));
            }
          }
          break;
        }
      }
    }
  }

  return Array.from(expansions.entries())
    .map(([term, weight]) => ({ term, weight }))
    .slice(0, MAX_EXPANSIONS);
}

/**
 * Backward-compatible: expand query to plain string array.
 */
export function expandQuery(query: string): string[] {
  return expandQueryWeighted(query).map(e => e.term);
}

/**
 * Get the minimum synonym weight for a query's expansion set.
 * Used by the scoring system to reduce scores for weak synonym matches.
 */
export function getSynonymWeightMap(query: string): Map<string, number> {
  const expanded = expandQueryWeighted(query);
  return new Map(expanded.map(e => [e.term, e.weight]));
}

/**
 * Build Supabase OR clause from query with synonym expansion.
 * Sanitizes commas/wildcards, caps at 8 terms and 500 chars.
 */
export function buildSearchOrClause(query: string): string {
  const MAX_OR_LEN = 500;
  const terms = expandQuery(query);
  
  const clause = terms
    .map(t => t.replace(/[,%]/g, " ").trim())
    .filter(t => t.length >= MIN_TERM_LENGTH)
    .map(t => `search_text.ilike.%${t}%`)
    .join(",");
  
  // If clause is too long, fall back to simple normalized query
  if (clause.length > MAX_OR_LEN) {
    const normalized = query.trim().toLowerCase().replace(/[,%]/g, " ").trim();
    return `search_text.ilike.%${normalized}%`;
  }
  
  return clause;
}
