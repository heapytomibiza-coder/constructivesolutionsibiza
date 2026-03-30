/**
 * Quote Comparison Page — Side-by-side (desktop) / swipeable cards (mobile)
 * for comparing received quotes on a job.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuoteComparisonCard } from '@/components/quotes/QuoteComparisonCard';
import { useQuotesForJob } from '@/pages/jobs/queries/quotes.query';
import { acceptQuote } from '@/pages/jobs/actions/acceptQuote.action';
import { quoteKeys } from '@/pages/jobs/queries/quotes.query';
import { jobKeys } from '@/pages/jobs/queries/keys';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { trackEvent } from '@/lib/trackEvent';
import { EVENTS } from '@/lib/eventTaxonomy';

export default function QuoteComparison() {
  const { t } = useTranslation('dashboard');
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [acting, setActing] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);

  // Track comparison page view
  useEffect(() => {
    if (jobId) {
      trackEvent(EVENTS.QUOTE_COMPARISON_VIEWED, 'client', {}, { job_id: jobId });
    }
  }, [jobId]);

  const { data: job } = useQuery({
    queryKey: ['job_ticket', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, status')
        .eq('id', jobId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  const { data: quotes = [], isLoading } = useQuotesForJob(jobId ?? null);
  const activeQuotes = quotes.filter(q => q.status !== 'withdrawn');

  const handleAccept = async (quoteId: string) => {
    const quote = activeQuotes.find(q => q.id === quoteId);
    if (!quote) return;

    setActing(true);
    const result = await acceptQuote(quote.id, quote.job_id, quote.professional_id);
    setActing(false);

    if (result.success) {
      trackEvent(EVENTS.QUOTE_ACCEPTED, 'client', { quote_count: activeQuotes.length }, { job_id: quote.job_id, worker_id: quote.professional_id });
      toast.success(t('quoteComparison.quoteAccepted', 'Quote accepted — professional has been notified!'));
      queryClient.invalidateQueries({ queryKey: quoteKeys.forJob(quote.job_id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.details(quote.job_id) });
      queryClient.invalidateQueries({ queryKey: ['job_ticket', jobId] });
      navigate(`/dashboard/jobs/${jobId}`);
    } else {
      toast.error(result.error ?? t('quoteComparison.acceptFailed', 'Failed to accept quote'));
    }
  };

  const handleMessage = async (professionalId: string) => {
    // Find or navigate to existing conversation
    if (!jobId) return;
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('job_id', jobId)
      .eq('pro_id', professionalId)
      .maybeSingle();

    if (conv) {
      navigate(`/messages/${conv.id}`);
    } else {
      navigate(`/messages`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky nav */}
      <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/jobs/${jobId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <span className="font-display font-semibold text-foreground truncate block">
              {t('quoteComparison.title', 'Compare Quotes')}
            </span>
            {job?.title && (
              <span className="text-xs text-muted-foreground truncate block">{job.title}</span>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {t('quoteComparison.count', '{{count}} quotes', { count: activeQuotes.length })}
          </Badge>
        </div>
      </nav>

      <div className="container max-w-5xl py-6">
        {activeQuotes.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-muted-foreground">
              {t('jobTicket.noQuotesYet', 'No quotes yet')}
            </p>
            <Button variant="outline" onClick={() => navigate(`/dashboard/jobs/${jobId}`)}>
              {t('quoteComparison.backToJob', 'Back to Job')}
            </Button>
          </div>
        ) : activeQuotes.length === 1 ? (
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">
                {t('quoteComparison.onlyOneQuote', "You've received 1 quote so far. More may be on the way.")}
              </p>
            </div>
            <QuoteComparisonCard
              quote={activeQuotes[0]}
              onAccept={handleAccept}
              onMessage={handleMessage}
              isActing={acting}
            />
          </div>
        ) : (
          <>
            {/* Desktop: grid layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeQuotes.map(quote => (
                <QuoteComparisonCard
                  key={quote.id}
                  quote={quote}
                  onAccept={handleAccept}
                  onMessage={handleMessage}
                  isActing={acting}
                />
              ))}
            </div>

            {/* Mobile: swipeable single-card view */}
            <div className="md:hidden space-y-4">
              <div className="flex items-center justify-between px-1">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={mobileIndex === 0}
                  onClick={() => setMobileIndex(i => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {mobileIndex + 1} / {activeQuotes.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={mobileIndex === activeQuotes.length - 1}
                  onClick={() => setMobileIndex(i => Math.min(activeQuotes.length - 1, i + 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <QuoteComparisonCard
                quote={activeQuotes[mobileIndex]}
                onAccept={handleAccept}
                onMessage={handleMessage}
                isActing={acting}
              />
              {/* Dot indicators */}
              <div className="flex justify-center gap-1.5">
                {activeQuotes.map((_, i) => (
                  <button
                    key={i}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      i === mobileIndex ? 'bg-primary' : 'bg-border'
                    }`}
                    onClick={() => setMobileIndex(i)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
