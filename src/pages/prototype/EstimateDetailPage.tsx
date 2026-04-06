import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEstimateById } from './hooks/useEstimateHistory';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { EstimateCard } from './components/EstimateCard';
import { format } from 'date-fns';

export default function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: estimate, isLoading } = useEstimateById(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Estimate not found.</p>
      </div>
    );
  }

  const result = {
    materials_min: estimate.materials_min,
    materials_max: estimate.materials_max,
    labour_min: estimate.labour_min,
    labour_max: estimate.labour_max,
    additional_min: estimate.additional_min,
    additional_max: estimate.additional_max,
    total_min: estimate.total_min,
    total_max: estimate.total_max,
    confidence_level: estimate.confidence_level as 'low' | 'medium' | 'high',
    pricing_source: estimate.pricing_source,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <Link to="/prototype/price-calculator/history" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="h-4 w-4" /> Back to History
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{estimate.micro_name}</h1>
            <Badge variant="outline">{estimate.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {estimate.category} → {estimate.subcategory} · {format(new Date(estimate.created_at), 'dd MMM yyyy, HH:mm')}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <DisclaimerBanner />
        <EstimateCard result={result} microName={estimate.micro_name} />

        {/* Inputs breakdown */}
        {estimate.inputs && Object.keys(estimate.inputs).length > 0 && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-3">Inputs Used</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(estimate.inputs).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium text-foreground">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
