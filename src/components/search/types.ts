/**
 * Search System Types
 * 
 * SINGLE SOURCE OF TRUTH for search result typing and wizard deep-linking.
 * All search entry points (homepage, service pages, dashboard) use these types.
 * 
 * SAFETY RULE: Never navigate to a step that lacks required context.
 */

import { buildWizardLink } from "@/features/wizard/lib/wizardLink";

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

// === URL BUILDER (SMART LADDER) ===

/**
 * Converts a SearchHit into a wizard URL using the SMART LADDER.
 * 
 * SMART LADDER (preserves maximum context on fallback):
 * - Full hierarchy → Questions step
 * - Cat + Sub only → Micro step  
 * - Category only → Subcategory step
 * - Micro slug only → Deep-link with hydration
 * - Nothing → Fresh start
 * 
 * KEY PRINCIPLES:
 * 1. Search never sets wizard state directly - only navigates to URL
 * 2. Never throw away valid parent context when child is missing
 * 3. Micro-only links let deep-link processor hydrate parents from DB
 */
export function buildWizardUrlFromHit(hit: SearchHit): string {
  switch (hit.type) {
    case "category": {
      // Category → go to subcategory selection with category pre-filled
      return buildWizardLink({ mode: "category", categoryId: hit.id });
    }

    case "subcategory": {
      // SMART LADDER: subcategory requires categoryId
      if (hit.categoryId) {
        return buildWizardLink({ 
          mode: "subcategory", 
          categoryId: hit.categoryId, 
          subcategoryId: hit.id 
        });
      }
      // Missing category → fresh start (can't create valid subcategory link)
      // Subcategory missing categoryId - falling back to fresh
      return buildWizardLink({ mode: "fresh" });
    }

    case "micro": {
      // Best case: full hierarchy available
      if (hit.categoryId && hit.subcategoryId && hit.microSlug) {
        return buildWizardLink({
          mode: "micro",
          categoryId: hit.categoryId,
          subcategoryId: hit.subcategoryId,
          microSlug: hit.microSlug,
        });
      }

      // SMART LADDER: have cat+sub but missing slug → go to micro step
      if (hit.categoryId && hit.subcategoryId) {
        // Micro missing slug - falling back to subcategory mode
        return buildWizardLink({
          mode: "subcategory",
          categoryId: hit.categoryId,
          subcategoryId: hit.subcategoryId,
        });
      }

      // SMART LADDER: have category only → go to subcategory step
      if (hit.categoryId) {
        // Micro missing subcategory - falling back to category mode
        return buildWizardLink({ mode: "category", categoryId: hit.categoryId });
      }

      // Micro slug only (no parents) → use microOnly, let deep-link processor hydrate
      if (hit.microSlug) {
        // Micro missing parents - using microOnly (will hydrate)
        return buildWizardLink({ mode: "microOnly", microSlug: hit.microSlug });
      }

      // No useful data → fresh start
      // Micro missing all context - falling back to fresh
      return buildWizardLink({ mode: "fresh" });
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
