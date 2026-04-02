/**
 * JobTicketReview — Leave review section.
 * Role-aware: clients review the professional, professionals review the client.
 * Shown when job is completed and the current user hasn't reviewed yet.
 *
 * Auto-opens RatingModal:
 *  - Client: immediately after completion (via sessionStorage flag from JobTicketCompletion)
 *  - Professional: once per session on first visit to completed ticket
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { submitReview } from '@/pages/jobs/actions/submitReview.action';
import { RatingModal } from '@/pages/jobs/components/RatingModal';

interface JobTicketReviewProps {
  jobId: string;
  jobStatus: string;
  assignedProfessionalId: string | null;
  assignedProfessionalName?: string;
  viewerRole?: 'client' | 'professional';
  clientId?: string;
  clientName?: string;
}

export function JobTicketReview({
  jobId,
  jobStatus,
  assignedProfessionalId,
  assignedProfessionalName,
  viewerRole = 'client',
  clientId,
  clientName,
}: JobTicketReviewProps) {
  const { t } = useTranslation('dashboard');
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const reviewerRole = viewerRole;
  const revieweeId = viewerRole === 'client' ? assignedProfessionalId : clientId;
  const revieweeName = viewerRole === 'client' ? assignedProfessionalName : clientName;

  // Check if user already reviewed
  const { data: existingReview, isLoading } = useQuery({
    queryKey: ['user_review', jobId, user?.id, reviewerRole],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('job_reviews')
        .select('id, rating, comment')
        .eq('job_id', jobId)
        .eq('reviewer_user_id', user.id)
        .eq('reviewer_role', reviewerRole)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId && !!user && jobStatus === 'completed',
  });

  // Auto-open review modal for BOTH roles (once per session)
  useEffect(() => {
    if (jobStatus !== 'completed' || isLoading || existingReview || !revieweeId) return;

    if (viewerRole === 'client') {
      // Client: check flag set by JobTicketCompletion
      const autoOpenKey = `review_auto_open_${jobId}`;
      if (!sessionStorage.getItem(autoOpenKey)) return;

      // Consume the flag so it only fires once
      sessionStorage.removeItem(autoOpenKey);
      const timer = setTimeout(() => setShowReviewModal(true), 400);
      return () => clearTimeout(timer);
    } else {
      // Professional: once per session on first visit
      const sessionKey = `review_prompted_${jobId}`;
      if (sessionStorage.getItem(sessionKey)) return;

      const timer = setTimeout(() => {
        sessionStorage.setItem(sessionKey, '1');
        setShowReviewModal(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [viewerRole, jobStatus, isLoading, existingReview, revieweeId, jobId]);

  if (jobStatus !== 'completed' || !revieweeId || isLoading) return null;

  // Already reviewed
  if (existingReview) {
    return (
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4.5 w-4.5 text-success" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">
                {t('jobTicket.reviewSubmitted', 'Review submitted')}
              </p>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < existingReview.rating ? 'fill-accent text-accent' : 'text-muted-foreground/20'
                    )}
                  />
                ))}
              </div>
              {existingReview.comment && (
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  "{existingReview.comment}"
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleModalSubmit = async (modalRating: number, modalComment: string) => {
    if (!revieweeId) return;
    const result = await submitReview({
      jobId,
      revieweeId,
      reviewerRole,
      rating: modalRating,
      comment: modalComment,
    });
    if (!result.success) {
      toast.error(result.error ?? 'Failed to submit review');
      throw new Error(result.error);
    }
    toast.success(t('client.ratingSuccess', 'Thanks for your rating!'));
    queryClient.invalidateQueries({ queryKey: ['user_review', jobId] });
    queryClient.invalidateQueries({ queryKey: ['job_review_exists', jobId] });
    queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
    queryClient.invalidateQueries({ queryKey: ['pro_reviews'] });
    queryClient.invalidateQueries({ queryKey: ['pro_review_agg'] });
    queryClient.invalidateQueries({ queryKey: ['public_pro_reviews'] });
    setShowReviewModal(false);
  };

  const handleInlineSubmit = async () => {
    if (!user || rating === 0) {
      toast.error(t('jobTicket.ratingRequired', 'Please select a rating'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitReview({
        jobId,
        revieweeId: revieweeId!,
        reviewerRole,
        rating,
        comment,
      });
      if (!result.success) {
        toast.error(result.error ?? t('client.ratingFailed', 'Failed to submit rating'));
        return;
      }
      toast.success(t('client.ratingSuccess', 'Thanks for your rating!'));
      queryClient.invalidateQueries({ queryKey: ['user_review', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job_review_exists', jobId] });
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['pro_reviews'] });
      queryClient.invalidateQueries({ queryKey: ['pro_review_agg'] });
      queryClient.invalidateQueries({ queryKey: ['public_pro_reviews'] });
    } catch {
      toast.error(t('client.ratingFailed', 'Failed to submit rating'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const promptText = viewerRole === 'client'
    ? t('reviews.rateExperience', 'Rate your experience')
    : t('reviews.rateClient', 'Rate this client');

  return (
    <>
      <Card className="border-accent/20 bg-accent/[0.03]">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{promptText}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('jobTicket.reviewHelps', 'Your review helps build trust and helps others make better decisions.')}
            </p>
          </div>

          {/* Star rating */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                className="p-0.5 transition-transform hover:scale-110"
                onMouseEnter={() => setHoverRating(i + 1)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(i + 1)}
              >
                <Star
                  className={cn(
                    'h-7 w-7 transition-colors',
                    i < (hoverRating || rating)
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground/30'
                  )}
                />
              </button>
            ))}
          </div>

          {/* Comment */}
          <textarea
            placeholder={t('jobTicket.reviewPlaceholder', 'How was your experience? (optional)')}
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />

          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleInlineSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Star className="h-3.5 w-3.5" />
            )}
            {t('jobTicket.submitReview', 'Submit Review')}
          </Button>
        </CardContent>
      </Card>

      {/* Auto-triggered review modal */}
      <RatingModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        revieweeName={revieweeName}
        reviewerRole={reviewerRole}
        onSubmit={handleModalSubmit}
        onSkip={() => setShowReviewModal(false)}
      />
    </>
  );
}
