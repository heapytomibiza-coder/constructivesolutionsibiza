import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, History, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useEstimateHistory, useDuplicateEstimate, type SavedEstimate } from './hooks/useEstimateHistory';
import { format } from 'date-fns';

function formatEur(n: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function EstimateRow({ estimate, onDuplicate }: { estimate: SavedEstimate; onDuplicate: () => void }) {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground truncate">{estimate.micro_name}</span>
          <Badge variant="outline" className="text-xs shrink-0">{estimate.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {estimate.category} → {estimate.subcategory}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(estimate.created_at), 'dd MMM yyyy, HH:mm')}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold text-primary">
          {formatEur(estimate.total_min)} – {formatEur(estimate.total_max)}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link to={`/prototype/price-calculator/history/${estimate.id}`}>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={onDuplicate}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function EstimateHistoryPage() {
  const { data: estimates, isLoading } = useEstimateHistory();
  const duplicate = useDuplicateEstimate();

  const handleDuplicate = (est: SavedEstimate) => {
    duplicate.mutate(est, {
      onSuccess: () => toast.success('Estimate duplicated.'),
      onError: () => toast.error('Failed to duplicate.'),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Link to="/prototype/price-calculator" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="h-4 w-4" /> Back to Calculator
          </Link>
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Estimate History</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

        {!isLoading && (!estimates || estimates.length === 0) && (
          <div className="rounded-xl border-2 border-dashed p-12 text-center">
            <p className="text-muted-foreground">No saved estimates yet.</p>
            <Link to="/prototype/price-calculator">
              <Button className="mt-4">Create your first estimate</Button>
            </Link>
          </div>
        )}

        {estimates && estimates.length > 0 && (
          <div className="space-y-3">
            {estimates.map((est) => (
              <EstimateRow
                key={est.id}
                estimate={est}
                onDuplicate={() => handleDuplicate(est)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
