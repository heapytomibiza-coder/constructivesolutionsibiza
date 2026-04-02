/**
 * JobProgressRail — Premium vertical (desktop) / horizontal (mobile) progress indicator.
 * Shows done / current / upcoming steps for the job lifecycle.
 */

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface JobProgressRailProps {
  jobId: string;
  jobStatus: string;
  hasQuote: boolean;
  hasAcceptedQuote: boolean;
  hasReview: boolean;
  jobTitle?: string;
  proName?: string | null;
  lastUpdateAt?: string | null;
}

interface Step {
  key: string;
  label: string;
  state: 'done' | 'current' | 'upcoming';
  timestamp?: string;
}

const isFinalStep = (key: string) => key === 'review' || key === 'completed';

function resolveSteps(
  jobStatus: string,
  hasQuote: boolean,
  hasAcceptedQuote: boolean,
  hasReview: boolean,
  t: ReturnType<typeof import('react-i18next').useTranslation>['t'],
): Step[] {
  const statusOrder = ['posted', 'quoted', 'accepted', 'in_progress', 'completed', 'review'];

  let currentIndex: number;
  switch (jobStatus) {
    case 'ready':
    case 'open':
      currentIndex = 0;
      break;
    case 'in_progress':
      currentIndex = 3;
      break;
    case 'completed':
      currentIndex = hasReview ? 5 : 4;
      break;
    case 'cancelled':
      currentIndex = 0;
      break;
    default:
      currentIndex = 0;
  }

  if (hasAcceptedQuote && currentIndex < 3) currentIndex = 3;
  else if (hasQuote && currentIndex < 1) currentIndex = 1;

  const labels: Record<string, string> = {
    posted: t('progressRail.posted', 'Job Posted'),
    quoted: t('progressRail.quoted', 'Quote Sent'),
    accepted: t('progressRail.accepted', 'Quote Accepted'),
    in_progress: t('progressRail.working', 'Work in Progress'),
    completed: t('progressRail.completed', 'Completed'),
    review: t('progressRail.review', 'Reviewed'),
  };

  

  return statusOrder.map((key, i) => ({
    key,
    label: labels[key],
    state: i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming',
  }));
}

export function JobProgressRail({
  jobId,
  jobStatus,
  hasQuote,
  hasAcceptedQuote,
  hasReview,
  jobTitle,
  proName,
  lastUpdateAt,
}: JobProgressRailProps) {
  const { t } = useTranslation('dashboard');

  const { data: history = [] } = useQuery({
    queryKey: ['job_status_history_rail', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_status_history')
        .select('to_status, created_at')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!jobId,
  });

  const steps = resolveSteps(jobStatus, hasQuote, hasAcceptedQuote, hasReview, t);

  const timestampMap = new Map<string, string>();
  for (const h of history) {
    const mappedKey = h.to_status === 'open' ? 'posted' : h.to_status;
    if (!timestampMap.has(mappedKey)) {
      timestampMap.set(mappedKey, h.created_at);
    }
  }

  const currentStep = steps.find(s => s.state === 'current');
  const statusLabel = currentStep?.label || t('progressRail.posted', 'Job Posted');

  return (
    <>
      {/* Desktop: vertical rail card */}
      <div className="hidden lg:block">
        <div className="sticky top-20 rounded-[20px] border border-border/70 bg-card p-5 shadow-sm">
          {/* Header */}
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {t('progressRail.title', 'Job Progress')}
          </p>
          {jobTitle && (
            <p className="text-[16px] font-semibold text-foreground mt-1.5 line-clamp-2 leading-snug">
              {jobTitle}
            </p>
          )}

          {/* Steps */}
          <div className="mt-5 space-y-0">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <StepNode state={step.state} isFinal={isFinalStep(step.key)} />
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        'w-0.5 h-7',
                        step.state === 'done'
                          ? isFinalStep(step.key) ? 'bg-success/40' : 'bg-primary'
                          : 'bg-border',
                      )}
                    />
                  )}
                </div>
                <div className={cn('pb-5', i === steps.length - 1 && 'pb-0')}>
                  <p
                    className={cn(
                      'text-sm leading-tight',
                      step.state === 'current' && !isFinalStep(step.key) && 'text-primary font-semibold',
                      step.state === 'current' && isFinalStep(step.key) && 'text-success font-semibold',
                      step.state === 'done' && 'text-foreground font-medium',
                      step.state === 'upcoming' && 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </p>
                  {step.state === 'done' && timestampMap.get(step.key) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(timestampMap.get(step.key)!), 'dd MMM, HH:mm')}
                    </p>
                  )}
                  {step.state === 'current' && (
                    <span className={cn(
                      'inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                      isFinalStep(step.key)
                        ? 'text-success bg-success/10'
                        : 'text-primary bg-primary/10',
                    )}>
                      {t('progressRail.currentLabel', 'Current')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer summary */}
          <div className="mt-5 pt-4 border-t border-border space-y-1.5">
            {proName && (
              <p className="text-[12px] text-muted-foreground">
                <span className="font-medium text-foreground">{proName}</span>
              </p>
            )}
            {lastUpdateAt && (
              <p className="text-[11px] text-muted-foreground">
                {t('progressRail.lastUpdate', 'Last update')}: {formatDistanceToNow(new Date(lastUpdateAt), { addSuffix: true })}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              {t('progressRail.statusLabel', 'Status')}: {statusLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: horizontal strip card */}
      <div className="lg:hidden">
        <div className="rounded-[18px] border border-border/70 bg-card p-3.5 shadow-sm">
          {/* Summary row */}
          <p className="text-[13px] font-semibold text-foreground mb-2.5">
            {statusLabel}
            {lastUpdateAt && (
              <span className="text-muted-foreground font-normal">
                {' · '}{t('progressRail.updatedLabel', 'Updated')} {formatDistanceToNow(new Date(lastUpdateAt), { addSuffix: true })}
              </span>
            )}
          </p>

          {/* Steps row */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-1 shrink-0">
                <div
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium min-w-[88px] justify-center',
                    step.state === 'done' && !isFinalStep(step.key) && 'bg-primary/10 text-primary',
                    step.state === 'done' && isFinalStep(step.key) && 'bg-success/10 text-success',
                    step.state === 'current' && !isFinalStep(step.key) && 'bg-primary text-primary-foreground',
                    step.state === 'current' && isFinalStep(step.key) && 'bg-success text-success-foreground',
                    step.state === 'upcoming' && 'bg-muted text-muted-foreground',
                  )}
                >
                  {step.state === 'done' && <Check className="h-3 w-3" />}
                  {step.state === 'current' && <Circle className="h-2.5 w-2.5 fill-current" />}
                  {step.state === 'upcoming' && <Circle className="h-2.5 w-2.5" />}
                  <span className="whitespace-nowrap">{step.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-3 h-0.5 shrink-0',
                      step.state === 'done' ? (isFinalStep(step.key) ? 'bg-success/40' : 'bg-primary') : 'bg-border',
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Step node (desktop) ─── */

function StepNode({ state, isFinal }: { state: 'done' | 'current' | 'upcoming'; isFinal?: boolean }) {
  if (state === 'done') {
    return (
      <div className={cn(
        'h-7 w-7 rounded-full flex items-center justify-center shrink-0',
        isFinal ? 'bg-success/15 border-2 border-success/40' : 'bg-primary',
      )}>
        <Check className={cn('h-3.5 w-3.5', isFinal ? 'text-success' : 'text-primary-foreground')} />
      </div>
    );
  }
  if (state === 'current') {
    return (
      <div className={cn(
        'h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0',
        isFinal ? 'bg-success/10 border-success' : 'bg-primary/15 border-primary',
      )}>
        <div className={cn('h-3 w-3 rounded-full', isFinal ? 'bg-success' : 'bg-primary')} />
      </div>
    );
  }
  return (
    <div className="h-7 w-7 rounded-full border-2 border-border bg-background shrink-0" />
  );
}
