/**
 * Quote display helpers — shared presentation logic for agreement/quote views.
 *
 * Centralises item grouping, sorting, totals, and date fallback
 * so AcceptConfirmationModal, AgreementCard, and ProQuoteSummary
 * stay consistent without duplicated derivation logic.
 *
 * These are pure display helpers. Authoritative acceptance rules
 * remain in the accept_quote_and_assign RPC.
 */

import type { Quote, QuoteLineItem } from '@/pages/jobs/types';

/* ─── Extended line item type (includes runtime DB fields not on QuoteLineItem) ─── */

export type LineItemWithMeta = QuoteLineItem & {
  is_addition?: boolean;
  added_by?: string | null;
  client_acknowledged_at?: string | null;
  created_at?: string;
};

/* ─── Item grouping & sorting ─── */

export function groupLineItems(items: LineItemWithMeta[]) {
  const original = items
    .filter((item) => !item.is_addition)
    .sort((a, b) => a.sort_order - b.sort_order);

  const additions = items
    .filter((item) => !!item.is_addition)
    .sort((a, b) => a.sort_order - b.sort_order);

  return { original, additions };
}

/* ─── Totals ─── */

export interface QuoteTotals {
  subtotal: number;
  vatPercent: number;
  vatAmount: number;
  total: number;
}

/**
 * Calculate totals from a subset of line items + the quote's VAT %.
 * Used for original-only totals on AgreementCard and confirmation modal.
 */
export function calculateItemTotals(
  items: Pick<QuoteLineItem, 'line_total'>[],
  vatPercent: number,
): QuoteTotals {
  const subtotal = items.reduce((sum, item) => sum + (item.line_total ?? 0), 0);
  const vatAmount = vatPercent > 0 ? (subtotal * vatPercent) / 100 : 0;
  return {
    subtotal,
    vatPercent,
    vatAmount,
    total: subtotal + vatAmount,
  };
}

/**
 * Calculate totals using the quote's stored subtotal (from the DB).
 * Used when we want to show the quote's own subtotal/total rather than
 * re-deriving from items (e.g. pre-acceptance confirmation where
 * the quote's stored values are authoritative).
 */
export function calculateQuoteTotals(quote: Pick<Quote, 'subtotal' | 'vat_percent' | 'total'>): QuoteTotals {
  const subtotal = quote.subtotal ?? 0;
  const vatPercent = quote.vat_percent ?? 0;
  const vatAmount = vatPercent > 0 ? (subtotal * vatPercent) / 100 : 0;
  return {
    subtotal,
    vatPercent,
    vatAmount,
    total: quote.total ?? subtotal + vatAmount,
  };
}

/**
 * Calculate additions-only subtotal.
 */
export function calculateAdditionsSubtotal(additions: Pick<QuoteLineItem, 'line_total'>[]): number {
  return additions.reduce((sum, item) => sum + (item.line_total ?? 0), 0);
}

/* ─── Date fallback ─── */

/**
 * Accepted date with safe fallback for legacy quotes missing accepted_at.
 */
export function getAcceptedDate(quote: Pick<Quote, 'accepted_at' | 'updated_at'>): string {
  return quote.accepted_at ?? quote.updated_at;
}
