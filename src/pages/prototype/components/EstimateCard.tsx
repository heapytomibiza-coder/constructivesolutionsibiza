import { Badge } from '@/components/ui/badge';
import type { EstimateResult } from '../lib/calculateEstimate';

interface EstimateCardProps {
  result: EstimateResult | null;
  microName?: string;
}

function formatEur(n: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function ConfidenceBadge({ level }: { level: string }) {
  const variants: Record<string, string> = {
    low: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    high: 'bg-success/10 text-success border-success/20',
  };

  return (
    <Badge variant="outline" className={variants[level] ?? variants.low}>
      {level} confidence
    </Badge>
  );
}

function RangeRow({ label, min, max }: { label: string; min: number; max: number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">
        {formatEur(min)} – {formatEur(max)}
      </span>
    </div>
  );
}

export function EstimateCard({ result, microName }: EstimateCardProps) {
  if (!result) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Select a service and enter project details to see an estimate.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-card p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">
          {microName ?? 'Estimate'}
        </h3>
        <ConfidenceBadge level={result.confidence_level} />
      </div>

      <div className="divide-y divide-border">
        <RangeRow label="Materials" min={result.materials_min} max={result.materials_max} />
        <RangeRow label="Labour" min={result.labour_min} max={result.labour_max} />
        <RangeRow label="Additional (transport/access)" min={result.additional_min} max={result.additional_max} />
      </div>

      <div className="border-t-2 border-primary/20 pt-4 flex items-center justify-between">
        <span className="font-semibold text-foreground">Estimated Total</span>
        <span className="text-lg font-bold text-primary">
          {formatEur(result.total_min)} – {formatEur(result.total_max)}
        </span>
      </div>
    </div>
  );
}
