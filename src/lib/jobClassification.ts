/**
 * Job Classification (UI-only, display layer)
 *
 * Derives a human-friendly job "display type" from existing interpretation
 * signals. This is purely presentational:
 *  - Does NOT change matching, notifications, scoring or DB writes.
 *  - Does NOT block any action.
 *  - Defensive: missing/partial input never throws.
 */

export type JobDisplayType =
  | "QUICK_QUOTE"
  | "SITE_VISIT_REQUIRED"
  | "COMPLEX_PROJECT"
  | "NEEDS_CLARIFICATION";

/**
 * Accepts both the brief's naming (`interpretation_flags`, `inspection_bias`)
 * and the live DB column names used across the app
 * (`flags`, `computed_inspection_bias`) so it's drop-in safe everywhere.
 */
export type JobClassificationInput = {
  flags?: string[] | null;
  interpretation_flags?: string[] | null;
  inspection_bias?: string | null;
  computed_inspection_bias?: string | null;
  description?: string | null;
};

const COMPLEX_FLAGS = new Set([
  "MULTI_TRADE",
  "PHASED_WORK_REQUIRED",
  "STRUCTURAL_WORK",
  "MULTIPLE_VISITS_REQUIRED",
]);

const INSPECTION_FLAGS = new Set([
  "QUOTE_SUBJECT_TO_INSPECTION",
  "SITE_VISIT_REQUIRED",
  "SITE_VISIT_NEEDED",
  "INSPECTION_REQUIRED",
  "INSPECTION_MANDATORY",
  "NEW_PIPEWORK_NEEDED",
  "HIDDEN_CONDITIONS_LIKELY",
]);

const CLARITY_FLAGS = new Set([
  "SCOPE_UNCLEAR",
  "MISSING_MEASUREMENTS",
  "MISSING_PHOTOS",
]);

const MIN_DESCRIPTION_CHARS = 40;

export function classifyJobDisplayType(
  job: JobClassificationInput | null | undefined,
): JobDisplayType {
  const flagList = Array.isArray(job?.interpretation_flags)
    ? job!.interpretation_flags!
    : Array.isArray(job?.flags)
      ? job!.flags!
      : [];
  const flags = new Set(flagList.filter((f): f is string => typeof f === "string"));

  const inspectionBias = job?.inspection_bias ?? job?.computed_inspection_bias ?? null;
  const description = typeof job?.description === "string" ? job!.description! : "";

  const hasComplexFlag = [...flags].some((f) => COMPLEX_FLAGS.has(f));
  if (hasComplexFlag) return "COMPLEX_PROJECT";

  const needsInspection =
    inspectionBias === "high" ||
    inspectionBias === "mandatory" ||
    [...flags].some((f) => INSPECTION_FLAGS.has(f));
  if (needsInspection) return "SITE_VISIT_REQUIRED";

  const lacksClarity =
    [...flags].some((f) => CLARITY_FLAGS.has(f)) ||
    description.trim().length < MIN_DESCRIPTION_CHARS;
  if (lacksClarity) return "NEEDS_CLARIFICATION";

  return "QUICK_QUOTE";
}

/* ─────────────────────────────────────────────────────────────────
 * Display copy — three audiences
 * ──────────────────────────────────────────────────────────────── */

export type JobDisplayAudience = "client" | "pro" | "admin";

export type JobDisplayCopy = {
  title: string;
  shortLabel: string;
  description: string;
};

const AUDIENCE_COPY: Record<JobDisplayAudience, Record<JobDisplayType, JobDisplayCopy>> = {
  client: {
    QUICK_QUOTE: {
      title: "Quick quote likely",
      shortLabel: "Quick quote",
      description: "Your job looks clear enough for professionals to respond.",
    },
    SITE_VISIT_REQUIRED: {
      title: "Site visit likely",
      shortLabel: "Site visit likely",
      description: "A professional may need to inspect this before giving a reliable price.",
    },
    COMPLEX_PROJECT: {
      title: "Complex job",
      shortLabel: "Complex job",
      description: "This looks like a larger or staged job. Clear details will help professionals respond.",
    },
    NEEDS_CLARIFICATION: {
      title: "Needs more detail",
      shortLabel: "Needs detail",
      description: "Adding photos, measurements, or more detail may help you get better responses.",
    },
  },
  pro: {
    QUICK_QUOTE: {
      title: "Quick quote",
      shortLabel: "Quick quote",
      description: "This looks clear enough to respond with an initial quote or message.",
    },
    SITE_VISIT_REQUIRED: {
      title: "Site visit likely",
      shortLabel: "Site visit likely",
      description: "This job may need a visit before an accurate price can be given. You can still message the client to arrange next steps.",
    },
    COMPLEX_PROJECT: {
      title: "Complex job",
      shortLabel: "Complex job",
      description: "This may involve multiple stages or trades. Ask clear questions before quoting.",
    },
    NEEDS_CLARIFICATION: {
      title: "Needs detail",
      shortLabel: "Needs detail",
      description: "This job may need more information before pricing. Ask the client for photos, measurements, or clarification.",
    },
  },
  admin: {
    QUICK_QUOTE: {
      title: "Quick quote",
      shortLabel: "Quick quote",
      description: "Low-friction job. Should be suitable for direct response.",
    },
    SITE_VISIT_REQUIRED: {
      title: "Site visit likely",
      shortLabel: "Site visit likely",
      description: "Inspection-dependent job. May need manual follow-up or site-visit guidance.",
    },
    COMPLEX_PROJECT: {
      title: "Complex project",
      shortLabel: "Complex project",
      description: "Coordination-heavy job. Watch for low response rate.",
    },
    NEEDS_CLARIFICATION: {
      title: "Needs detail",
      shortLabel: "Needs detail",
      description: "Low-clarity job. May need client follow-up before pros engage.",
    },
  },
};

export function getJobDisplayCopy(
  type: JobDisplayType,
  audience: JobDisplayAudience = "pro",
): JobDisplayCopy {
  return AUDIENCE_COPY[audience][type];
}

/**
 * Map display type → existing Badge variant.
 * IMPORTANT: only uses variants already declared in `src/components/ui/badge.tsx`
 * (default | secondary | destructive | outline | success | warning | accent).
 * Do not introduce new variants here.
 */
export function jobDisplayTypeBadgeVariant(
  type: JobDisplayType,
): "success" | "secondary" | "warning" | "outline" {
  switch (type) {
    case "QUICK_QUOTE":
      return "success";
    case "SITE_VISIT_REQUIRED":
      return "secondary";
    case "COMPLEX_PROJECT":
      return "warning";
    case "NEEDS_CLARIFICATION":
      return "outline";
  }
}
