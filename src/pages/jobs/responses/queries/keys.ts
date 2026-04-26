/**
 * React Query keys for the Track 5 responses domain.
 * Centralized so mutations can invalidate predictably.
 */

export const responseKeys = {
  all: ["responses"] as const,
  forJob: (jobId: string) => [...responseKeys.all, "job", jobId] as const,
  mine: (jobId: string, userId: string) =>
    [...responseKeys.all, "mine", jobId, userId] as const,
  mineNone: () => [...responseKeys.all, "mine", "none"] as const,
};
