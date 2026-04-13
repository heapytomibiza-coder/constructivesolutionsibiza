import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calculator, History, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useServiceTaxonomy } from '@/pages/onboarding/hooks/useServiceTaxonomy';
import { toast } from 'sonner';
import { ServiceSelector } from './components/ServiceSelector';
import { DynamicInputForm } from './components/DynamicInputForm';
import { EstimateCard } from './components/EstimateCard';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { usePricingRules, usePricingRuleBySlug } from './hooks/usePricingRules';
import { useSaveEstimate } from './hooks/useEstimateHistory';
import { calculateEstimate, validateInputs, type EstimateInputs, type EstimateResult } from './lib/calculateEstimate';
import { supabase } from '@/integrations/supabase/client';

export default function PriceCalculatorPage() {
  const [searchParams] = useSearchParams();
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [microSlug, setMicroSlug] = useState('');
  const [microName, setMicroName] = useState('');
  const [inputs, setInputs] = useState<EstimateInputs>({});
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: allRules } = usePricingRules();
  const { data: rule, isFetching: isRuleFetching } = usePricingRuleBySlug(microSlug || null);
  const { data: taxonomy } = useServiceTaxonomy();
  const saveEstimate = useSaveEstimate();

  const coveredSlugs = useMemo(
    () => new Set((allRules ?? []).map((r) => r.micro_slug)),
    [allRules]
  );

  // Auto-select category from URL param
  useEffect(() => {
    const paramCategory = searchParams.get('category');
    if (!paramCategory || !taxonomy || categoryId) return;
    const match = taxonomy.find((c) => c.name === paramCategory);
    if (match) setCategoryId(match.id);
  }, [searchParams, taxonomy, categoryId]);

  const fields = rule?.adjustment_factors?.fields ?? [];

  // Pre-populate default values when rule loads
  useEffect(() => {
    if (!fields.length) return;
    const defaults: EstimateInputs = {};
    let hasDefaults = false;
    for (const field of fields) {
      if (field.default !== undefined) {
        defaults[field.key] = field.default;
        hasDefaults = true;
      }
    }
    if (hasDefaults) {
      setInputs((prev) => ({ ...defaults, ...prev }));
    }
  }, [rule?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryChange = useCallback((id: string) => {
    setCategoryId(id);
    setSubcategoryId('');
    setMicroSlug('');
    setMicroName('');
    setInputs({});
    setResult(null);
    setFieldErrors({});
  }, []);

  const handleSubcategoryChange = useCallback((id: string) => {
    setSubcategoryId(id);
    setMicroSlug('');
    setMicroName('');
    setInputs({});
    setResult(null);
    setFieldErrors({});
  }, []);

  const handleMicroChange = useCallback((slug: string, name: string) => {
    setMicroSlug(slug);
    setMicroName(name);
    setInputs({});
    setResult(null);
    setFieldErrors({});
  }, []);

  const handleInputChange = useCallback((key: string, value: number | string | boolean) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    // Clear field error on change
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleCalculate = useCallback(() => {
    if (!rule) {
      toast.error('No pricing rule available for this service yet.');
      return;
    }

    const errors = validateInputs(fields, inputs);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please fix the highlighted fields before calculating.');
      return;
    }

    setFieldErrors({});
    const estimate = calculateEstimate(rule, inputs);
    setResult(estimate);
  }, [rule, inputs, fields]);

  // Calculate button disabled when required fields are missing/invalid
  const hasRequiredInputs = useMemo(() => {
    if (!fields.length) return true;
    const errors = validateInputs(fields, inputs);
    return Object.keys(errors).length === 0;
  }, [fields, inputs]);

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

  const noRuleForSelection = microSlug && !rule && !isRuleFetching;

  return (
    <div className="min-h-screen bg-background">
      {/* Header — tighter on mobile */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-5 sm:py-8 max-w-6xl">
          <div className="flex items-center gap-3 mb-1">
            <Calculator className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Price Calculator</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Get a rough idea of materials and labour costs before posting a job or preparing a quote.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 sm:py-6 max-w-6xl">
        <DisclaimerBanner />

        <div className="mt-5 sm:mt-6 grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
          {/* Left panel — selection + inputs */}
          <div className="lg:col-span-3 space-y-5 sm:space-y-6">
            <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-5 sm:space-y-6">
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
              <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-5 sm:space-y-6">
                <h2 className="font-semibold text-foreground">2. Project details</h2>

                {isRuleFetching ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading pricing data…</span>
                  </div>
                ) : noRuleForSelection ? (
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
                      errors={fieldErrors}
                    />
                    <Button
                      onClick={handleCalculate}
                      className="w-full"
                      size="lg"
                      disabled={!hasRequiredInputs}
                    >
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
