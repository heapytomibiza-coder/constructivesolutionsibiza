/**
 * StageHero — Premium hero panel showing current stage, meaning, next step, and primary action.
 * Uses a single resolveStage() function and STAGE_MAP config for all 6 job states.
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Star,
  Send,
  Clock,
  Sparkles,
  Eye,
  UserCheck,
  MessageSquare,
  XCircle,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

type JobStage =
  | 'open_no_quotes'
  | 'open_with_quotes'
  | 'assigned'
  | 'in_progress'
  | 'completed_no_review'
  | 'completed_reviewed';

interface StageConfig {
  title: string;
  meaning: string;
  nextStep: string;
  pillLabel: string;
  pillClass: string;
  icon: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    icon: React.ReactNode;
    variant?: 'default' | 'outline' | 'destructive';
  };
}

interface StageHeroProps {
  jobStatus: string;
  isClient: boolean;
  hasReview: boolean;
  quotesCount: number;
  hasAcceptedQuote: boolean;
  completionRequested: boolean;
  cancellationRequested: boolean;
  onMarkComplete?: () => void;
  onRequestCompletion?: () => void;
  onWithdraw?: () => void;
  onScrollToUpdates?: () => void;
  onScrollToReview?: () => void;
  onScrollToQuotes?: () => void;
}

/* ─── Stage resolver ─── */

function resolveStage(
  status: string,
  quotesCount: number,
  hasAcceptedQuote: boolean,
  hasReview: boolean,
): JobStage {
  if (hasReview) return 'completed_reviewed';
  if (status === 'completed') return 'completed_no_review';
  if (status === 'in_progress') return 'in_progress';
  if (hasAcceptedQuote) return 'assigned';
  if (quotesCount > 0) return 'open_with_quotes';
  return 'open_no_quotes';
}

/* ─── Stage map builder ─── */

function buildStageConfig(
  stage: JobStage,
  isClient: boolean,
  t: ReturnType<typeof import('react-i18next').useTranslation>['t'],
  completionRequested: boolean,
  cancellationRequested: boolean,
  actions: {
    onMarkComplete?: () => void;
    onRequestCompletion?: () => void;
    onWithdraw?: () => void;
    onScrollToUpdates?: () => void;
    onScrollToReview?: () => void;
    onScrollToQuotes?: () => void;
  },
): StageConfig {
  switch (stage) {
    case 'open_no_quotes':
      return {
        title: t('stageHero.openNoQuotesTitle', 'Waiting for quotes'),
        meaning: isClient
          ? t('stageHero.openNoQuotesMeaningClient', 'Your job is live. Professionals can now review and respond.')
          : t('stageHero.openNoQuotesMeaningPro', 'This job is open. Send a quote to express your interest.'),
        nextStep: isClient
          ? t('stageHero.openNoQuotesNextClient', 'Review quotes when they arrive.')
          : t('stageHero.openNoQuotesNextPro', 'Send a competitive quote to get started.'),
        pillLabel: t('stageHero.pillWaiting', 'Waiting for quotes'),
        pillClass: 'bg-accent/15 text-accent-foreground border-accent/20',
        icon: <Clock className="h-6 w-6 text-accent-foreground" />,
      };

    case 'open_with_quotes':
      return {
        title: t('stageHero.quotesReceivedTitle', 'Quotes received'),
        meaning: isClient
          ? t('stageHero.quotesReceivedMeaningClient', 'Professionals have responded to your job.')
          : t('stageHero.quotesReceivedMeaningPro', 'Your quote has been submitted. Waiting for the client to review.'),
        nextStep: isClient
          ? t('stageHero.quotesReceivedNextClient', 'Review quotes and choose the best fit.')
          : t('stageHero.quotesReceivedNextPro', 'The client is reviewing all quotes.'),
        pillLabel: t('stageHero.pillQuotes', 'Quotes received'),
        pillClass: 'bg-primary/10 text-primary border-primary/20',
        icon: <Send className="h-6 w-6 text-primary" />,
        primaryAction: isClient
          ? {
              label: t('stageHero.reviewQuotes', 'Review Quotes'),
              onClick: actions.onScrollToQuotes,
              icon: <Eye className="h-4 w-4" />,
            }
          : undefined,
      };

    case 'assigned':
      return {
        title: t('stageHero.assignedTitle', 'Professional selected'),
        meaning: isClient
          ? t('stageHero.assignedMeaningClient', "You've chosen a professional for this job.")
          : t('stageHero.assignedMeaningPro', 'Your quote has been accepted. Get ready to start.'),
        nextStep: isClient
          ? t('stageHero.assignedNextClient', 'Work will begin soon.')
          : t('stageHero.assignedNextPro', 'Begin work and keep the client updated.'),
        pillLabel: t('stageHero.pillAssigned', 'Professional selected'),
        pillClass: 'bg-primary/10 text-primary border-primary/20',
        icon: <UserCheck className="h-6 w-6 text-primary" />,
        primaryAction: !isClient
          ? {
              label: t('stageHero.withdraw', 'Withdraw'),
              onClick: actions.onWithdraw,
              icon: <LogOut className="h-4 w-4" />,
              variant: 'outline' as const,
            }
          : undefined,
      };

    case 'in_progress':
      // Cancellation takes priority over completion in hero display
      if (cancellationRequested) {
        return {
          title: isClient
            ? t('stageHero.cancellationRequestedTitle', 'Cancellation requested')
            : t('stageHero.cancellationRequestedTitlePro', 'Cancellation requested'),
          meaning: isClient
            ? t('stageHero.cancellationRequestedMeaningClient', 'The professional has asked to cancel this job. Review the request below.')
            : t('stageHero.cancellationRequestedMeaningPro', 'You have requested to cancel. Waiting for the client to respond.'),
          nextStep: isClient
            ? t('stageHero.cancellationRequestedNextClient', 'Accept or decline the cancellation request.')
            : t('stageHero.cancellationRequestedNextPro', 'The client will review your request.'),
          pillLabel: t('stageHero.pillCancellationRequested', 'Cancellation requested'),
          pillClass: 'bg-destructive/10 text-destructive border-destructive/20',
          icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
        };
      }

      if (isClient) {
        return {
          title: completionRequested
            ? t('stageHero.completionRequestedTitle', 'Completion requested')
            : t('stageHero.inProgressTitle', 'Work in progress'),
          meaning: completionRequested
            ? t('stageHero.completionRequestedMeaningClient', 'The professional has indicated the work is finished and is asking you to confirm.')
            : t('stageHero.inProgressMeaningClient', 'The professional is currently carrying out the work.'),
          nextStep: completionRequested
            ? t('stageHero.completionRequestedNextClient', 'Review the work and confirm completion.')
            : t('stageHero.inProgressNextClient', 'You can track progress updates below.'),
          pillLabel: completionRequested
            ? t('stageHero.pillCompletionRequested', 'Completion requested')
            : t('stageHero.pillInProgress', 'Work in progress'),
          pillClass: completionRequested
            ? 'bg-amber-500/15 text-amber-700 border-amber-500/20'
            : 'bg-primary/10 text-primary border-primary/20',
          icon: completionRequested
            ? <CheckCircle2 className="h-6 w-6 text-amber-600" />
            : <Sparkles className="h-6 w-6 text-primary" />,
          primaryAction: {
            label: completionRequested
              ? t('stageHero.confirmComplete', 'Confirm Completion')
              : t('stageHero.markComplete', 'Mark Complete'),
            onClick: actions.onMarkComplete,
            icon: <CheckCircle2 className="h-4 w-4" />,
          },
        };
      }
      return {
        title: completionRequested
          ? t('stageHero.completionRequestedTitlePro', 'Completion requested')
          : t('stageHero.inProgressTitle', 'Work in progress'),
        meaning: completionRequested
          ? t('stageHero.completionRequestedMeaningPro', 'You have requested completion. Waiting for the client to confirm.')
          : t('stageHero.inProgressMeaningPro', 'You are currently working on this job.'),
        nextStep: completionRequested
          ? t('stageHero.completionRequestedNextPro', 'The client will review and confirm.')
          : t('stageHero.inProgressNextPro', 'Keep the client updated with progress.'),
        pillLabel: completionRequested
          ? t('stageHero.pillCompletionRequested', 'Completion requested')
          : t('stageHero.pillInProgress', 'Work in progress'),
        pillClass: completionRequested
          ? 'bg-amber-500/15 text-amber-700 border-amber-500/20'
          : 'bg-primary/10 text-primary border-primary/20',
        icon: completionRequested
          ? <CheckCircle2 className="h-6 w-6 text-amber-600" />
          : <Sparkles className="h-6 w-6 text-primary" />,
        primaryAction: completionRequested
          ? undefined
          : {
              label: t('stageHero.updateProgress', 'Update Progress'),
              onClick: actions.onScrollToUpdates,
              icon: <Sparkles className="h-4 w-4" />,
            },
      };

    case 'completed_no_review':
      if (isClient) {
        return {
          title: t('stageHero.completedTitle', 'Job completed'),
          meaning: t('stageHero.completedMeaningClient', 'The work has been marked as complete.'),
          nextStep: t('stageHero.completedNextClient', 'Leave a review based on your experience.'),
          pillLabel: t('stageHero.pillCompleted', 'Job completed'),
          pillClass: 'bg-primary/10 text-primary border-primary/20',
          icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
          primaryAction: {
            label: t('stageHero.leaveReview', 'Leave a Review'),
            onClick: actions.onScrollToReview,
            icon: <Star className="h-4 w-4" />,
          },
        };
      }
      return {
        title: t('stageHero.completedTitle', 'Job completed'),
        meaning: t('stageHero.completedMeaningPro', 'This job has been marked as finished.'),
        nextStep: t('stageHero.completedNextPro', 'Waiting for client review.'),
        pillLabel: t('stageHero.pillCompleted', 'Job completed'),
        pillClass: 'bg-primary/10 text-primary border-primary/20',
        icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
      };

    case 'completed_reviewed':
      return {
        title: t('stageHero.reviewedTitle', 'Job complete'),
        meaning: t('stageHero.reviewedMeaning', 'This job has been successfully completed and reviewed.'),
        nextStep: t('stageHero.reviewedNext', 'No further action needed.'),
        pillLabel: t('stageHero.pillReviewed', 'Reviewed'),
        pillClass: 'bg-muted text-muted-foreground border-border',
        icon: <CheckCircle2 className="h-6 w-6 text-muted-foreground" />,
        primaryAction: {
          label: t('stageHero.viewReview', 'View Review'),
          onClick: actions.onScrollToReview,
          icon: <Star className="h-4 w-4" />,
        },
      };
  }
}

/* ─── Component ─── */

export function StageHero({
  jobStatus,
  isClient,
  hasReview,
  quotesCount,
  hasAcceptedQuote,
  completionRequested,
  cancellationRequested,
  onMarkComplete,
  onRequestCompletion,
  onWithdraw,
  onScrollToUpdates,
  onScrollToReview,
  onScrollToQuotes,
}: StageHeroProps) {
  const { t } = useTranslation('dashboard');

  const stage = resolveStage(jobStatus, quotesCount, hasAcceptedQuote, hasReview);
  const config = buildStageConfig(stage, isClient, t, completionRequested, cancellationRequested, {
    onMarkComplete,
    onRequestCompletion,
    onWithdraw,
    onScrollToUpdates,
    onScrollToReview,
    onScrollToQuotes,
  });

  return (
    <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-primary/[0.04] to-background p-5 sm:p-7 shadow-sm">
      {/* Top row: pill */}
      <div className="flex items-center justify-between mb-5">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-semibold border',
            config.pillClass,
          )}
        >
          {config.icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{config.icon}</span>}
          {config.pillLabel}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-[26px] sm:text-[32px] leading-[1.15] font-bold font-display text-foreground">
        {config.title}
      </h1>

      {/* Meaning */}
      <p className="text-[15px] sm:text-base leading-relaxed text-foreground/80 mt-2.5 max-w-[65ch]">
        {config.meaning}
      </p>

      {/* Next step inset panel */}
      <div className="mt-5 rounded-2xl bg-muted/50 border border-border/50 px-4 py-3.5">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          {t('stageHero.nextStepLabel', 'Next step')}
        </p>
        <p className="text-[14px] sm:text-[15px] font-medium text-foreground">
          {config.nextStep}
        </p>
      </div>

      {/* Primary action */}
      {config.primaryAction && (
        <div className="mt-5">
          <Button
            variant={config.primaryAction.variant || 'default'}
            onClick={config.primaryAction.onClick}
            className="h-12 px-5 rounded-xl text-[15px] font-semibold gap-2 w-full sm:w-auto"
          >
            {config.primaryAction.icon}
            {config.primaryAction.label}
          </Button>
        </div>
      )}
    </div>
  );
}
