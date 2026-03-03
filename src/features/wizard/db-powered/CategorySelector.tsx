import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_KEYS } from "@/i18n/categoryTranslations";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
}

interface Props {
  selectedCategory?: string;
  onSelect: (categoryName: string, categoryId: string) => void;
  onNext?: () => void;
  /** When set, only show categories whose IDs are in this list (direct mode scoping) */
  allowedCategoryIds?: string[];
}

export default function CategorySelector({ selectedCategory, onSelect, onNext, allowedCategoryIds }: Props) {
  const { t } = useTranslation(['wizard', 'common']);

  const { data: categories = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['service-categories-wizard'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-muted-foreground">{t('wizard:category.loadError', 'Could not load categories')}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t('common:actions.retry', 'Try again')}
        </Button>
      </div>
    );
  }

  const getCategoryLabel = (name: string): string => {
    const key = CATEGORY_KEYS[name];
    if (key) return t(`common:${key}`);
    return name;
  };

  const filtered = allowedCategoryIds
    ? categories.filter(c => allowedCategoryIds.includes(c.id))
    : categories;

  return (
    <div className="space-y-2">
      {filtered.map((category) => {
        const isSelected = selectedCategory === category.name;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.name, category.id)}
            className={`w-full text-left p-4 rounded-lg border transition-colors min-h-[56px] md:min-h-0 ${
              isSelected
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            {getCategoryLabel(category.name)}
          </button>
        );
      })}
    </div>
  );
}
