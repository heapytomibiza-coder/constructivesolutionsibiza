/**
 * Shared quote price formatter.
 * Used by JobTicketQuotes and QuoteComparisonCard.
 */
import type { Quote } from '@/pages/jobs/types';

export function formatQuotePrice(quote: Pick<Quote, 'price_type' | 'price_fixed' | 'price_min' | 'price_max' | 'hourly_rate'>): string {
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
