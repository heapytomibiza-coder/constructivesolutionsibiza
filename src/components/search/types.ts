/**
 * Search System Types
 * 
 * SINGLE SOURCE OF TRUTH for search result typing and wizard deep-linking.
 * All search entry points (homepage, service pages, dashboard) use these types.
 * 
 * SAFETY RULE: Never navigate to a step that lacks required context.
 */

import { buildWizardLink } from "@/lib/wizardLink";

// === SEARCH HIT TYPES ===

export type SearchHitType = "category" | "subcategory" | "micro";

export interface SearchHit {
  type: SearchHitType;
  id: string;                 // the entity id (UUID)
  label: string;              // display label
  categoryId?: string;        // required for subcategory/micro
  categoryName?: string;      // for display breadcrumb
  subcategoryId?: string;     // required for micro
  subcategoryName?: string;   // for display breadcrumb
  microSlug?: string;         // wizard keys by slug
  score: number;              // ranking score (higher = better match)
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
 * KEY PRINCIPLES:
 * 1. Search never sets wizard state directly - only navigates to URL
 * 2. Never generate a URL that would land users in an inconsistent state
 * 3. If parents are missing, fallback to the nearest safe step
 */
export function buildWizardUrlFromHit(hit: SearchHit): string {
  switch (hit.type) {
    case "category": {
      // Category → go to subcategory selection with category pre-filled
      return buildWizardLink({ mode: "category", categoryId: hit.id });
    }

    case "subcategory": {
      // Subcategory → requires categoryId to be a true deep-link
      if (!hit.categoryId) {
        console.warn("SearchHit subcategory missing categoryId, falling back to safe step");
        return buildWizardLink({ mode: "subcategoryFallback" });
      }
      return buildWizardLink({ 
        mode: "subcategory", 
        categoryId: hit.categoryId, 
        subcategoryId: hit.id 
      });
    }

    case "micro": {
      // Best case: full hierarchy available (preferred path)
      if (hit.categoryId && hit.subcategoryId && hit.microSlug) {
        return buildWizardLink({
          mode: "micro",
          categoryId: hit.categoryId,
          subcategoryId: hit.subcategoryId,
          microSlug: hit.microSlug,
        });
      }

      // SAFE FALLBACK: We have micro slug but missing parent IDs
      // Since wizard cannot hydrate parents from micro alone,
      // go to micro step (not questions) so user can confirm selection
      if (hit.microSlug) {
        console.warn("SearchHit micro missing parent IDs, falling back to safe micro step");
        return buildWizardLink({ mode: "microFallback", microSlug: hit.microSlug });
      }

      // Last resort: micro id only → still safe micro step
      console.warn("SearchHit micro missing microSlug, falling back to safe micro step");
      return buildWizardLink({ mode: "microFallback", microSlug: hit.id });
    }

    default:
      return buildWizardLink({ mode: "fresh" });
  }
}

/**
 * Build forum post URL
 */
export function buildForumUrl(hit: ForumHit): string {
  return `/forum/${encodeURIComponent(hit.categorySlug)}/${encodeURIComponent(hit.id)}`;
}

// === RESULT TYPE GUARDS ===

export function isServiceHit(result: UniversalSearchResult): result is SearchHit {
  return result.type === "category" || result.type === "subcategory" || result.type === "micro";
}

export function isForumHit(result: UniversalSearchResult): result is ForumHit {
  return result.type === "forum";
}

// === DISPLAY HELPERS (i18n-ready) ===

/**
 * Returns i18n key for hit type label.
 * Usage: t(getHitTypeLabelKey(hit.type))
 */
export function getHitTypeLabelKey(type: SearchHitType): string {
  switch (type) {
    case "category": return "universalSearch.type.category";
    case "subcategory": return "universalSearch.type.service";
    case "micro": return "universalSearch.type.task";
  }
}

/**
 * Legacy helper for non-i18n contexts.
 * Prefer getHitTypeLabelKey for UI components.
 */
export function getHitTypeLabel(type: SearchHitType): string {
  switch (type) {
    case "category": return "Category";
    case "subcategory": return "Service";
    case "micro": return "Task";
  }
}

/**
 * Build breadcrumb string from hit hierarchy.
 * Returns empty string for categories (no parent context).
 */
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
