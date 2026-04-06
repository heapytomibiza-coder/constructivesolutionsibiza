import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, History, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ServiceSelector } from './components/ServiceSelector';
import { DynamicInputForm } from './components/DynamicInputForm';
import { EstimateCard } from './components/EstimateCard';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { usePricingRules, usePricingRuleBySlug } from './hooks/usePricingRules';
import { useSaveEstimate } from './hooks/useEstimateHistory';
import { calculateEstimate, type EstimateInputs, type EstimateResult } from './lib/calculateEstimate';
import { supabase } from '@/integrations/supabase/client';

export default function PriceCalculatorPage() {
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [microSlug, setMicroSlug] = useState('');
  const [microName, setMicroName] = useState('');
  const [inputs, setInputs] = useState<EstimateInputs>({});
  const [result, setResult] = useState<EstimateResult | null>(null);

  const { data: allRules } = usePricingRules();
  const { data: rule } = usePricingRuleBySlug(microSlug || null);
  const saveEstimate = useSaveEstimate();

  const coveredSlugs = useMemo(
    () => new Set((allRules ?? []).map((r) => r.micro_slug)),
    [allRules]
  );

  // Initialize default values when rule changes
  const fields = rule?.adjustment_factors?.fields ?? [];

  const handleCategoryChange = useCallback((id: string) => {
    setCategoryId(id);
    setSubcategoryId('');
    setMicroSlug('');
    setMicroName('');
    setInputs({});
    setResult(null);
  }, []);

  const handleSubcategoryChange = useCallback((id: string) => {
    setSubcategoryId(id);
    setMicroSlug('');
    setMicroName('');
    setInputs({});
    setResult(null);
  }, []);

  const handleMicroChange = useCallback((slug: string, name: string) => {
    setMicroSlug(slug);
    setMicroName(name);
    setInputs({});
    setResult(null);
  }, []);

  const handleInputChange = useCallback((key: string, value: number | string | boolean) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCalculate = useCallback(() => {
    if (!rule) {
      toast.error('No pricing rule available for this service yet.');
      return;
    }
    const estimate = calculateEstimate(rule, inputs);
    setResult(estimate);
  }, [rule, inputs]);

  const handleSave = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Please sign in to save your estimate.', {
        action: { label: 'Sign in', onClick: () => window.location.href = '/auth' },
      });
      return;
    }
    if (!result || !rule) return;

    saveEstimate.mutate(
      {
        userId: session.user.id,
        category: rule.category,
        subcategory: rule.subcategory,
        micro_slug: rule.micro_slug,
        micro_name: rule.micro_name,
        inputs,
        result,
        ruleSnapshot: {
          rule_id: rule.id,
          location_modifier: rule.location_modifier,
          base_labour_min: rule.base_labour_min,
          base_labour_max: rule.base_labour_max,
          base_material_min: rule.base_material_min,
          base_material_max: rule.base_material_max,
          rule_updated_at: rule.updated_at ?? '',
        },
      },
      {
        onSuccess: () => toast.success('Estimate saved to your history.'),
        onError: () => toast.error('Failed to save estimate. Please try again.'),
      }
    );
  }, [result, rule, inputs, saveEstimate]);

  const noRuleForSelection = microSlug && !rule;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Price Calculator</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Get a rough idea of materials and labour costs before posting a job or preparing a quote.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <DisclaimerBanner />

        {/* Main layout: desktop side-by-side, mobile stacked */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left panel — selection + inputs */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-xl border bg-card p-6 space-y-6">
              <h2 className="font-semibold text-foreground">1. Select a service</h2>
              <ServiceSelector
                categoryId={categoryId}
                subcategoryId={subcategoryId}
                microSlug={microSlug}
                onCategoryChange={handleCategoryChange}
                onSubcategoryChange={handleSubcategoryChange}
                onMicroChange={handleMicroChange}
                coveredSlugs={coveredSlugs}
              />
            </div>

            {microSlug && (
              <div className="rounded-xl border bg-card p-6 space-y-6">
                <h2 className="font-semibold text-foreground">2. Project details</h2>
                {noRuleForSelection ? (
                  <div className="rounded-lg bg-muted p-4 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      We don't have pricing data for <strong>{microName}</strong> yet.
                      Post a job to receive real quotes from professionals.
                    </p>
                    <Link to="/post-job">
                      <Button variant="default" size="sm">
                        Post a Job
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <DynamicInputForm
                      fields={fields}
                      values={inputs}
                      onChange={handleInputChange}
                    />
                    <Button onClick={handleCalculate} className="w-full" size="lg">
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate Estimate
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right panel — estimate card + actions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="lg:sticky lg:top-6 space-y-4">
              <EstimateCard result={result} microName={microName} />

              {result && (
                <div className="space-y-2">
                  <Button
                    onClick={handleSave}
                    variant="outline"
                    className="w-full"
                    disabled={saveEstimate.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveEstimate.isPending ? 'Saving…' : 'Save Estimate'}
                  </Button>
                  <Link to="/prototype/price-calculator/history" className="block">
                    <Button variant="ghost" className="w-full text-muted-foreground">
                      <History className="h-4 w-4 mr-2" />
                      View Estimate History
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
