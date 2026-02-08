/**
 * Wizard Link Builder
 * SINGLE SOURCE OF TRUTH for all wizard navigation.
 * All entry points MUST use this - no inline URL strings.
 * 
 * Rule: Navigate only → wizard resolves URL → state
 */

export type WizardLinkParams =
  | { mode: "fresh" }
  | { mode: "category"; categoryId: string }
  | { mode: "subcategory"; categoryId: string; subcategoryId: string }
  | { mode: "micro"; categoryId: string; subcategoryId: string; microSlug: string }
  | { mode: "microOnly"; microSlug: string }
  | { mode: "direct"; professionalId: string }
  | { mode: "resume" };

/**
 * Build a wizard URL from typed parameters.
 * This is the ONLY place that constructs /post URLs.
 */
export function buildWizardLink(params: WizardLinkParams): string {
  const base = "/post";
  
  switch (params.mode) {
    case "fresh":
      return base;
      
    case "category":
      return `${base}?category=${encodeURIComponent(params.categoryId)}&step=subcategory`;
      
    case "subcategory":
      return `${base}?category=${encodeURIComponent(params.categoryId)}&subcategory=${encodeURIComponent(params.subcategoryId)}&step=micro`;
      
    case "micro":
      return `${base}?category=${encodeURIComponent(params.categoryId)}&subcategory=${encodeURIComponent(params.subcategoryId)}&micro=${encodeURIComponent(params.microSlug)}&step=questions`;
      
    case "microOnly":
      // Fallback when parent IDs are missing - wizard will do lookup
      return `${base}?micro=${encodeURIComponent(params.microSlug)}&step=questions`;
      
    case "direct":
      return `${base}?pro=${encodeURIComponent(params.professionalId)}`;
      
    case "resume":
      return `${base}?resume=true`;
      
    default:
      return base;
  }
}
