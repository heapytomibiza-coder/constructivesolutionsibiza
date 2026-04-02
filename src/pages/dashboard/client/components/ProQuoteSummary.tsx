/**
 * ProQuoteSummary — Shows the professional's own quote for this job.
 * Includes "Add Additional Costs" for accepted quotes on in_progress jobs.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, CheckCircle2, Clock, XCircle, Plus, Loader2, Send } from 'lucide-react';
import { useMyQuoteForJob } from '@/pages/jobs/queries/quotes.query';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProQuoteSummaryProps {
  jobId: string;
  jobStatus: string;
}

const STATUS_ICON = {
  submitted: Clock,
  revised: Clock,
  accepted: CheckCircle2,
  rejected: XCircle,
  withdrawn: XCircle,
} as const;

const STATUS_COLOR = {
  submitted: 'text-muted-foreground',
  revised: 'text-muted-foreground',
  accepted: 'text-primary',
  rejected: 'text-destructive',
  withdrawn: 'text-muted-foreground',
} as const;

export function ProQuoteSummary({ jobId, jobStatus }: ProQuoteSummaryProps) {
  const { t } = useTranslation('dashboard');
  const { user } = useSession();
  const queryClient = useQueryClient();

  const [showAddCost, setShowAddCost] = useState(false);
  const [costDescription, setCostDescription] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: quote, isLoading } = useMyQuoteForJob(jobId, user?.id ?? null, !!user?.id);

  if (isLoading || !quote) return null;

  const StatusIcon = STATUS_ICON[quote.status as keyof typeof STATUS_ICON] ?? Clock;
  const statusColor = STATUS_COLOR[quote.status as keyof typeof STATUS_COLOR] ?? 'text-muted-foreground';

  const canAddCosts = quote.status === 'accepted' && jobStatus === 'in_progress';

  const handleAddCost = async () => {
    const amount = parseFloat(costAmount);
    if (!costDescription.trim() || isNaN(amount) || amount <= 0) {
      toast.error(t('quote.invalidCostEntry', 'Enter a description and valid amount'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Add a new line item to the quote
      const sortOrder = (quote.line_items?.length ?? 0) + 1;
      const { error: lineError } = await supabase.from('quote_line_items').insert({
        quote_id: quote.id,
        description: costDescription.trim(),
        unit_price: amount,
        quantity: 1,
        line_total: amount,
        sort_order: sortOrder,
      });

      if (lineError) throw lineError;

      // Update the quote total
      const currentTotal = quote.total ?? quote.price_fixed ?? 0;
      const newTotal = currentTotal + amount;
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ total: newTotal, subtotal: newTotal, updated_at: new Date().toISOString() })
        .eq('id', quote.id);

      if (quoteError) throw quoteError;

      toast.success(t('quote.costAdded', 'Additional cost added'));
      queryClient.invalidateQueries({ queryKey: ['my_quote', jobId] });
      setCostDescription('');
      setCostAmount('');
      setShowAddCost(false);
    } catch {
      toast.error(t('quote.costAddFailed', 'Failed to add cost'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          {t('jobTicket.yourQuote', 'Your Quote')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status + total */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn('h-4 w-4', statusColor)} />
            <Badge variant={quote.status === 'accepted' ? 'default' : 'secondary'} className="capitalize">
              {t(`quoteStatus.${quote.status}`, quote.status)}
            </Badge>
          </div>
          <p className="text-lg font-bold text-foreground">
            €{(quote.total ?? quote.price_fixed ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Line items */}
        {quote.line_items && quote.line_items.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            {quote.line_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.description}</span>
                <span className="font-medium">
                  €{(item.line_total ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {quote.notes && (
          <p className="text-xs text-muted-foreground pt-2 border-t border-border italic">
            {quote.notes}
          </p>
        )}

        {/* Add additional costs */}
        {canAddCosts && !showAddCost && (
          <div className="pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 w-full"
              onClick={() => setShowAddCost(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('quote.addAdditionalCosts', 'Add Additional Costs')}
            </Button>
          </div>
        )}

        {canAddCosts && showAddCost && (
          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-xs font-medium text-foreground">
              {t('quote.additionalCostTitle', 'New cost item')}
            </p>
            <Input
              placeholder={t('quote.costDescPlaceholder', 'e.g. Additional materials')}
              value={costDescription}
              onChange={(e) => setCostDescription(e.target.value)}
            />
            <Input
              type="number"
              placeholder={t('quote.costAmountPlaceholder', 'Amount (€)')}
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              min="0"
              step="0.01"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddCost(false);
                  setCostDescription('');
                  setCostAmount('');
                }}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleAddCost}
                disabled={isSubmitting || !costDescription.trim() || !costAmount}
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {t('quote.addCost', 'Add Cost')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
