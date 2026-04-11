/**
 * QuoteComparisonCard — Mobile-first card for comparing one professional's quote.
 * Used in the Quote Comparison View (swipeable on mobile).
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProSummaryCard } from './ProSummaryCard';
import { Check, MessageSquare, X, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatQuotePrice } from '@/pages/jobs/utils/formatQuotePrice';
import type { Quote } from '@/pages/jobs/types';

interface QuoteComparisonCardProps {
  quote: Quote;
  onAccept?: (quoteId: string) => void;
  onMessage: (professionalId: string) => void;
  onDecline?: (quoteId: string) => void;
  isActing?: boolean;
}

export function QuoteComparisonCard({
  quote,
  onAccept,
  onMessage,
  onDecline,
  isActing = false,
}: QuoteComparisonCardProps) {
  const { t } = useTranslation('dashboard');

  const priceDisplay = formatQuotePrice(quote);

  const isActive = quote.status === 'submitted' || quote.status === 'revised';
  const isAccepted = quote.status === 'accepted';

  return (
    <Card className={`relative overflow-hidden ${isAccepted ? 'ring-2 ring-primary' : ''}`}>
      {isAccepted && (
        <div className="bg-primary/10 text-primary text-xs font-medium text-center py-1">
          {t('quoteComparison.accepted', 'Accepted')}
        </div>
      )}
      <CardContent className="p-4 space-y-4">
        {/* Pro info */}
        <ProSummaryCard professionalId={quote.professional_id} />

        {/* Price */}
        <div className="text-center py-3 border-y border-border">
          <div className="text-2xl font-bold text-foreground">{priceDisplay}</div>
          <div className="text-xs text-muted-foreground mt-1 capitalize">
            {t(`quoteComparison.priceType.${quote.price_type}`, quote.price_type)}
          </div>
        </div>

        {/* Line items summary */}
        {quote.line_items && quote.line_items.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">
              {t('quoteComparison.breakdown', 'Breakdown')}
            </div>
            <div className="divide-y divide-border/40 rounded-md border border-border/50 bg-muted/20">
              {quote.line_items
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(item => (
                  <div key={item.id} className="flex justify-between px-3 py-1.5 text-sm">
                    <span className="truncate flex-1">{item.description}</span>
                    <span className="ml-2 font-medium shrink-0">€{item.line_total.toFixed(2)}</span>
                  </div>
                ))}
            </div>
            {quote.total != null && (
              <div className="text-right text-sm font-bold pt-1">
                {t('quoteComparison.total', 'Total')}: €{quote.total.toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Scope text fallback */}
        {(!quote.line_items || quote.line_items.length === 0) && quote.scope_text && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">
              {t('quoteComparison.scope', 'Scope')}
            </div>
            <p className="text-sm whitespace-pre-line line-clamp-4">{quote.scope_text}</p>
          </div>
        )}

        {/* Timeline + estimate */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {quote.time_estimate_days && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t('quoteComparison.estimatedDays', '{{count}} days', { count: quote.time_estimate_days })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Actions */}
        {isActive && (onAccept || onDecline) && (
          <div className="flex gap-2 pt-2">
            {onAccept && (
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => onAccept(quote.id)}
                disabled={isActing}
              >
                <Check className="h-3.5 w-3.5" />
                {t('quoteComparison.accept', 'Accept')}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => onMessage(quote.professional_id)}
              disabled={isActing}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t('quoteComparison.message', 'Message')}
            </Button>
            {onDecline && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => onDecline(quote.id)}
                disabled={isActing}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
        {/* Message-only fallback for non-owners viewing active quotes */}
        {isActive && !onAccept && !onDecline && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={() => onMessage(quote.professional_id)}
              disabled={isActing}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t('quoteComparison.message', 'Message')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
