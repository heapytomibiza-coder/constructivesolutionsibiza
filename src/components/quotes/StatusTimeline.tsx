/**
 * StatusTimeline — Visual job lifecycle indicator.
 * Shows the current stage in the job state machine.
 */

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

const STAGES = ['ready', 'open', 'in_progress', 'completed'] as const;

interface StatusTimelineProps {
  currentStatus: string;
}

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const { t } = useTranslation('dashboard');

  const stageLabels: Record<string, string> = {
    ready: t('jobTicket.notSharedYet', 'Saved'),
    open: t('jobTicket.liveOnBoard', 'Live'),
    in_progress: t('jobTicket.inProgress', 'In Progress'),
    completed: t('jobTicket.completed', 'Completed'),
  };

  // cancelled is a terminal state outside the normal flow
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <Circle className="h-4 w-4" />
        <span className="font-medium">{t('jobTicket.closed', 'Closed')}</span>
      </div>
    );
  }

  const currentIndex = STAGES.indexOf(currentStatus as typeof STAGES[number]);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, i) => {
        const isPast = i < activeIndex;
        const isCurrent = i === activeIndex;

        return (
          <div key={stage} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={cn(
                  'h-0.5 w-4 sm:w-6 rounded-full transition-colors',
                  isPast || isCurrent ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
            <div className="flex items-center gap-1">
              {isPast ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Circle
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isCurrent ? 'text-primary fill-primary/20' : 'text-muted-foreground/40'
                  )}
                />
              )}
              <span
                className={cn(
                  'text-xs hidden sm:inline',
                  isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {stageLabels[stage] || stage}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
