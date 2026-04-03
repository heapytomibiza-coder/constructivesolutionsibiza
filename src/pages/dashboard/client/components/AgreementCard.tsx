/**
 * AgreementCard — Post-acceptance agreement reference for the client job ticket.
 * Shows original agreed terms (scope, line items, exclusions, timing, totals).
 * Post-acceptance additions are displayed in a separated section below.
 * Includes print/download via window.print().
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProSummaryCard } from '@/components/quotes/ProSummaryCard';
import { FileText, Printer, Plus, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Quote } from '@/pages/jobs/types';

interface AgreementCardProps {
  quote: Quote;
}

export function AgreementCard({ quote }: AgreementCardProps) {
  const { t } = useTranslation('dashboard');

  const lineItems = quote.line_items ?? [];
  const originalItems = lineItems
    .filter((item: any) => !item.is_addition)
    .sort((a, b) => a.sort_order - b.sort_order);
  const addedItems = lineItems
    .filter((item: any) => item.is_addition)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Calculate original-only totals
  const originalSubtotal = originalItems.reduce(
    (sum, item) => sum + (item.line_total ?? 0),
    0
  );
  const vatPercent = quote.vat_percent ?? 0;
  const originalVat = vatPercent > 0 ? (originalSubtotal * vatPercent) / 100 : 0;
  const originalTotal = originalSubtotal + originalVat;

  const additionsSubtotal = addedItems.reduce(
    (sum, item: any) => sum + ((item.line_total as number) ?? 0),
    0
  );

  const acceptedDate = quote.accepted_at ?? quote.updated_at;

  return (
    <div id="agreement-card">
      <Card className="rounded-2xl border-border/60 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary/70" />
              {t('agreement.title', 'Project Agreement')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs print:hidden"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" />
              {t('agreement.print', 'Print')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('agreement.acceptedOn', 'Accepted')}{' '}
            {formatDistanceToNow(new Date(acceptedDate), { addSuffix: true })}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Professional */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              {t('agreement.professional', 'Professional')}
            </p>
            <ProSummaryCard professionalId={quote.professional_id} compact />
          </div>

          {/* Scope */}
          {quote.scope_text && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t('agreement.scope', 'Scope of Work')}
              </p>
              <p className="text-sm whitespace-pre-line">{quote.scope_text}</p>
            </div>
          )}

          {/* Original Line Items */}
          {originalItems.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                {t('agreement.items', 'Items')}
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
                {t('agreement.exclusions', 'Exclusions')}
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
                {t('agreement.timing', 'Timing')}
              </p>
              <div className="text-sm space-y-0.5">
                {quote.start_date_estimate && (
                  <p>
                    {t('agreement.startEstimate', 'Start')}: {quote.start_date_estimate}
                  </p>
                )}
                {quote.time_estimate_days && (
                  <p>
                    {t('agreement.duration', 'Duration')}:{' '}
                    {quote.time_estimate_days}{' '}
                    {t('agreement.days', 'days')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t('agreement.notes', 'Notes')}
              </p>
              <p className="text-sm whitespace-pre-line text-muted-foreground italic">
                {quote.notes}
              </p>
            </div>
          )}

          {/* Totals */}
          <div className="border-t border-border pt-3 space-y-1 text-right">
            <div className="text-sm text-muted-foreground">
              {t('agreement.subtotal', 'Subtotal')}: €{originalSubtotal.toFixed(2)}
            </div>
            {originalVat > 0 && (
              <div className="text-sm text-muted-foreground">
                IVA ({vatPercent}%): €{originalVat.toFixed(2)}
              </div>
            )}
            <div className="text-base font-bold">
              {t('agreement.total', 'Total')}: €{originalTotal.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Additions (separated below) ─── */}
      {addedItems.length > 0 && (
        <Card className="rounded-2xl border-border/40 bg-muted/10 shadow-none mt-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2 text-muted-foreground">
              <Plus className="h-3.5 w-3.5" />
              {t('agreement.additions', 'Added after agreement')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {addedItems.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-foreground truncate">
                    {item.description}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">
                    {formatDistanceToNow(new Date(item.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.client_acknowledged_at ? (
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  ) : (
                    <Clock className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="font-medium">
                    €{((item.line_total as number) ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            <div className="border-t border-border pt-2 text-right">
              <span className="text-sm font-medium">
                {t('agreement.additionsTotal', 'Additions total')}: €
                {additionsSubtotal.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
