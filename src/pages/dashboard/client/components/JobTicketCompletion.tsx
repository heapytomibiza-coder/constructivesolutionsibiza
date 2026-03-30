/**
 * JobTicketCompletion — Mark job as complete section.
 * Shown when job status is 'in_progress'.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface JobTicketCompletionProps {
  jobId: string;
  jobStatus: string;
}

export function JobTicketCompletion({ jobId, jobStatus }: JobTicketCompletionProps) {
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const [isCompleting, setIsCompleting] = useState(false);

  if (jobStatus !== 'in_progress') return null;

  const handleComplete = async () => {
    if (!confirm(t('jobTicket.completeConfirm', 'Mark this job as completed? This confirms the work is done.'))) return;

    setIsCompleting(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', jobId);
      if (error) throw error;
      toast.success(t('client.completedSuccess', 'Job marked as completed!'));
      queryClient.invalidateQueries({ queryKey: ['job_ticket', jobId] });
    } catch {
      toast.error(t('client.completeFailed', 'Failed to complete job'));
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">
              {t('jobTicket.readyToComplete', 'Is the work finished?')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('jobTicket.completeDesc', "Once you mark the job as complete, you'll be asked to leave a review.")}
            </p>
            <Button
              size="sm"
              className="gap-1.5 mt-1"
              onClick={handleComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {t('jobTicket.markComplete', 'Mark as Complete')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
