/**
 * JobTicketReview — Leave review section.
 * Shown when job is completed and client hasn't reviewed yet.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/trackEvent';
import { EVENTS } from '@/lib/eventTaxonomy';

interface JobTicketReviewProps {
  jobId: string;
  jobStatus: string;
  assignedProfessionalId: string | null;
}

export function JobTicketReview({ jobId, jobStatus, assignedProfessionalId }: JobTicketReviewProps) {
  const { t } = useTranslation('dashboard');
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user already reviewed
  const { data: existingReview, isLoading } = useQuery({
    queryKey: ['client_review', jobId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('job_reviews')
        .select('id, rating, comment')
        .eq('job_id', jobId)
        .eq('reviewer_user_id', user.id)
        .eq('reviewer_role', 'client')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId && !!user && jobStatus === 'completed',
  });

  if (jobStatus !== 'completed' || !assignedProfessionalId || isLoading) return null;

  // Already reviewed
  if (existingReview) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">{t('jobTicket.reviewSubmitted', 'Review submitted')}</p>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < existingReview.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast.error(t('jobTicket.ratingRequired', 'Please select a rating'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('job_reviews').insert({
        job_id: jobId,
        reviewer_user_id: user.id,
        reviewer_role: 'client',
        reviewee_user_id: assignedProfessionalId,
        reviewee_role: 'professional',
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
      trackEvent(EVENTS.REVIEW_SUBMITTED, 'client', { rating }, { job_id: jobId, worker_id: assignedProfessionalId });
      toast.success(t('client.ratingSuccess', 'Thanks for your rating!'));
      queryClient.invalidateQueries({ queryKey: ['client_review', jobId] });
    } catch {
      toast.error(t('client.ratingFailed', 'Failed to submit rating'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {t('reviews.rateExperience', 'Rate your experience')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('jobTicket.reviewHelps', 'Your review helps other clients and builds trust on the platform.')}
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
        <Textarea
          placeholder={t('jobTicket.reviewPlaceholder', 'How was your experience? (optional)')}
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          className="resize-none"
        />

        <Button
          size="sm"
          className="gap-1.5"
          onClick={handleSubmit}
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
  );
}
