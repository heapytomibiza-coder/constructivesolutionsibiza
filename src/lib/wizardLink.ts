/**
 * Wizard Link Builder
 * SINGLE SOURCE OF TRUTH for all wizard navigation.
 * All entry points MUST use this - no inline URL strings.
 * 
 * SAFETY RULE: Never navigate to a step that lacks required context.
 * If parents are missing, fallback to the nearest safe step.
 */

export type WizardLinkParams =
  | { mode: "fresh" }
  | { mode: "category"; categoryId: string }
  | { mode: "subcategory"; categoryId: string; subcategoryId: string }
  | { mode: "micro"; categoryId: string; subcategoryId: string; microSlug: string }
  | { mode: "microFallback"; microSlug: string }  // Safe fallback: goes to micro step, not questions
  | { mode: "subcategoryFallback" }               // Safe fallback: goes to subcategory step
  | { mode: "direct"; professionalId: string }
  | { mode: "resume" };

// Helper for URL query params with encoding
const qp = (k: string, v: string) => `${k}=${encodeURIComponent(v)}`;

/**
 * Build a wizard URL from typed parameters.
 * This is the ONLY place that constructs /post URLs.
 * 
 * NEVER generates a URL that would land users in an inconsistent state.
 */
export function buildWizardLink(params: WizardLinkParams): string {
  const base = "/post";
  
  switch (params.mode) {
    case "fresh":
      return base;
      
    case "category":
      // Category → go to subcategory selection with category pre-filled
      return `${base}?${qp("category", params.categoryId)}&step=subcategory`;
      
    case "subcategory":
      // Subcategory → go to micro selection with cat+sub pre-filled
      return `${base}?${qp("category", params.categoryId)}&${qp("subcategory", params.subcategoryId)}&step=micro`;
      
    case "micro":
      // Full hierarchy → go straight to questions (best case)
      return `${base}?${qp("category", params.categoryId)}&${qp("subcategory", params.subcategoryId)}&${qp("micro", params.microSlug)}&step=questions`;
      
    case "microFallback":
      // SAFE FALLBACK: We have micro but missing parents
      // Go to micro step (not questions) so user can confirm selection
      // The wizard resolver will enforce this anyway, but we're explicit here
      return `${base}?${qp("micro", params.microSlug)}&step=micro`;
      
    case "subcategoryFallback":
      // SAFE FALLBACK: Missing category context entirely
      // Start fresh at subcategory selection
      return `${base}?step=subcategory`;
      
    case "direct":
      // Direct professional targeting (for "Request Quote" flows)
      return `${base}?${qp("pro", params.professionalId)}`;
      
    case "resume":
      // Resume from saved draft
      return `${base}?resume=true`;
      
    default:
      return base;
  }
}
