/**
 * StageHero — Prominent banner showing current stage, explanation, and next action.
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, MessageSquare, Star, Send, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageHeroProps {
  jobStatus: string;
  isClient: boolean;
  hasReview: boolean;
  onMarkComplete?: () => void;
  onScrollToUpdates?: () => void;
  onScrollToReview?: () => void;
}

interface StageConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    icon: React.ReactNode;
  };
}

export function StageHero({ jobStatus, isClient, hasReview, onMarkComplete, onScrollToUpdates, onScrollToReview }: StageHeroProps) {
  const { t } = useTranslation('dashboard');

  const config = getStageConfig(jobStatus, isClient, hasReview, t, {
    onMarkComplete,
    onScrollToUpdates,
    onScrollToReview,
  });

  if (!config) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">
              {config.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {config.description}
            </p>
            {config.action && (
              <Button
                onClick={config.action.onClick}
                className="mt-4 gap-2"
                size="sm"
              >
                {config.action.icon}
                {config.action.label}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getStageConfig(
  status: string,
  isClient: boolean,
  hasReview: boolean,
  t: ReturnType<typeof import('react-i18next').useTranslation>['t'],
  actions: {
    onMarkComplete?: () => void;
    onScrollToUpdates?: () => void;
    onScrollToReview?: () => void;
  },
): StageConfig | null {
  switch (status) {
    case 'ready':
      return {
        title: t('stageHero.readyTitle', 'Job Saved'),
        description: isClient
          ? t('stageHero.readyDescClient', 'Your job is saved as a draft. Share it on the board or invite professionals to get quotes.')
          : t('stageHero.readyDescPro', 'This job is being prepared by the client.'),
        icon: <Clock className="h-6 w-6 text-primary" />,
      };

    case 'open':
      return {
        title: t('stageHero.openTitle', 'Waiting for Quotes'),
        description: isClient
          ? t('stageHero.openDescClient', 'Your job is live on the board. Professionals can see it and send you quotes.')
          : t('stageHero.openDescPro', 'This job is open. Send a quote to express your interest.'),
        icon: <Send className="h-6 w-6 text-primary" />,
      };

    case 'in_progress':
      if (isClient) {
        return {
          title: t('stageHero.inProgressTitle', 'Work in Progress'),
          description: t('stageHero.inProgressDescClient', 'The quote has been accepted and work is underway. Mark the job complete once you\'re satisfied.'),
          icon: <Sparkles className="h-6 w-6 text-primary" />,
          action: {
            label: t('stageHero.markComplete', 'Mark Complete'),
            onClick: actions.onMarkComplete,
            icon: <CheckCircle2 className="h-4 w-4" />,
          },
        };
      }
      return {
        title: t('stageHero.inProgressTitle', 'Work in Progress'),
        description: t('stageHero.inProgressDescPro', 'You\'re working on this job. Post progress updates to keep the client informed.'),
        icon: <Sparkles className="h-6 w-6 text-primary" />,
        action: {
          label: t('stageHero.addUpdate', 'Add Update'),
          onClick: actions.onScrollToUpdates,
          icon: <MessageSquare className="h-4 w-4" />,
        },
      };

    case 'completed':
      if (!hasReview) {
        return {
          title: t('stageHero.completedTitle', 'Job Complete'),
          description: t('stageHero.completedDescNoReview', 'The job is finished. Leave a review to share your experience.'),
          icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
          action: {
            label: t('stageHero.leaveReview', 'Leave a Review'),
            onClick: actions.onScrollToReview,
            icon: <Star className="h-4 w-4" />,
          },
        };
      }
      return {
        title: t('stageHero.completedTitle', 'Job Complete'),
        description: t('stageHero.completedDescWithReview', 'This job is finished and reviewed. Thank you!'),
        icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
      };

    case 'cancelled':
      return {
        title: t('stageHero.cancelledTitle', 'Job Closed'),
        description: t('stageHero.cancelledDesc', 'This job has been closed and is no longer active.'),
        icon: <Clock className="h-6 w-6 text-muted-foreground" />,
      };

    default:
      return null;
  }
}
