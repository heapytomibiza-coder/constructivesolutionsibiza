/**
 * JobProgressRail — Vertical (desktop) / horizontal (mobile) progress indicator.
 * Shows done / current / upcoming steps for the job lifecycle.
 */

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Check, Circle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface JobProgressRailProps {
  jobId: string;
  jobStatus: string;
  hasQuote: boolean;
  hasAcceptedQuote: boolean;
  hasReview: boolean;
}

interface Step {
  key: string;
  label: string;
  state: 'done' | 'current' | 'upcoming';
  timestamp?: string;
}

function resolveSteps(
  jobStatus: string,
  hasQuote: boolean,
  hasAcceptedQuote: boolean,
  hasReview: boolean,
  t: (key: string, fallback?: string) => string,
): Step[] {
  const statusOrder = ['posted', 'quoted', 'accepted', 'in_progress', 'completed', 'review'];

  // Map job status to a progress index
  let currentIndex: number;
  switch (jobStatus) {
    case 'ready':
    case 'open':
      currentIndex = 0; // posted
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

  // Override based on quote state
  if (hasAcceptedQuote && currentIndex < 3) currentIndex = 3;
  else if (hasQuote && currentIndex < 1) currentIndex = 1;

  const labels: Record<string, string> = {
    posted: t('progressRail.posted', 'Job Posted'),
    quoted: t('progressRail.quoted', 'Quote Sent'),
    accepted: t('progressRail.accepted', 'Quote Accepted'),
    in_progress: t('progressRail.working', 'Work in Progress'),
    completed: t('progressRail.completed', 'Completed'),
    review: t('progressRail.review', 'Review'),
  };

  return statusOrder.map((key, i) => ({
    key,
    label: labels[key],
    state: i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming',
  }));
}

export function JobProgressRail({ jobId, jobStatus, hasQuote, hasAcceptedQuote, hasReview }: JobProgressRailProps) {
  const { t } = useTranslation('dashboard');

  // Fetch timestamps from status history
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

  // Map timestamps to steps
  const timestampMap = new Map<string, string>();
  for (const h of history) {
    const mappedKey = h.to_status === 'open' ? 'posted' : h.to_status;
    if (!timestampMap.has(mappedKey)) {
      timestampMap.set(mappedKey, h.created_at);
    }
  }

  return (
    <>
      {/* Desktop: vertical rail */}
      <div className="hidden lg:block">
        <div className="sticky top-20 space-y-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {t('progressRail.title', 'Job Progress')}
          </p>
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-start gap-3">
              {/* Connector line + icon column */}
              <div className="flex flex-col items-center">
                <StepIcon state={step.state} />
                {i < steps.length - 1 && (
                  <div className={cn(
                    'w-0.5 h-8',
                    step.state === 'done' ? 'bg-primary' : 'bg-border'
                  )} />
                )}
              </div>
              {/* Label */}
              <div className={cn('pb-6', i === steps.length - 1 && 'pb-0')}>
                <p className={cn(
                  'text-sm font-medium leading-tight',
                  step.state === 'current' && 'text-primary font-semibold',
                  step.state === 'done' && 'text-foreground',
                  step.state === 'upcoming' && 'text-muted-foreground',
                )}>
                  {step.state === 'current' && '→ '}
                  {step.label}
                </p>
                {step.state === 'done' && timestampMap.get(step.key) && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(new Date(timestampMap.get(step.key)!), 'dd MMM, HH:mm')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: horizontal strip */}
      <div className="lg:hidden">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center gap-1 shrink-0">
              <div className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
                step.state === 'done' && 'bg-primary/10 text-primary',
                step.state === 'current' && 'bg-primary text-primary-foreground',
                step.state === 'upcoming' && 'bg-muted text-muted-foreground',
              )}>
                {step.state === 'done' && <Check className="h-3 w-3" />}
                {step.state === 'current' && <ArrowRight className="h-3 w-3" />}
                {step.state === 'upcoming' && <Circle className="h-2.5 w-2.5" />}
                <span className="whitespace-nowrap">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'w-3 h-0.5',
                  step.state === 'done' ? 'bg-primary' : 'bg-border'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function StepIcon({ state }: { state: 'done' | 'current' | 'upcoming' }) {
  if (state === 'done') {
    return (
      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
        <Check className="h-3.5 w-3.5 text-primary-foreground" />
      </div>
    );
  }
  if (state === 'current') {
    return (
      <div className="h-7 w-7 rounded-full bg-primary/15 border-2 border-primary flex items-center justify-center">
        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
      </div>
    );
  }
  return (
    <div className="h-6 w-6 rounded-full border-2 border-border bg-background" />
  );
}
