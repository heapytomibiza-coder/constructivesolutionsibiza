/**
 * Centralized query keys for the jobs domain.
 * Keeps keys consistent and makes cache invalidation predictable.
 */

export const jobKeys = {
  all: ["jobs"] as const,
  
  // Jobs board (list view)
  board: () => [...jobKeys.all, "board"] as const,
  
  // Job details (single job)
  details: (id: string) => [...jobKeys.all, "details", id] as const,
  detailsNone: () => [...jobKeys.all, "details", "none"] as const,
  
  // Matched jobs for professionals
  matched: (userId: string) => [...jobKeys.all, "matched", userId] as const,
  matchedNone: () => [...jobKeys.all, "matched", "none"] as const,
  
  // Question packs for display - use stable string key
  questionPacks: (slugs: string[]) => 
    [...jobKeys.all, "question_packs", slugs.slice().sort().join(",")] as const,
};
