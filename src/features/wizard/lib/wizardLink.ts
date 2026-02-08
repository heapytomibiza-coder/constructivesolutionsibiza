/**
 * Wizard Link Builder
 * SINGLE SOURCE OF TRUTH for all wizard navigation.
 * All entry points MUST use this - no inline URL strings.
 * 
 * SAFETY RULE: Never navigate to a step that lacks required context.
 * If parents are missing, fallback to the nearest safe step.
 */

/**
 * Wizard Link Params
 * 
 * SMART LADDER: Search hits use the most specific mode available.
 * No fallback modes - the ladder is built into buildWizardUrlFromHit.
 */
export type WizardLinkParams =
  | { mode: "fresh" }
  | { mode: "category"; categoryId: string }
  | { mode: "subcategory"; categoryId: string; subcategoryId: string }
  | { mode: "micro"; categoryId: string; subcategoryId: string; microSlug: string }
  | { mode: "microOnly"; microSlug: string }  // Micro-only: deep-link processor will hydrate parents
  | { mode: "direct"; professionalId: string }
  | { mode: "resume" };

// Helper for URL query params with encoding - drops empty values
const qp = (k: string, v: string | undefined): string => {
  const value = (v ?? "").toString().trim();
  if (!value) return ""; // Drop empty params entirely
  return `${k}=${encodeURIComponent(value)}`;
};

// Join non-empty query param strings
const joinParams = (parts: string[]): string => parts.filter(Boolean).join("&");

/**
 * Build a wizard URL from typed parameters.
 * This is the ONLY place that constructs /post URLs.
 * 
 * NEVER generates a URL that would land users in an inconsistent state.
 * Empty params are automatically dropped.
 */
export function buildWizardLink(params: WizardLinkParams): string {
  const base = "/post";
  
  switch (params.mode) {
    case "fresh":
      return base;
      
    case "category": {
      const qs = joinParams([qp("category", params.categoryId), "step=subcategory"]);
      return qs ? `${base}?${qs}` : base;
    }
      
    case "subcategory": {
      const qs = joinParams([
        qp("category", params.categoryId),
        qp("subcategory", params.subcategoryId),
        "step=micro",
      ]);
      return qs ? `${base}?${qs}` : base;
    }
      
    case "micro": {
      const qs = joinParams([
        qp("category", params.categoryId),
        qp("subcategory", params.subcategoryId),
        qp("micro", params.microSlug),
        "step=questions",
      ]);
      return qs ? `${base}?${qs}` : base;
    }
      
    case "microOnly":
      // Micro slug only - deep-link processor will hydrate parents from DB
      return `${base}?${qp("micro", params.microSlug)}`;
      
    case "direct":
      // Direct professional targeting (for "Request Quote" flows)
      return `${base}?${qp("pro", params.professionalId)}`;
      
    case "resume":
      // Resume from saved draft
      return `${base}?resume=true`;
  }
}
