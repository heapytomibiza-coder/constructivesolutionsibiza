/**
 * JobTicketCompletion — Completion flow with request/confirm pattern.
 * Professional: "Request Completion" → sets completion_requested_at
 * Client: "Confirm Completion" → calls complete_job RPC
 * Shown when job status is 'in_progress'.
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

interface JobTicketCompletionProps {
  jobId: string;
  jobStatus: string;
  isClient: boolean;
  completionRequested: boolean;
}

const RPC_ERROR_MAP: Record<string, string> = {
  job_not_found: 'Job not found',
  not_authorized: 'Not authorized',
  job_not_in_progress: 'Job must be in progress to complete',
  no_professional_assigned: 'Assign a professional before completing',
  already_requested: 'Completion already requested',
};

export function JobTicketCompletion({ jobId, jobStatus, isClient, completionRequested }: JobTicketCompletionProps) {
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (jobStatus !== 'in_progress') return null;

  // Client: always show (confirm if requested, or mark complete directly)
  // Professional: show "Request Completion" button if not yet requested
  if (!isClient && completionRequested) {
    // Pro already requested — show waiting state
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">
                {t('jobTicket.completionRequestSent', 'Completion requested')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('jobTicket.completionRequestSentDesc', 'Waiting for the client to review and confirm the work is complete.')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
    } catch {
      toast.error(t('client.completeFailed', 'Failed to complete job'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient) {
    // Professional: show request button
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">
                {t('jobTicket.workFinished', 'Work finished?')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('jobTicket.requestCompleteDesc', 'Let the client know the work is done so they can confirm and close the job.')}
              </p>
              <Button
                size="sm"
                className="gap-1.5 mt-1"
                onClick={handleRequestCompletion}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {t('jobTicket.requestComplete', 'Request Completion')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Client view
  const isConfirmation = completionRequested;

  return (
    <Card className={isConfirmation ? 'border-amber-500/30 bg-amber-500/5' : 'border-primary/30 bg-primary/5'}>
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
  );
}
