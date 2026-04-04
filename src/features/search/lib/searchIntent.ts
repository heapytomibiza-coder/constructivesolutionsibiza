/**
 * Search Intent Classification
 * 
 * Lightweight rule-based classifier that determines user intent
 * BEFORE scoring, so results are ordered by meaning not just text match.
 * 
 * Intent types:
 * - TRADE: user wants a trade/category ("plumber", "electrician", "emergency plumber")
 * - TASK: user wants a specific micro-service ("fix leaking tap")
 * - PROJECT: user wants a subcategory-level service ("kitchen renovation")
 * - EXPLORATORY: user is browsing broadly ("garden", "outdoor")
 */

export type SearchIntent = "TRADE" | "TASK" | "PROJECT" | "EXPLORATORY";

/** Score multipliers applied per intent × result type */
export interface IntentBoosts {
  category: number;
  subcategory: number;
  micro: number;
}

const INTENT_BOOST_MAP: Record<SearchIntent, IntentBoosts> = {
  TRADE:       { category: 3,   subcategory: 2,   micro: 0.8 },
  TASK:        { category: 0.7, subcategory: 1.5, micro: 3   },
  PROJECT:     { category: 2,   subcategory: 3,   micro: 1   },
  EXPLORATORY: { category: 2,   subcategory: 2,   micro: 1   },
};

/**
 * Trade terms derived from the 16 locked categories + common synonyms.
 * These are broad profession/trade names that should surface categories first.
 */
const TRADE_TERMS = new Set([
  // Category-level trades
  "plumber", "plumbing", "electrician", "electrical", "sparky", "electrics",
  "painter", "painting", "decorator", "decorating",
  "carpenter", "carpentry", "joiner", "joinery",
  "builder", "building", "construction",
  "roofer", "roofing",
  "tiler", "tiling",
  "plasterer", "plastering",
  "locksmith",
  "glazier", "glazing",
  "landscaper", "landscaping",
  "cleaner", "cleaning",
  "pest control",
  "hvac", "aircon", "air conditioning",
  "handyman",
  "architect", "architecture",
  "designer", "interior design",
  "surveyor",
  "demolition",
  "scaffolding",
  // Spanish equivalents (stored accent-folded to match normalized queries)
  "fontanero", "fontaneria", "electricista", "albanil", "pintor",
  "carpintero", "cerrajero", "cristalero", "jardinero", "limpieza",
]);

/**
 * Noise words stripped before trade-term matching.
 * Allows "plumber near me", "best electrician ibiza", "cheap cleaner" to classify as TRADE.
 */
const TRADE_NOISE_WORDS = new Set([
  "near", "me", "best", "good", "cheap", "affordable", "local", "professional",
  "reliable", "trusted", "certified", "licensed", "qualified", "experienced",
  "find", "get", "need", "want", "looking", "search", "hire",
  "ibiza", "san", "antonio", "jose", "santa", "eulalia",
  "emergency", "urgent", "24h", "asap",
  // Spanish
  "cerca", "mejor", "barato", "bueno", "buscar", "encontrar", "necesito",
  "urgente", "profesional", "confiable",
]);

/**
 * Task action verbs — when a query starts with one of these,
 * the user likely wants a specific micro-service.
 */
const TASK_VERBS = new Set([
  "fix", "repair", "replace", "install", "fit", "mount", "remove",
  "unblock", "unclog", "rewire", "repaint", "regrout", "reseal",
  "change", "swap", "upgrade", "connect", "disconnect",
  // Spanish
  "reparar", "instalar", "cambiar", "arreglar", "montar", "desmontar",
  "sustituir", "limpiar",
]);

/**
 * Project-level terms — subcategory-scale work.
 * Includes action prefixes ("new", "redo", "full") that signal project intent.
 */
const PROJECT_TERMS = new Set([
  "renovation", "remodel", "conversion", "extension", "build",
  "refurbishment", "restoration", "installation", "fitting",
  "kitchen renovation", "bathroom renovation", "loft conversion",
  "pool installation", "house build", "garage conversion",
  "office fit out", "fit out", "fitout",
  // Spanish (accent-folded)
  "reforma", "rehabilitacion", "ampliacion", "construccion",
  "reforma de cocina", "reforma de bano",
]);

/**
 * Project action prefixes — "new bathroom", "redo kitchen", "full house refurb"
 * signal project intent when combined with a known object.
 */
const PROJECT_PREFIXES = ["new", "redo", "full", "complete", "total", "whole", "nuevo", "nueva"];

/**
 * Objects that combine with PROJECT_PREFIXES to form project intent.
 */
const PROJECT_OBJECTS = new Set([
  "bathroom", "kitchen", "house", "home", "apartment", "flat", "villa",
  "garden", "pool", "office", "shop", "terrace", "patio", "roof",
  "floor", "flooring", "exterior", "interior", "facade",
  // Spanish
  "baño", "cocina", "casa", "piso", "jardín", "piscina", "oficina",
  "terraza", "tejado", "suelo", "fachada",
]);

/**
 * Extract trade terms from a multi-word query by stripping noise words.
 * Returns the remaining meaningful words.
 */
function extractCoreTerm(words: string[]): string[] {
  return words.filter(w => !TRADE_NOISE_WORDS.has(w));
}

/**
 * Check if any word in the query is a known trade term.
 */
function containsTradeTerm(words: string[]): boolean {
  // Check individual words
  if (words.some(w => TRADE_TERMS.has(w))) return true;
  // Check bigrams for multi-word trade terms ("pest control", "interior design")
  for (let i = 0; i < words.length - 1; i++) {
    if (TRADE_TERMS.has(`${words[i]} ${words[i + 1]}`)) return true;
  }
  return false;
}

/**
 * Check if query matches project intent via prefix + object pattern.
 */
function matchesProjectPattern(words: string[]): boolean {
  if (words.length < 2) return false;
  const first = words[0];
  if (!PROJECT_PREFIXES.includes(first)) return false;
  // Check if remaining words contain a project object
  return words.slice(1).some(w => PROJECT_OBJECTS.has(w));
}

/**
 * Classify a search query into an intent type.
 * Runs synchronously, no DB or API calls needed.
 * 
 * Priority: TASK verb > TRADE term (anywhere) > PROJECT > EXPLORATORY
 * Exception: TRADE term wins over task verb only when task verb is NOT the first word.
 */
/**
 * Strip punctuation and fold accents so "fontanería?" matches "fontaneria".
 */
function normalizeQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // strip accent marks
    .replace(/[^\w\s]/g, "")           // strip punctuation
    .replace(/\s+/g, " ")             // collapse whitespace
    .trim();
}

export function classifyIntent(query: string): SearchIntent {
  const normalized = normalizeQuery(query);
  if (!normalized) return "EXPLORATORY";

  const words = normalized.split(/\s+/);
  const firstWord = words[0];
  const hasTaskVerb = TASK_VERBS.has(firstWord);

  // 1. Task verb as first word = strong task signal (overrides trade)
  if (hasTaskVerb && words.length >= 2) {
    return "TASK";
  }

  // 2. Trade term anywhere in query (after stripping noise)
  //    "plumber near me", "best electrician ibiza", "emergency plumber" → TRADE
  if (TRADE_TERMS.has(normalized) || containsTradeTerm(extractCoreTerm(words))) {
    return "TRADE";
  }

  // 3. Project detection — exact terms, word-boundary phrase match, or prefix+object pattern
  if (PROJECT_TERMS.has(normalized)) return "PROJECT";
  for (const term of PROJECT_TERMS) {
    // Use word-boundary regex instead of broad includes()
    const re = new RegExp(`\\b${term.replace(/\s+/g, "\\s+")}\\b`);
    if (re.test(normalized)) return "PROJECT";
  }
  if (matchesProjectPattern(words)) return "PROJECT";

  // 4. Multi-word queries with a task verb somewhere
  if (words.length >= 2 && Array.from(TASK_VERBS).some(verb => normalized.includes(verb))) {
    return "TASK";
  }

  return "EXPLORATORY";
}

/**
 * Get the boost multipliers for a given intent.
 */
export function getIntentBoosts(intent: SearchIntent): IntentBoosts {
  return INTENT_BOOST_MAP[intent];
}
