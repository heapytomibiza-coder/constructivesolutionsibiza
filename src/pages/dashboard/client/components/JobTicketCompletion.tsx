/**
 * JobTicketCompletion — Completion flow with request/confirm pattern.
 * Professional: subtle inline prompt under progress updates.
 * Client: "Confirm Completion" card when completion is requested,
 *         or "Mark as Complete" option otherwise.
 * Auto-triggers RatingModal for client after confirming completion.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/trackEvent';
import { EVENTS } from '@/lib/eventTaxonomy';
import { RatingModal } from '@/pages/jobs/components/RatingModal';
import { submitReview } from '@/pages/jobs/actions/submitReview.action';

interface JobTicketCompletionProps {
  jobId: string;
  jobStatus: string;
  isClient: boolean;
  completionRequested: boolean;
  assignedProfessionalId?: string | null;
  assignedProfessionalName?: string | null;
  clientId?: string;
}

const RPC_ERROR_MAP: Record<string, string> = {
  job_not_found: 'Job not found',
  not_authorized: 'Not authorized',
  job_not_in_progress: 'Job must be in progress to complete',
  no_professional_assigned: 'Assign a professional before completing',
  already_requested: 'Completion already requested',
};

export function JobTicketCompletion({
  jobId,
  jobStatus,
  isClient,
  completionRequested,
  assignedProfessionalId,
  assignedProfessionalName,
  clientId,
}: JobTicketCompletionProps) {
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  if (jobStatus !== 'in_progress') return null;

  const handleRequestCompletion = async () => {
    if (!confirm(t('jobTicket.requestCompleteConfirm', 'Request the client to confirm this job is complete?'))) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('request_job_completion', { p_job_id: jobId });
      if (error) {
        const friendlyMsg = RPC_ERROR_MAP[error.message] ?? error.message;
        toast.error(friendlyMsg);
        return;
      }
      trackEvent(EVENTS.JOB_COMPLETED, 'professional', { action: 'requested' }, { job_id: jobId });
      toast.success(t('jobTicket.completionRequested', 'Completion request sent!'));
      queryClient.invalidateQueries({ queryKey: ['job_ticket', jobId] });
    } catch {
      toast.error(t('jobTicket.requestFailed', 'Failed to request completion'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!confirm(t('jobTicket.completeConfirm', 'Mark this job as completed? This confirms the work is done.'))) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('complete_job', { p_job_id: jobId });
      if (error) {
        const friendlyMsg = RPC_ERROR_MAP[error.message] ?? error.message;
        toast.error(t('client.completeFailed', friendlyMsg));
        return;
      }
      trackEvent(EVENTS.JOB_COMPLETED, 'client', {}, { job_id: jobId });
      toast.success(t('client.completedSuccess', 'Job marked as completed!'));
      queryClient.invalidateQueries({ queryKey: ['job_ticket', jobId] });

      // Auto-trigger review modal after brief delay
      setTimeout(() => setShowReviewModal(true), 800);
    } catch {
      toast.error(t('client.completeFailed', 'Failed to complete job'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!assignedProfessionalId) return;
    const result = await submitReview({
      jobId,
      revieweeId: assignedProfessionalId,
      reviewerRole: 'client',
      rating,
      comment,
    });
    if (!result.success) {
      toast.error(result.error ?? 'Failed to submit review');
      throw new Error(result.error);
    }
    toast.success(t('client.ratingSuccess', 'Thanks for your rating!'));
    queryClient.invalidateQueries({ queryKey: ['user_review', jobId] });
    queryClient.invalidateQueries({ queryKey: ['job_review_exists', jobId] });
    setShowReviewModal(false);
  };

  const handleReviewSkip = () => {
    setShowReviewModal(false);
  };

  /* ─── Professional: subtle inline prompt ─── */
  if (!isClient) {
    if (completionRequested) {
      return (
        <div className="mt-4 px-4 py-3 rounded-xl border border-border/40 bg-muted/30">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              {t('jobTicket.completionRequestSent', 'Completion requested — waiting for client confirmation.')}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4 px-4 py-3 rounded-xl border border-border/40 bg-muted/30">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t('jobTicket.finishedWork', 'Finished the work?')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('jobTicket.letClientKnow', 'Let the client know it\'s ready for review.')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={handleRequestCompletion}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {t('jobTicket.requestComplete', 'Request completion')}
          </Button>
        </div>
      </div>
    );
  }

  /* ─── Client view ─── */
  const isConfirmation = completionRequested;

  return (
    <>
      <Card className={isConfirmation ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/40 bg-muted/20'}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isConfirmation ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
              <CheckCircle2 className={`h-5 w-5 ${isConfirmation ? 'text-amber-600' : 'text-primary'}`} />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">
                {isConfirmation
                  ? t('jobTicket.proRequestedCompletion', 'The professional says the work is complete')
                  : t('jobTicket.readyToComplete', 'Is the work finished?')}
              </p>
              <p className="text-xs text-muted-foreground">
                {isConfirmation
                  ? t('jobTicket.confirmCompleteDesc', 'Review the work and confirm if you are satisfied. You will be asked to leave a review next.')
                  : t('jobTicket.completeDesc', "Once you mark the job as complete, you'll be asked to leave a review.")}
              </p>
              <Button
                size="sm"
                className="gap-1.5 mt-1"
                onClick={handleConfirmCompletion}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {isConfirmation
                  ? t('jobTicket.confirmComplete', 'Confirm Completion')
                  : t('jobTicket.markComplete', 'Mark as Complete')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-triggered review modal after completion */}
      {assignedProfessionalId && (
        <RatingModal
          open={showReviewModal}
          onOpenChange={setShowReviewModal}
          revieweeName={assignedProfessionalName ?? undefined}
          reviewerRole="client"
          onSubmit={handleReviewSubmit}
          onSkip={handleReviewSkip}
        />
      )}
    </>
  );
}
