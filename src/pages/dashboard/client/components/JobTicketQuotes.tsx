/**
 * JobTicketQuotes — Quotes received section for Job Ticket Detail.
 */

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProSummaryCard } from '@/components/quotes/ProSummaryCard';
import { BarChart3, FileText, MessageSquare } from 'lucide-react';
import { useQuotesForJob } from '@/pages/jobs/queries/quotes.query';
import type { Quote } from '@/pages/jobs/types';

interface JobTicketQuotesProps {
  jobId: string;
  jobStatus: string;
}

function getQuotePrice(quote: Quote): string {
  switch (quote.price_type) {
    case 'fixed':
      return quote.price_fixed != null ? `€${quote.price_fixed.toLocaleString()}` : '—';
    case 'estimate':
      return quote.price_min != null && quote.price_max != null
        ? `€${quote.price_min.toLocaleString()} – €${quote.price_max.toLocaleString()}`
        : '—';
    case 'hourly':
      return quote.hourly_rate != null ? `€${quote.hourly_rate}/h` : '—';
    default:
      return '—';
  }
}

export function JobTicketQuotes({ jobId, jobStatus }: JobTicketQuotesProps) {
  const { t } = useTranslation('dashboard');
  const { data: quotes = [], isLoading } = useQuotesForJob(jobId);

  // Only show active (non-withdrawn) quotes
  const activeQuotes = quotes.filter(q => q.status !== 'withdrawn');

  if (isLoading) return null;

  // Empty state when job is live but no quotes yet
  if (activeQuotes.length === 0) {
    if (['open', 'ready'].includes(jobStatus)) {
      return (
        <Card>
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
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
              <span className="text-sm font-semibold">{getQuotePrice(quote)}</span>
              <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                <Link to={`/dashboard/jobs/${jobId}/compare`}>
                  <MessageSquare className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
