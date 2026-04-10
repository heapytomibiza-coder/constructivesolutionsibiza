/**
 * CancellationRequestCard — Shown to client when professional requests cancellation.
 * Professional sees a "waiting" state. Client can accept or decline.
 */

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface CancellationRequestCardProps {
  jobId: string;
  jobStatus: string;
  isClient: boolean;
  cancellationRequested: boolean;
  cancellationReason?: string | null;
}

export function CancellationRequestCard({
  jobId,
  jobStatus,
  isClient,
  cancellationRequested,
  cancellationReason,
}: CancellationRequestCardProps) {
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingResponse, setPendingResponse] = useState<boolean | null>(null);

  if (jobStatus !== 'in_progress' || !cancellationRequested) return null;

  const handleRespond = async (accept: boolean) => {
    setPendingResponse(null);

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('respond_to_cancellation', {
        p_job_id: jobId,
        p_accept: accept,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(
        accept
          ? t('jobTicket.cancellationAccepted', 'Cancellation accepted. Job reopened.')
          : t('jobTicket.cancellationDeclined', 'Cancellation declined. Work continues.'),
      );
      queryClient.invalidateQueries({ queryKey: ['job_ticket', jobId] });
    } catch {
      toast.error(t('jobTicket.cancellationResponseFailed', 'Failed to respond'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Professional sees waiting state
  if (!isClient) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">
                {t('jobTicket.cancellationPending', 'Cancellation requested')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('jobTicket.cancellationPendingDesc', 'Waiting for the client to review your cancellation request.')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Client sees accept/decline
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {t('jobTicket.proCancellationRequest', 'The professional wants to cancel')}
              </p>
              {cancellationReason && (
                <p className="text-xs text-muted-foreground italic">
                  "{cancellationReason}"
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('jobTicket.cancellationClientDesc', 'If you accept, the job will be reopened so you can find another professional. If you decline, work continues.')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5"
                onClick={() => handleRespond(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {t('jobTicket.acceptCancellation', 'Accept')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => handleRespond(false)}
                disabled={isSubmitting}
              >
                <X className="h-3.5 w-3.5" />
                {t('jobTicket.declineCancellation', 'Decline')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
