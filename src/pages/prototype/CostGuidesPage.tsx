/**
 * Cost Guides Index Page
 * 
 * Browse all service categories and jump into the price calculator.
 * Modelled after MyJobQuote's /costs page, adapted to our taxonomy.
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calculator, ArrowRight, BadgeCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryPlaceholder } from '@/components/CategoryPlaceholder';
import { getCategoryIconByName } from '@/lib/categoryIcons';
import { getCategoryVisualByName, categoryGradientStyle } from '@/lib/categoryVisuals';
import { usePricingRules } from './hooks/usePricingRules';
import { useServiceTaxonomy } from '@/pages/onboarding/hooks/useServiceTaxonomy';

interface CategoryCardData {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  rulesCount: number;
  microNames: string[];
}

export default function CostGuidesPage() {
  const [search, setSearch] = useState('');
  const { data: categories, isLoading: loadingTax } = useServiceTaxonomy();
  const { data: rules, isLoading: loadingRules } = usePricingRules();

  const cardData = useMemo<CategoryCardData[]>(() => {
    if (!categories) return [];

    return categories.map((cat) => {
      const catRules = (rules ?? []).filter((r) => r.category === cat.name);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug ?? '',
        rulesCount: catRules.length,
        microNames: catRules.map((r) => r.micro_name),
      };
    });
  }, [categories, rules]);

  const filtered = useMemo(() => {
    if (!search.trim()) return cardData;
    const q = search.toLowerCase();
    return cardData.filter(
      (c) =>
        c.categoryName.toLowerCase().includes(q) ||
        c.microNames.some((m) => m.toLowerCase().includes(q))
    );
  }, [cardData, search]);

  // Split into covered (has rules) and uncovered
  const covered = filtered.filter((c) => c.rulesCount > 0);
  const uncovered = filtered.filter((c) => c.rulesCount === 0);

  const isLoading = loadingTax || loadingRules;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-12 max-w-5xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calculator className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Cost Guides
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Get instant ballpark estimates for home improvement and construction projects in Ibiza.
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search cost guides…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Covered categories */}
            {covered.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  Pricing available
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {covered.map((card) => (
                    <CostGuideCard key={card.categoryId} card={card} />
                  ))}
                </div>
              </section>
            )}

            {/* Uncovered categories */}
            {uncovered.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Coming soon
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uncovered.map((card) => (
                    <CostGuideCard key={card.categoryId} card={card} />
                  ))}
                </div>
              </section>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">
                  No categories match "{search}"
                </p>
                <Button variant="outline" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CostGuideCard({ card }: { card: CategoryCardData }) {
  const hasPricing = card.rulesCount > 0;
  const visual = getCategoryVisualByName(card.categoryName);
  const Icon = getCategoryIconByName(card.categoryName);

  const content = (
    <div className="group rounded-xl border overflow-hidden transition-shadow hover:shadow-lg">
      {/* Gradient header with icon */}
      <div
        className="h-28 flex items-center justify-center relative"
        style={categoryGradientStyle(visual)}
      >
        <Icon
          className="h-12 w-12 transition-transform group-hover:scale-110"
          style={{ color: visual.iconColor }}
          strokeWidth={1.5}
        />
        {hasPricing && (
          <Badge className="absolute top-3 right-3 bg-background/90 text-foreground text-xs">
            {card.rulesCount} {card.rulesCount === 1 ? 'guide' : 'guides'}
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          {card.categoryName}
          {hasPricing && <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
        </h3>
        {hasPricing ? (
          <p className="text-sm text-muted-foreground mt-1">
            {card.microNames.join(', ')}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            Pricing guides coming soon
          </p>
        )}
      </div>
    </div>
  );

  if (hasPricing) {
    return (
      <Link to={`/prototype/price-calculator?category=${encodeURIComponent(card.categoryName)}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className="opacity-70 cursor-default">
      {content}
    </div>
  );
}
