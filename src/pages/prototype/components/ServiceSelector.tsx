import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServiceTaxonomy } from '@/pages/onboarding/hooks/useServiceTaxonomy';
import { Loader2 } from 'lucide-react';

interface ServiceSelectorProps {
  categoryId: string;
  subcategoryId: string;
  microSlug: string;
  onCategoryChange: (id: string) => void;
  onSubcategoryChange: (id: string) => void;
  onMicroChange: (slug: string, name: string) => void;
  /** Slugs that have a pricing rule */
  coveredSlugs: Set<string>;
}

export function ServiceSelector({
  categoryId,
  subcategoryId,
  microSlug,
  onCategoryChange,
  onSubcategoryChange,
  onMicroChange,
  coveredSlugs,
}: ServiceSelectorProps) {
  const { data: categories, isLoading } = useServiceTaxonomy();

  const selectedCategory = useMemo(
    () => categories?.find((c) => c.id === categoryId),
    [categories, categoryId]
  );

  const selectedSubcategory = useMemo(
    () => selectedCategory?.subcategories.find((s) => s.id === subcategoryId),
    [selectedCategory, subcategoryId]
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading services…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Choose a category, then subcategory, then service to get an estimate.
      </p>

      {/* Category */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold mr-1.5">1</span>
          Category
        </Label>
        <Select value={categoryId} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category…" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon_emoji ? `${cat.icon_emoji} ` : ''}{cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subcategory */}
      {selectedCategory && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold mr-1.5">2</span>
            Subcategory
          </Label>
          <Select value={subcategoryId} onValueChange={onSubcategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a subcategory…" />
            </SelectTrigger>
            <SelectContent>
              {selectedCategory.subcategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Micro Service */}
      {selectedSubcategory && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold mr-1.5">3</span>
            Service
          </Label>
          <Select
            value={microSlug}
            onValueChange={(slug) => {
              const micro = selectedSubcategory.micros.find((m) => m.slug === slug);
              if (micro) onMicroChange(micro.slug, micro.name);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a service…" />
            </SelectTrigger>
            <SelectContent>
              {selectedSubcategory.micros.map((micro) => {
                const hasPricing = coveredSlugs.has(micro.slug);
                return (
                  <SelectItem
                    key={micro.id}
                    value={micro.slug}
                    className={!hasPricing ? 'opacity-50' : ''}
                  >
                    {micro.name}
                    {!hasPricing && (
                      <span className="ml-2 text-xs text-muted-foreground">(no pricing yet)</span>
                    )}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
