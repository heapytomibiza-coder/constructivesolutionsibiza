/**
 * QuoteNudgeBanner — prompts professionals to submit a structured quote
 * when they've been chatting but haven't quoted yet.
 */

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMyQuoteForJob } from "@/pages/jobs/queries/quotes.query";
import { useSession } from "@/contexts/SessionContext";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowRight } from "lucide-react";

interface QuoteNudgeBannerProps {
  jobId: string;
  jobStatus?: string;
  messageCount: number;
}

export function QuoteNudgeBanner({ jobId, jobStatus, messageCount }: QuoteNudgeBannerProps) {
  const { t } = useTranslation('messages');
  const navigate = useNavigate();
  const { user, activeRole } = useSession();

  const { data: myQuote, isLoading } = useMyQuoteForJob(
    jobId,
    user?.id ?? null,
    activeRole === 'professional' && jobStatus === 'open'
  );

  // Only show for professionals on open jobs with 2+ messages and no existing quote
  if (
    activeRole !== 'professional' ||
    jobStatus !== 'open' ||
    messageCount < 2 ||
    isLoading ||
    myQuote
  ) {
    return null;
  }

  const isUrgent = messageCount >= 5;

  return (
    <div className="mx-3 mb-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 flex items-center gap-3">
      <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        <DollarSign className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {isUrgent
            ? t('nudge.urgentTitle', "You've discussed the job — send your quote to move forward")
            : t('nudge.title', "Ready to send a quote?")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('nudge.subtitle', "The client can't hire you until you submit one.")}
        </p>
      </div>
      <Button
        size="sm"
        className="shrink-0 gap-1.5"
        onClick={() => navigate(`/jobs/${jobId}`)}
      >
        <DollarSign className="h-3.5 w-3.5" />
        {t('nudge.cta', 'Send Quote')}
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
