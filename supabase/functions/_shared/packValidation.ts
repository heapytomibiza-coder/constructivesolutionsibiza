/**
 * Pack Schema Validation for Edge Functions (Deno-compatible)
 * 
 * Mirrors the logic from src/pages/jobs/lib/packSchema.ts but without Zod
 * since edge functions may not have it. Pure runtime checks.
 */

// ── Types ──

export interface PackQuestion {
  id: string;
  label: string;
  type: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  accept?: string;
  show_if?: { questionId: string; value: unknown } | null;
}

export interface LintWarning {
  rule: string;
  message: string;
  severity: "warning" | "info";
  questionId?: string;
}

export interface PackValidationResult {
  valid: boolean;
  status: "draft" | "valid" | "invalid" | "deprecated";
  errors: string[];
  lintWarnings: LintWarning[];
  questionCount: number;
  qualityTier: "STRONG" | "ACCEPTABLE" | "WEAK" | "FAILING";
  score: number;
}

// ── Constants ──

const ALLOWED_TYPES = new Set([
  "radio", "checkbox", "select", "text", "textarea",
  "number", "file", "date", "photo",
]);

const BANNED_PHRASES = [
  "briefly describe", "describe your project",
  "what do you need help with", "any additional details",
  "please describe", "tell us about your project",
  "tell us more", "other details",
];

const CHOICE_TYPES = new Set(["radio", "checkbox", "select"]);

// ── Schema Validation ──

function validateSchema(questions: unknown[]): { valid: boolean; errors: string[]; parsed: PackQuestion[] } {
  const errors: string[] = [];
  const parsed: PackQuestion[] = [];

  if (!Array.isArray(questions)) {
    return { valid: false, errors: ["questions must be an array"], parsed: [] };
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] as Record<string, unknown>;
    if (!q || typeof q !== "object") {
      errors.push(`questions[${i}]: not an object`);
      continue;
    }

    const id = String(q.id ?? "").trim();
    const label = String(q.label ?? "").trim();
    const type = String(q.type ?? "").trim();

    if (!id) errors.push(`questions[${i}]: missing id`);
    if (label.length < 3) errors.push(`questions[${i}]: label too short ("${label}")`);
    if (!ALLOWED_TYPES.has(type)) errors.push(`questions[${i}]: invalid type "${type}"`);

    if (CHOICE_TYPES.has(type)) {
      const opts = q.options as unknown[];
      if (!Array.isArray(opts) || opts.length < 2) {
        errors.push(`questions[${i}]: ${type} requires ≥2 options`);
      }
    }

    parsed.push({
      id,
      label,
      type,
      options: q.options as PackQuestion["options"],
      required: q.required as boolean | undefined,
      placeholder: q.placeholder as string | undefined,
      help: (q.help ?? q.helpText) as string | undefined,
      accept: q.accept as string | undefined,
      show_if: (q.show_if ?? q.dependsOn) as PackQuestion["show_if"],
    });
  }

  return { valid: errors.length === 0, errors, parsed };
}

// ── Lint Rules ──

function lintPack(questions: PackQuestion[], microSlug: string): LintWarning[] {
  const warnings: LintWarning[] = [];

  if (questions.length < 5) {
    warnings.push({ rule: "min_questions", message: `Only ${questions.length} questions (min 5)`, severity: "warning" });
  }
  if (questions.length > 12) {
    warnings.push({ rule: "max_questions", message: `${questions.length} questions (max 12)`, severity: "warning" });
  }

  for (const q of questions) {
    const label = q.label.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      if (label.includes(phrase)) {
        warnings.push({ rule: "banned_phrase", message: `Generic phrase "${phrase}"`, severity: "warning", questionId: q.id });
        break;
      }
    }
  }

  const choiceCount = questions.filter(q => CHOICE_TYPES.has(q.type)).length;
  if (questions.length > 0 && choiceCount / questions.length < 0.6) {
    warnings.push({ rule: "low_choice_ratio", message: `${Math.round(choiceCount / questions.length * 100)}% structured (aim ≥60%)`, severity: "warning" });
  }

  const ids = questions.map(q => q.id);
  const idSet = new Set(ids);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    warnings.push({ rule: "duplicate_ids", message: `Duplicate IDs: ${[...new Set(dupes)].join(", ")}`, severity: "warning" });
  }

  for (const q of questions) {
    if (q.show_if && !idSet.has(q.show_if.questionId)) {
      warnings.push({ rule: "invalid_show_if_ref", message: `References non-existent "${q.show_if.questionId}"`, severity: "warning", questionId: q.id });
    }
  }

  return warnings;
}

// ── Scoring ──

function scorePack(questions: PackQuestion[], warnings: LintWarning[]): { score: number; tier: PackValidationResult["qualityTier"] } {
  let score = 0;
  const bannedCount = warnings.filter(w => w.rule === "banned_phrase").length;
  score -= bannedCount * 5;

  if (questions.length >= 5 && questions.length <= 8) score += 1;

  const choiceCount = questions.filter(q => CHOICE_TYPES.has(q.type)).length;
  if (questions.length > 0 && choiceCount / questions.length >= 0.7) score += 1;

  if (questions.some(q => q.show_if)) score += 2;
  if (questions.some(q => q.type === "photo" || q.type === "file")) score += 1;

  let tier: PackValidationResult["qualityTier"];
  if (score < 0) tier = "FAILING";
  else if (score <= 1) tier = "WEAK";
  else if (score <= 4) tier = "ACCEPTABLE";
  else tier = "STRONG";

  return { score, tier };
}

// ── Main Entry Point ──

export function validateQuestionPack(
  microSlug: string,
  title: string,
  rawQuestions: unknown[]
): PackValidationResult {
  const { valid, errors, parsed } = validateSchema(rawQuestions);

  if (!valid) {
    return {
      valid: false,
      status: "invalid",
      errors,
      lintWarnings: [],
      questionCount: rawQuestions.length,
      qualityTier: "FAILING",
      score: -10,
    };
  }

  const lintWarnings = lintPack(parsed, microSlug);
  const { score, tier } = scorePack(parsed, lintWarnings);

  const hasBlocking = lintWarnings.some(w =>
    w.severity === "warning" && ["banned_phrase", "duplicate_ids", "invalid_show_if_ref"].includes(w.rule)
  );

  const status: PackValidationResult["status"] = tier === "FAILING" ? "invalid" : hasBlocking ? "draft" : "valid";

  return {
    valid: true,
    status,
    errors: [],
    lintWarnings,
    questionCount: parsed.length,
    qualityTier: tier,
    score,
  };
}
