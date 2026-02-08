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

import { buildWizardLink } from "@/lib/wizardLink";

/**
 * Converts a SearchHit into a wizard URL.
 * 
 * KEY PRINCIPLE: Search never sets wizard state directly.
 * It only navigates to a URL, and the wizard loads state from URL.
 * This delegates to the centralized buildWizardLink for consistency.
 */
export function buildWizardUrlFromHit(hit: SearchHit): string {
  switch (hit.type) {
    case "category":
      return buildWizardLink({ mode: "category", categoryId: hit.id });
      
    case "subcategory":
      if (!hit.categoryId) {
        console.warn("SearchHit subcategory missing categoryId, using category mode");
        return buildWizardLink({ mode: "category", categoryId: hit.id });
      }
      return buildWizardLink({ 
        mode: "subcategory", 
        categoryId: hit.categoryId, 
        subcategoryId: hit.id 
      });
      
    case "micro":
      // Best case: full hierarchy available
      if (hit.categoryId && hit.subcategoryId && hit.microSlug) {
        return buildWizardLink({
          mode: "micro",
          categoryId: hit.categoryId,
          subcategoryId: hit.subcategoryId,
          microSlug: hit.microSlug,
        });
      }
      // Fallback: have micro slug but missing parents - wizard will lookup
      if (hit.microSlug) {
        console.warn("SearchHit micro missing parent IDs, using microOnly mode");
        return buildWizardLink({ mode: "microOnly", microSlug: hit.microSlug });
      }
      // Last resort: use ID as slug
      console.warn("SearchHit micro missing microSlug, using ID as fallback");
      return buildWizardLink({ mode: "microOnly", microSlug: hit.id });
      
    default:
      return buildWizardLink({ mode: "fresh" });
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
