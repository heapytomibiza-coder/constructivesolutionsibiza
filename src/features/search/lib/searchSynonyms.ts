/**
 * Search Synonyms
 * Expand user queries to match more results.
 * Fast, controlled, no AI required.
 * 
 * HOW IT WORKS:
 * - User types "sparky" → expands to ["sparky", "electrician", "electrical", "electrics"]
 * - Query uses OR clause to match any expanded term
 */

export const SEARCH_SYNONYMS: Record<string, string[]> = {
  // === PLUMBING ===
  leak: ["water leak", "pipe leak", "sink leak", "leaking", "dripping"],
  drain: ["blocked drain", "drain blockage", "unblock drain", "clogged", "clog"],
  toilet: ["wc", "loo", "toilet repair", "cistern", "flush"],
  tap: ["faucet", "mixer tap", "tap repair", "dripping tap"],
  pipe: ["pipes", "piping", "pipework", "burst pipe"],
  plumber: ["plumbing", "pipes", "water"],
  boiler: ["boiler repair", "boiler service", "heating"],
  
  // === ELECTRICAL ===
  electrician: ["sparky", "electrical", "electrics", "wiring"],
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
  repair: ["fix", "mend", "broken"],
  install: ["installation", "fit", "fitting", "mount"],
};

// === EXPANSION SAFEGUARDS ===
const MAX_EXPANSIONS = 8;
const MIN_TERM_LENGTH = 2;

/**
 * Expand a query into multiple search terms
 * Bidirectional: "sparky" → ["sparky", "electrician", ...] AND "electrician" → ["electrician", "sparky", ...]
 */
export function expandQuery(query: string): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized || normalized.length < MIN_TERM_LENGTH) return [];
  
  const expansions = new Set<string>([normalized]);

  for (const [key, values] of Object.entries(SEARCH_SYNONYMS)) {
    // If query contains the key, add all synonyms
    if (normalized.includes(key)) {
      expansions.add(key);
      values.forEach(v => {
        if (v.length >= MIN_TERM_LENGTH) expansions.add(v);
      });
    }
    
    // If query matches any synonym, add the key and other synonyms
    for (const synonym of values) {
      if (normalized.includes(synonym)) {
        expansions.add(key);
        values.forEach(v => {
          if (v.length >= MIN_TERM_LENGTH) expansions.add(v);
        });
        break;
      }
    }
  }

  // Cap expansions to prevent slow queries
  return Array.from(expansions).slice(0, MAX_EXPANSIONS);
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
