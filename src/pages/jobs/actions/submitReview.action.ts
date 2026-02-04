import { supabase } from '@/integrations/supabase/client';

interface SubmitReviewParams {
  jobId: string;
  revieweeId: string;
  reviewerRole: 'client' | 'professional';
  rating: number;
  comment?: string;
}

/**
 * Submit a review for a completed job.
 * 
 * Visibility rules:
 * - Client reviewing professional: 'public' (builds pro reputation)
 * - Professional reviewing client: 'private' (internal signal only)
 */
export async function submitReview({
  jobId,
  revieweeId,
  reviewerRole,
  rating,
  comment,
}: SubmitReviewParams): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Determine visibility based on reviewer role
  const visibility = reviewerRole === 'client' ? 'public' : 'private';
  const revieweeRole = reviewerRole === 'client' ? 'professional' : 'client';

  const { error } = await supabase
    .from('job_reviews')
    .insert({
      job_id: jobId,
      reviewer_user_id: user.id,
      reviewee_user_id: revieweeId,
      reviewer_role: reviewerRole,
      reviewee_role: revieweeRole,
      rating,
      comment: comment?.trim() || null,
      visibility,
    });

  if (error) {
    // Handle duplicate review attempt
    if (error.code === '23505') {
      return { success: false, error: 'You have already reviewed this job' };
    }
    console.error('Error submitting review:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if the current user has already reviewed a job.
 */
export async function hasReviewedJob(jobId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data, error } = await supabase
    .from('job_reviews')
    .select('id')
    .eq('job_id', jobId)
    .eq('reviewer_user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error checking review status:', error);
    return false;
  }

  return !!data;
}

/**
 * Get pending reviews for the current user.
 * Returns jobs that are completed within the last 30 days and haven't been reviewed.
 */
export async function getPendingReviews(): Promise<Array<{
  jobId: string;
  jobTitle: string;
  otherPartyId: string;
  reviewerRole: 'client' | 'professional';
}>> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get jobs where user is owner (client) or assigned pro
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, user_id, assigned_professional_id')
    .eq('status', 'completed')
    .gte('completed_at', thirtyDaysAgo.toISOString())
    .or(`user_id.eq.${user.id},assigned_professional_id.eq.${user.id}`);

  if (error || !jobs) {
    console.error('Error fetching pending reviews:', error);
    return [];
  }

  // Get existing reviews by this user
  const jobIds = jobs.map(j => j.id);
  if (jobIds.length === 0) return [];

  const { data: existingReviews } = await supabase
    .from('job_reviews')
    .select('job_id')
    .eq('reviewer_user_id', user.id)
    .in('job_id', jobIds);

  const reviewedJobIds = new Set(existingReviews?.map(r => r.job_id) || []);

  // Filter to jobs not yet reviewed
  return jobs
    .filter(job => !reviewedJobIds.has(job.id))
    .filter(job => {
      // Must have both parties to review
      if (job.user_id === user.id) {
        return job.assigned_professional_id != null;
      }
      return true;
    })
    .map(job => {
      const isClient = job.user_id === user.id;
      return {
        jobId: job.id,
        jobTitle: job.title,
        otherPartyId: isClient ? job.assigned_professional_id! : job.user_id,
        reviewerRole: isClient ? 'client' as const : 'professional' as const,
      };
    });
}
