/**
 * AcceptConfirmationModal — Full-detail confirmation before hiring.
 * Shows scope, line items, exclusions, timing, and totals.
 * Calls the existing acceptQuote() action — no new acceptance path.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { ProSummaryCard } from '@/components/quotes/ProSummaryCard';
import type { Quote } from '@/pages/jobs/types';

interface AcceptConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  onConfirm: () => Promise<void>;
}

export function AcceptConfirmationModal({
  open,
  onOpenChange,
  quote,
  onConfirm,
}: AcceptConfirmationModalProps) {
  const { t } = useTranslation('jobs');
  const [confirming, setConfirming] = useState(false);

  const originalItems = (quote.line_items ?? [])
    .filter((item: any) => !item.is_addition)
    .sort((a, b) => a.sort_order - b.sort_order);

  const vatAmount =
    quote.subtotal != null && (quote.vat_percent ?? 0) > 0
      ? (quote.subtotal * (quote.vat_percent ?? 0)) / 100
      : 0;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-display">
            {t('quotes.acceptConfirmTitle', 'Accept & Hire')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'quotes.acceptConfirmDesc',
              'Review the scope, pricing, and timing before hiring this professional.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Professional */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              {t('quotes.professional', 'Professional')}
            </p>
            <ProSummaryCard professionalId={quote.professional_id} compact />
          </div>

          {/* Scope */}
          {quote.scope_text && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t('quotes.scope', 'Scope of Work')}
              </p>
              <p className="text-sm whitespace-pre-line">{quote.scope_text}</p>
            </div>
          )}

          {/* Line Items */}
          {originalItems.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('proposal.items', 'Items')}
              </p>
              <div className="divide-y divide-border/40 rounded-md border border-border/50 bg-muted/20">
                {originalItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{item.description}</span>
                      {item.quantity > 1 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ×{item.quantity}
                        </span>
                      )}
                    </div>
                    <span className="ml-2 font-medium shrink-0">
                      €{item.line_total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exclusions */}
          {quote.exclusions_text && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t('quotes.exclusions', 'Exclusions')}
              </p>
              <p className="text-sm whitespace-pre-line text-muted-foreground">
                {quote.exclusions_text}
              </p>
            </div>
          )}

          {/* Timing */}
          {(quote.start_date_estimate || quote.time_estimate_days) && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t('quotes.timing', 'Timing')}
              </p>
              <div className="text-sm space-y-0.5">
                {quote.start_date_estimate && (
                  <p>
                    {t('quotes.startEstimate', 'Start')}: {quote.start_date_estimate}
                  </p>
                )}
                {quote.time_estimate_days && (
                  <p>
                    {t('quotes.duration', 'Duration')}:{' '}
                    {t('quotes.estimatedDays', '{{count}} days', {
                      count: quote.time_estimate_days,
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t('proposal.notes', 'Notes')}
              </p>
              <p className="text-sm whitespace-pre-line text-muted-foreground italic">
                {quote.notes}
              </p>
            </div>
          )}

          {/* Totals */}
          {quote.subtotal != null && (
            <div className="border-t border-border pt-3 space-y-1 text-right">
              <div className="text-sm text-muted-foreground">
                {t('proposal.subtotal', 'Subtotal')}: €{quote.subtotal.toFixed(2)}
              </div>
              {vatAmount > 0 && (
                <div className="text-sm text-muted-foreground">
                  IVA ({quote.vat_percent}%): €{vatAmount.toFixed(2)}
                </div>
              )}
              <div className="text-base font-bold">
                {t('proposal.total', 'Total')}: €
                {(quote.total ?? quote.subtotal).toFixed(2)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirming}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={confirming} className="gap-1.5">
            {confirming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {t('quotes.acceptAndHire', 'Accept & Hire')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
