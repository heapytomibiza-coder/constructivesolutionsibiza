/**
 * Search Intent Classification
 * 
 * Lightweight rule-based classifier that determines user intent
 * BEFORE scoring, so results are ordered by meaning not just text match.
 * 
 * Intent types:
 * - TRADE: user wants a trade/category ("plumber", "electrician")
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
  // Spanish equivalents
  "fontanero", "fontanería", "electricista", "albañil", "pintor",
  "carpintero", "cerrajero", "cristalero", "jardinero", "limpieza",
]);

/**
 * Task action verbs — when a query starts with one of these,
 * the user likely wants a specific micro-service.
 */
const TASK_VERBS = [
  "fix", "repair", "replace", "install", "fit", "mount", "remove",
  "unblock", "unclog", "rewire", "repaint", "regrout", "reseal",
  "change", "swap", "upgrade", "connect", "disconnect",
  // Spanish
  "reparar", "instalar", "cambiar", "arreglar", "montar", "desmontar",
  "sustituir", "limpiar",
];

/**
 * Project-level terms — subcategory-scale work.
 */
const PROJECT_TERMS = new Set([
  "renovation", "remodel", "conversion", "extension", "build",
  "refurbishment", "restoration", "installation", "fitting",
  "kitchen renovation", "bathroom renovation", "loft conversion",
  "pool installation", "house build", "garage conversion",
  // Spanish
  "reforma", "rehabilitación", "ampliación", "construcción",
  "reforma de cocina", "reforma de baño",
]);

/**
 * Classify a search query into an intent type.
 * Runs synchronously, no DB or API calls needed.
 */
export function classifyIntent(query: string): SearchIntent {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return "EXPLORATORY";

  const words = normalized.split(/\s+/);
  const firstWord = words[0];

  // 1. Check if the full query or first word is a trade term
  if (TRADE_TERMS.has(normalized) || TRADE_TERMS.has(firstWord)) {
    return "TRADE";
  }

  // 2. Check if query starts with a task verb
  if (TASK_VERBS.some(verb => firstWord === verb)) {
    return "TASK";
  }

  // 3. Check if query contains a project-level term
  if (PROJECT_TERMS.has(normalized)) {
    return "PROJECT";
  }
  for (const term of PROJECT_TERMS) {
    if (normalized.includes(term)) {
      return "PROJECT";
    }
  }

  // 4. Multi-word queries with an object tend to be tasks
  if (words.length >= 3 && TASK_VERBS.some(verb => normalized.includes(verb))) {
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
