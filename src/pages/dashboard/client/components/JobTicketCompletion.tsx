/**
 * JobTicketCompletion — Completion flow with request/confirm pattern.
 * Professional: subtle inline prompt under progress updates.
 * Client: "Confirm Completion" card when completion is requested,
 *         or passive waiting hint otherwise.
 * Sets a sessionStorage flag on completion so JobTicketReview can auto-open the rating modal.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { requestCompletion } from '../actions/requestCompletion.action';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/trackEvent';
import { EVENTS } from '@/lib/eventTaxonomy';
import { completeJob } from '@/pages/jobs/actions/completeJob.action';

interface JobTicketCompletionProps {
  jobId: string;
  jobStatus: string;
  isClient: boolean;
  completionRequested: boolean;
  assignedProfessionalId?: string | null;
  clientId?: string;
  viewerId?: string;
  externalDisabled?: boolean;
}

/* Error map moved to requestCompletion.action.ts */

export function JobTicketCompletion({
  jobId,
  jobStatus,
  isClient,
  completionRequested,
  assignedProfessionalId,
  clientId,
  viewerId,
  externalDisabled,
}: JobTicketCompletionProps) {
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (jobStatus !== 'in_progress') return null;

  const handleRequestCompletion = async () => {
    setIsSubmitting(true);
    try {
      const result = await requestCompletion(jobId);
      if (!result.success) {
        toast.error(result.error);
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
    setIsSubmitting(true);
    try {
      const result = await completeJob(jobId, {
        caller: 'completion_card',
        userId: viewerId,
        jobOwnerId: clientId,
        assignedProId: assignedProfessionalId ?? undefined,
        jobStatus: jobStatus,
        completionRequestedAt: completionRequested ? 'yes' : null,
      });
      if (!result.success) {
        toast.error(result.error ?? t('client.completeFailed', 'Failed to complete job'));
        return;
      }
      toast.success(t('client.completedSuccess', 'Job marked as completed!'));

      // Set flag so JobTicketReview auto-opens the rating modal after status changes
      sessionStorage.setItem(`review_auto_open_${jobId}`, '1');

      queryClient.invalidateQueries({ queryKey: ['job_ticket', jobId] });
    } catch {
      toast.error(t('client.completeFailed', 'Failed to complete job'));
    } finally {
      setIsSubmitting(false);
    }
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {t('jobTicket.requestComplete', 'Request completion')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('jobTicket.requestCompleteTitle', 'Request completion?')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('jobTicket.requestCompleteConfirm', 'This will notify the client that the work is finished and ask them to confirm.')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleRequestCompletion}>
                  {t('jobTicket.requestComplete', 'Request completion')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  }

  /* ─── Client view ─── */

  // If completion not yet requested by the pro, show a waiting hint
  if (!completionRequested) {
    return (
      <Card className="border-border/40 bg-muted/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-muted/40">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">
                {t('jobTicket.workInProgress', 'Work in progress')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('jobTicket.waitingForProCompletion', "When the professional finishes, they'll request completion and you can confirm here.")}
              </p>
              <button
                type="button"
                className="text-xs text-primary hover:underline mt-1"
                onClick={() => document.getElementById('agreement-card')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t('jobTicket.viewAgreement', 'View original agreement')}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/10">
            <CheckCircle2 className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">
              {t('jobTicket.proRequestedCompletion', 'The professional says the work is complete')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('jobTicket.confirmCompleteDesc', 'Review the work and confirm if you are satisfied. You will be asked to leave a review next.')}
            </p>
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => document.getElementById('agreement-card')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('jobTicket.referToAgreement', 'Refer back to the original agreement if needed')}
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  className="gap-1.5 mt-1"
                  disabled={isSubmitting || externalDisabled}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {t('jobTicket.confirmComplete', 'Confirm Completion')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t('jobTicket.completeTitle', 'Mark job as completed?')}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('jobTicket.completeConfirm', 'This confirms the work is done. You will be asked to leave a review next.')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmCompletion}>
                    {t('jobTicket.confirmComplete', 'Confirm Completion')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
