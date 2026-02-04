import { useQuery } from '@tanstack/react-query';
import { getPendingReviews } from '@/pages/jobs/actions/submitReview.action';

/**
 * Hook to fetch pending reviews for the current user.
 * Returns jobs that need rating (completed within 30 days, not yet reviewed).
 */
export function usePendingReviews() {
  return useQuery({
    queryKey: ['pending-reviews'],
    queryFn: getPendingReviews,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
