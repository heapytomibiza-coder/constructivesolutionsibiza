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

/**
 * Expand a query into multiple search terms
 * Bidirectional: "sparky" → ["sparky", "electrician", ...] AND "electrician" → ["electrician", "sparky", ...]
 */
export function expandQuery(query: string): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  
  const expansions = new Set<string>([normalized]);

  for (const [key, values] of Object.entries(SEARCH_SYNONYMS)) {
    // If query contains the key, add all synonyms
    if (normalized.includes(key)) {
      expansions.add(key);
      values.forEach(v => expansions.add(v));
    }
    
    // If query matches any synonym, add the key and other synonyms
    for (const synonym of values) {
      if (normalized.includes(synonym)) {
        expansions.add(key);
        values.forEach(v => expansions.add(v));
        break;
      }
    }
  }

  return Array.from(expansions);
}

/**
 * Build Supabase OR clause for expanded terms
 */
export function buildSearchOrClause(query: string): string {
  const terms = expandQuery(query);
  return terms.map(t => `search_text.ilike.%${t}%`).join(",");
}
