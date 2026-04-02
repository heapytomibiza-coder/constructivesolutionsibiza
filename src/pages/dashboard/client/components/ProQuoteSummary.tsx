/**
 * ProQuoteSummary — Shows the professional's own quote for this job.
 * Read-only summary of what was agreed/submitted.
 */

import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useMyQuoteForJob } from '@/pages/jobs/queries/quotes.query';
import { cn } from '@/lib/utils';

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

  const { data: quote, isLoading } = useMyQuoteForJob(jobId, user?.id ?? null, !!user?.id);

  if (isLoading || !quote) return null;

  const StatusIcon = STATUS_ICON[quote.status as keyof typeof STATUS_ICON] ?? Clock;
  const statusColor = STATUS_COLOR[quote.status as keyof typeof STATUS_COLOR] ?? 'text-muted-foreground';

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
      </CardContent>
    </Card>
  );
}
