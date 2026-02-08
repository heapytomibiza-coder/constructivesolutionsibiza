/**
 * Search System Types
 * 
 * SINGLE SOURCE OF TRUTH for search result typing and wizard deep-linking.
 * All search entry points (homepage, service pages, dashboard) use these types.
 */

// === SEARCH HIT TYPES ===

export type SearchHitType = "category" | "subcategory" | "micro";

export interface SearchHit {
  type: SearchHitType;
  id: string;                 // the entity id (UUID)
  label: string;              // display label
  sublabel?: string;          // breadcrumb context (e.g., "Plumbing → Repairs")
  categoryId?: string;        // required for subcategory/micro
  categoryName?: string;      // for display
  subcategoryId?: string;     // required for micro
  subcategoryName?: string;   // for display
  microSlug?: string;         // wizard keys by slug
  score: number;              // ranking score (higher = better match)
  reason?: string;            // optional match context
}

export interface ForumHit {
  type: "forum";
  id: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  replyCount: number;
}

export type UniversalSearchResult = SearchHit | ForumHit;

// === URL BUILDER (THE LOCK-IN) ===

/**
 * Converts a SearchHit into a wizard URL.
 * 
 * KEY PRINCIPLE: Search never sets wizard state directly.
 * It only navigates to a URL, and the wizard loads state from URL.
 * This is how we avoid "works sometimes" bugs.
 */
export function buildWizardUrlFromHit(hit: SearchHit): string {
  const base = "/post";
  
  switch (hit.type) {
    case "category":
      // Category → go to subcategory selection with category pre-filled
      return `${base}?category=${hit.id}&step=subcategory`;
      
    case "subcategory":
      // Subcategory → go to micro selection with cat+sub pre-filled
      if (!hit.categoryId) {
        console.warn("SearchHit subcategory missing categoryId, falling back");
        return `${base}?subcategory=${hit.id}&step=micro`;
      }
      return `${base}?category=${hit.categoryId}&subcategory=${hit.id}&step=micro`;
      
    case "micro":
      // Micro → go to questions with full hierarchy pre-filled
      if (!hit.categoryId || !hit.subcategoryId) {
        console.warn("SearchHit micro missing parent IDs, falling back");
        return `${base}?micro=${hit.microSlug || hit.id}&step=questions`;
      }
      return `${base}?category=${hit.categoryId}&subcategory=${hit.subcategoryId}&micro=${hit.microSlug || hit.id}&step=questions`;
      
    default:
      return base;
  }
}

/**
 * Build forum post URL
 */
export function buildForumUrl(hit: ForumHit): string {
  return `/forum/${hit.categorySlug}/${hit.id}`;
}

// === RESULT TYPE GUARDS ===

export function isServiceHit(result: UniversalSearchResult): result is SearchHit {
  return result.type === "category" || result.type === "subcategory" || result.type === "micro";
}

export function isForumHit(result: UniversalSearchResult): result is ForumHit {
  return result.type === "forum";
}

// === DISPLAY HELPERS ===

export function getHitTypeLabel(type: SearchHitType): string {
  switch (type) {
    case "category": return "Category";
    case "subcategory": return "Service";
    case "micro": return "Task";
  }
}

export function getHitBreadcrumb(hit: SearchHit): string {
  switch (hit.type) {
    case "category":
      return "";
    case "subcategory":
      return hit.categoryName || "";
    case "micro":
      return [hit.categoryName, hit.subcategoryName].filter(Boolean).join(" → ");
  }
}
