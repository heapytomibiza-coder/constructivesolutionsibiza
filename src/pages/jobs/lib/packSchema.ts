/**
 * Question Pack Schema Validation & Lint Engine
 * 
 * Two layers:
 * 1. Schema validation — structural correctness (Zod)
 * 2. Quality linting — content quality rules
 * 
 * This is the source of truth for what a valid question pack looks like.
 */

import { z } from "zod";

// ────────────────────────────────────────────────────────
// Schema: Question Option
// ────────────────────────────────────────────────────────

export const PackOptionSchema = z.object({
  value: z.string().min(1, "Option value cannot be empty"),
  label: z.string().min(1, "Option label cannot be empty"),
});

// ────────────────────────────────────────────────────────
// Schema: Show-if (conditional visibility)
// ────────────────────────────────────────────────────────

export const ShowIfSchema = z.object({
  questionId: z.string().min(1),
  value: z.union([z.string(), z.array(z.string()), z.boolean()]),
}).strict();

// ────────────────────────────────────────────────────────
// Schema: Single Question
// ────────────────────────────────────────────────────────

const ALLOWED_TYPES = [
  "radio", "checkbox", "select", "text", "textarea",
  "number", "file", "date", "photo",
] as const;

export const PackQuestionSchema = z.object({
  id: z.string().min(1, "Question must have an id"),
  label: z.string().min(3, "Question label too short"),
  type: z.enum(ALLOWED_TYPES, {
    errorMap: () => ({ message: `Type must be one of: ${ALLOWED_TYPES.join(", ")}` }),
  }),
  options: z.array(PackOptionSchema).optional(),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  help: z.string().optional(),
  accept: z.string().optional(),
  show_if: ShowIfSchema.optional().nullable(),
}).refine(
  (q) => {
    // Options required for choice-type questions
    if (["radio", "checkbox", "select"].includes(q.type)) {
      return q.options && q.options.length >= 2;
    }
    return true;
  },
  { message: "Choice questions (radio/checkbox/select) must have ≥2 options" }
);

// ────────────────────────────────────────────────────────
// Schema: Full Question Pack (DB row shape)
// ────────────────────────────────────────────────────────

export const QuestionPackContentSchema = z.object({
  micro_slug: z.string().min(1),
  title: z.string().min(3),
  questions: z.array(PackQuestionSchema).min(1, "Pack must have at least 1 question"),
  schema_version: z.number().int().positive().optional(),
});

// ────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────

export type PackOption = z.infer<typeof PackOptionSchema>;
export type PackQuestion = z.infer<typeof PackQuestionSchema>;
export type QuestionPackContent = z.infer<typeof QuestionPackContentSchema>;

export type PackStatus = "draft" | "valid" | "invalid" | "deprecated";

export interface LintWarning {
  rule: string;
  message: string;
  severity: "warning" | "info";
  questionId?: string;
}

export interface PackValidationResult {
  valid: boolean;
  status: PackStatus;
  errors: string[];
  lintWarnings: LintWarning[];
  questionCount: number;
  qualityTier: "STRONG" | "ACCEPTABLE" | "WEAK" | "FAILING";
  score: number;
}

// ────────────────────────────────────────────────────────
// Lint Rules
// ────────────────────────────────────────────────────────

const BANNED_PHRASES = [
  "briefly describe",
  "describe your project",
  "what do you need help with",
  "any additional details",
  "please describe",
  "tell us about your project",
  "tell us more",
  "other details",
];

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 12;
const OPTIMAL_MIN = 5;
const OPTIMAL_MAX = 8;
const MIN_CHOICE_RATIO = 0.6; // At least 60% should be structured (radio/checkbox/select)

function lintPack(questions: PackQuestion[], microSlug: string): LintWarning[] {
  const warnings: LintWarning[] = [];

  // ── Count checks ──
  if (questions.length < MIN_QUESTIONS) {
    warnings.push({
      rule: "min_questions",
      message: `Only ${questions.length} questions (minimum ${MIN_QUESTIONS} for production)`,
      severity: "warning",
    });
  }

  if (questions.length > MAX_QUESTIONS) {
    warnings.push({
      rule: "max_questions",
      message: `${questions.length} questions exceeds max ${MAX_QUESTIONS} — risk of abandonment`,
      severity: "warning",
    });
  }

  // ── Banned phrase detection ──
  for (const q of questions) {
    const label = q.label.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      if (label.includes(phrase)) {
        warnings.push({
          rule: "banned_phrase",
          message: `Generic phrase "${phrase}" detected — tailor to ${microSlug}`,
          severity: "warning",
          questionId: q.id,
        });
        break;
      }
    }
  }

  // ── Choice ratio ──
  const choiceTypes = ["radio", "checkbox", "select"];
  const choiceCount = questions.filter(q => choiceTypes.includes(q.type)).length;
  if (questions.length > 0 && choiceCount / questions.length < MIN_CHOICE_RATIO) {
    warnings.push({
      rule: "low_choice_ratio",
      message: `Only ${Math.round(choiceCount / questions.length * 100)}% structured questions — aim for ≥60% to reduce friction`,
      severity: "warning",
    });
  }

  // ── Duplicate IDs ──
  const ids = questions.map(q => q.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    warnings.push({
      rule: "duplicate_ids",
      message: `Duplicate question IDs: ${[...new Set(dupes)].join(", ")}`,
      severity: "warning",
    });
  }

  // ── show_if references valid question ──
  const idSet = new Set(ids);
  for (const q of questions) {
    if (q.show_if && !idSet.has(q.show_if.questionId)) {
      warnings.push({
        rule: "invalid_show_if_ref",
        message: `show_if references non-existent question "${q.show_if.questionId}"`,
        severity: "warning",
        questionId: q.id,
      });
    }
  }

  // ── Missing photo prompt for visual services ──
  const visualKeywords = [
    "painting", "decorating", "landscaping", "tiling", "flooring",
    "kitchen", "bathroom", "renovation", "makeup", "design",
  ];
  const isVisualService = visualKeywords.some(k => microSlug.includes(k));
  const hasPhotoQuestion = questions.some(q => q.type === "photo" || q.type === "file");
  if (isVisualService && !hasPhotoQuestion) {
    warnings.push({
      rule: "missing_photo_prompt",
      message: `Visual service "${microSlug}" has no photo/file upload question`,
      severity: "info",
    });
  }

  // ── Missing urgency/timing question ──
  const urgencyKeywords = ["urgent", "when", "timeline", "timing", "start", "deadline", "asap"];
  const hasUrgency = questions.some(q =>
    urgencyKeywords.some(k => q.label.toLowerCase().includes(k))
  );
  if (!hasUrgency) {
    warnings.push({
      rule: "missing_urgency",
      message: "No timing/urgency question detected",
      severity: "info",
    });
  }

  // ── Missing budget/scope signal ──
  const budgetKeywords = ["budget", "price", "cost", "spend", "quote", "estimate"];
  const hasBudget = questions.some(q =>
    budgetKeywords.some(k => q.label.toLowerCase().includes(k))
  );
  if (!hasBudget) {
    warnings.push({
      rule: "missing_budget_signal",
      message: "No budget/pricing question detected",
      severity: "info",
    });
  }

  // ── All required = true (pack too heavy) ──
  const requiredCount = questions.filter(q => q.required !== false).length;
  if (questions.length >= 5 && requiredCount === questions.length) {
    warnings.push({
      rule: "all_required",
      message: "All questions are required — consider making some optional to reduce friction",
      severity: "info",
    });
  }

  return warnings;
}

// ────────────────────────────────────────────────────────
// Quality Scoring (aligned with seedpacks/audit)
// ────────────────────────────────────────────────────────

function scorePack(questions: PackQuestion[], lintWarnings: LintWarning[]): { score: number; tier: PackValidationResult["qualityTier"] } {
  let score = 0;
  const qCount = questions.length;

  // Banned phrases → heavy penalty
  const bannedCount = lintWarnings.filter(w => w.rule === "banned_phrase").length;
  score -= bannedCount * 5;

  // Question count in sweet spot
  if (qCount >= OPTIMAL_MIN && qCount <= OPTIMAL_MAX) score += 1;

  // Good choice ratio
  const choiceTypes = ["radio", "checkbox", "select"];
  const choiceCount = questions.filter(q => choiceTypes.includes(q.type)).length;
  if (qCount > 0 && choiceCount / qCount >= 0.7) score += 1;

  // Conditional logic bonus
  if (questions.some(q => q.show_if)) score += 2;

  // Has photo question bonus
  if (questions.some(q => q.type === "photo" || q.type === "file")) score += 1;

  // Determine tier
  let tier: PackValidationResult["qualityTier"];
  if (score < 0) tier = "FAILING";
  else if (score <= 1) tier = "WEAK";
  else if (score <= 4) tier = "ACCEPTABLE";
  else tier = "STRONG";

  return { score, tier };
}

// ────────────────────────────────────────────────────────
// Main Validation Function
// ────────────────────────────────────────────────────────

/**
 * Validate a question pack: schema + lint + score.
 * Returns a full validation result without throwing.
 */
export function validateQuestionPack(pack: {
  micro_slug: string;
  title: string;
  questions: unknown[];
  schema_version?: number;
}): PackValidationResult {
  // Step 1: Schema validation
  const parsed = QuestionPackContentSchema.safeParse(pack);

  if (!parsed.success) {
    const errors = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`);
    return {
      valid: false,
      status: "invalid",
      errors,
      lintWarnings: [],
      questionCount: Array.isArray(pack.questions) ? pack.questions.length : 0,
      qualityTier: "FAILING",
      score: -10,
    };
  }

  const validPack = parsed.data;

  // Step 2: Lint
  const lintWarnings = lintPack(validPack.questions, validPack.micro_slug);

  // Step 3: Score
  const { score, tier } = scorePack(validPack.questions, lintWarnings);

  // Determine status
  const hasBlockingWarnings = lintWarnings.some(w =>
    w.severity === "warning" && ["banned_phrase", "duplicate_ids", "invalid_show_if_ref"].includes(w.rule)
  );

  const status: PackStatus = tier === "FAILING" ? "invalid" : hasBlockingWarnings ? "draft" : "valid";

  return {
    valid: true,
    status,
    errors: [],
    lintWarnings,
    questionCount: validPack.questions.length,
    qualityTier: tier,
    score,
  };
}

/**
 * Validate an array of raw questions (e.g. from DB JSONB).
 * Convenience wrapper that handles type coercion.
 */
export function validatePackQuestions(
  microSlug: string,
  title: string,
  rawQuestions: unknown[]
): PackValidationResult {
  return validateQuestionPack({
    micro_slug: microSlug,
    title,
    questions: rawQuestions,
  });
}
