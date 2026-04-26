/**
 * JobTicketQuotes — Quotes received section for Job Ticket Detail.
 */

import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProSummaryCard } from '@/components/quotes/ProSummaryCard';
import { BarChart3, FileText, MessageSquare, Inbox, ArrowRight } from 'lucide-react';
import { useQuotesForJob } from '@/pages/jobs/queries/quotes.query';
import { useJobResponseCount } from '@/pages/jobs/responses/queries/useJobResponseCount';
import { supabase } from '@/integrations/supabase/client';
import { formatQuotePrice } from '@/pages/jobs/utils/formatQuotePrice';

interface JobTicketQuotesProps {
  jobId: string;
  jobStatus: string;
}

export function JobTicketQuotes({ jobId, jobStatus }: JobTicketQuotesProps) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { data: quotes = [], isLoading } = useQuotesForJob(jobId);
  const { data: responseCount = 0 } = useJobResponseCount(jobId);

  const handleMessage = async (professionalId: string) => {
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('job_id', jobId)
      .eq('pro_id', professionalId)
      .maybeSingle();

    if (conv) {
      navigate(`/messages/${conv.id}`);
    } else {
      navigate('/messages');
    }
  };

  // Only show active (non-withdrawn) quotes
  const activeQuotes = quotes.filter(q => q.status !== 'withdrawn');

  if (isLoading) return null;

  // Empty state when job is live but no quotes yet
  if (activeQuotes.length === 0) {
    if (['open', 'ready'].includes(jobStatus)) {
      return (
        <Card className="border-border/40 bg-muted/20 shadow-none">
          <CardContent className="p-5">
            <div className="text-center py-6 space-y-2">
              <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">
                {t('jobTicket.noQuotesYet', 'No quotes yet')}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {jobStatus === 'open'
                  ? t('jobTicket.waitingForQuotes', "Your job is live — professionals have been notified. You'll receive an email when quotes arrive.")
                  : t('jobTicket.shareToGetQuotes', 'Share your job to start receiving quotes from professionals.')}
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  const acceptedQuote = activeQuotes.find(q => q.status === 'accepted');

  return (
    <Card className="border-border/40 bg-muted/20 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4 text-primary/70" />
            {t('jobTicket.quotesReceived', 'Quotes Received')}
            <Badge variant="secondary" className="text-xs">
              {activeQuotes.length}
            </Badge>
          </CardTitle>
          {activeQuotes.length >= 2 && !acceptedQuote && (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link to={`/dashboard/jobs/${jobId}/compare`}>
                <BarChart3 className="h-3.5 w-3.5" />
                {t('jobTicket.compareQuotes', 'Compare')}
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeQuotes.map(quote => (
          <div
            key={quote.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              quote.status === 'accepted' ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <ProSummaryCard professionalId={quote.professional_id} compact />
              {quote.status === 'accepted' && (
                <Badge variant="default" className="text-[10px] shrink-0">
                  {t('jobTicket.hired', 'Hired')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-semibold">{formatQuotePrice(quote)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => handleMessage(quote.professional_id)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
