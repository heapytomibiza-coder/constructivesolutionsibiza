import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Loader2 } from 'lucide-react';
import { usePendingReviews } from '../hooks/usePendingReviews';
import { RatingModal } from '@/pages/jobs/components/RatingModal';
import { submitReview } from '@/pages/jobs/actions/submitReview.action';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const PendingReviewsCard = () => {
  const { t } = useTranslation('dashboard');
  const { data: pendingReviews = [], isLoading } = usePendingReviews();
  const [selectedReview, setSelectedReview] = useState<typeof pendingReviews[0] | null>(null);
  const queryClient = useQueryClient();

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!selectedReview) return;

    const result = await submitReview({
      jobId: selectedReview.jobId,
      revieweeId: selectedReview.otherPartyId,
      reviewerRole: selectedReview.reviewerRole,
      rating,
      comment,
    });

    if (result.success) {
      toast.success(t('client.ratingSuccess', 'Thanks for your rating!'));
      setSelectedReview(null);
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
      // Refresh review surfaces so new review appears immediately
      queryClient.invalidateQueries({ queryKey: ['pro_reviews'] });
      queryClient.invalidateQueries({ queryKey: ['pro_review_agg'] });
      queryClient.invalidateQueries({ queryKey: ['public_pro_reviews'] });
    } else {
      toast.error(result.error || t('client.ratingFailed', 'Failed to submit rating'));
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('client.pendingReviews', 'Pending Reviews')}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (pendingReviews.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-accent/50 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4 text-accent" />
            {t('client.pendingReviews', 'Pending Reviews')}
          </CardTitle>
          <CardDescription>
            {t('reviews.rateExperience', 'Rate your experience')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingReviews.slice(0, 3).map((review) => (
            <div 
              key={review.jobId}
              className="flex items-center justify-between p-3 rounded-md border border-border/70 bg-card"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{review.jobTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {review.reviewerRole === 'professional'
                    ? t('reviews.rateClientPrivate', 'Rate client (private)')
                    : t('reviews.rateProfessional', 'Rate professional')}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedReview(review)}
              >
                {t('reviews.rate', 'Rate')}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <RatingModal
        open={!!selectedReview}
        onOpenChange={(open) => !open && setSelectedReview(null)}
        reviewerRole={selectedReview?.reviewerRole || 'professional'}
        onSubmit={handleRatingSubmit}
        onSkip={() => setSelectedReview(null)}
      />
    </>
  );
};
