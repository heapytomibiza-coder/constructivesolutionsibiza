// Types for question pack structure
export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionDef {
  id: string;
  label: string;
  type: string;
  options?: QuestionOption[];
}

export interface QuestionPack {
  micro_slug: string;
  title: string;
  questions: QuestionDef[];
}

// Location preset labels for human-readable display
export const LOCATION_LABELS: Record<string, string> = {
  ibiza_town: "Ibiza Town",
  san_antonio: "San Antonio",
  santa_eulalia: "Santa Eulalia",
  san_jose: "San José",
  formentera: "Formentera",
  other: "Other",
};

// Build lookup maps from question packs
export function buildAnswerLookups(packs: QuestionPack[]) {
  const questionLabels: Map<string, Map<string, string>> = new Map();
  const optionLabels: Map<string, Map<string, Map<string, string>>> = new Map();

  for (const pack of packs) {
    const qMap = new Map<string, string>();
    const oMap = new Map<string, Map<string, string>>();

    for (const q of pack.questions) {
      qMap.set(q.id, q.label);

      if (q.options) {
        const optMap = new Map<string, string>();
        for (const opt of q.options) {
          optMap.set(opt.value, opt.label);
        }
        oMap.set(q.id, optMap);
      }
    }

    questionLabels.set(pack.micro_slug, qMap);
    optionLabels.set(pack.micro_slug, oMap);
  }

  return { questionLabels, optionLabels };
}

// Resolve a single answer value to its label
export function resolveAnswerValue(
  value: unknown,
  optionLabels: Map<string, string> | undefined
): string {
  if (value === null || value === undefined) return "—";

  // Handle arrays (checkbox answers)
  if (Array.isArray(value)) {
    return value.map((v) => optionLabels?.get(String(v)) ?? String(v)).join(", ");
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  // Handle single values
  const strValue = String(value);
  return optionLabels?.get(strValue) ?? strValue;
}

// Extract micro answers from the nested structure, filtering out metadata
export function extractMicroAnswers(
  raw: Record<string, unknown> | null | undefined
): Record<string, Record<string, unknown>> {
  if (!raw) return {};

  // Handle double-nested structure: microAnswers.microAnswers[slug]
  if (raw.microAnswers && typeof raw.microAnswers === "object") {
    const nested = raw.microAnswers as Record<string, unknown>;
    // Filter out _pack_* metadata and only keep slug-keyed answer objects
    return Object.fromEntries(
      Object.entries(nested).filter(
        ([key, value]) => !key.startsWith("_") && typeof value === "object" && value !== null
      )
    ) as Record<string, Record<string, unknown>>;
  }

  // Handle flat structure (legacy or fixed) - filter out metadata
  return Object.fromEntries(
    Object.entries(raw).filter(
      ([key, value]) =>
        !key.startsWith("_") && key !== "microAnswers" && typeof value === "object" && value !== null
    )
  ) as Record<string, Record<string, unknown>>;
}

// Format location for display
export function formatLocation(
  location: string | null | undefined,
  customLocation?: string | null
): string {
  if (!location) return "Not specified";
  if (location === "other") return customLocation || "Custom location";
  return LOCATION_LABELS[location] || location;
}
