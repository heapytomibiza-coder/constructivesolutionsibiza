import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useResilientQuery } from "@/features/wizard/canonical/hooks/useResilientQuery";
import { trackEvent } from "@/lib/trackEvent";

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  categoryId: string;
  categoryName?: string;
  selectedSubcategoryId?: string;
  onSelect: (subcategoryName: string, subcategoryId: string) => void;
  onNext?: () => void;
  onBack?: () => void;
  /** When set, only show subcategories whose IDs are in this list (direct mode scoping) */
  allowedSubcategoryIds?: string[];
  /** Called when step should be auto-skipped (empty results after timeout) */
  onAutoSkip?: () => void;
}

export default function SubcategorySelector({
  categoryId,
  selectedSubcategoryId,
  onSelect,
  allowedSubcategoryIds,
  onAutoSkip,
}: Props) {
  const { t } = useTranslation(['wizard', 'common']);
  const autoAdvancedRef = useRef(false);
  const autoSkipFiredRef = useRef(false);

  // Reset guards when category changes
  useEffect(() => {
    autoAdvancedRef.current = false;
    autoSkipFiredRef.current = false;
  }, [categoryId]);

  const { data: subcategories = [], isLoading, useFallback } = useResilientQuery<Subcategory[]>({
    queryKey: ['service-subcategories-wizard', categoryId],
    queryFn: async (signal) => {
      const { data, error } = await supabase
        .from("service_subcategories")
        .select("id, name, slug")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("display_order")
        .abortSignal(signal);

      if (error) throw error;
      return data ?? [];
    },
    stepName: 'subcategory',
    queryOptions: {
      enabled: !!categoryId,
      staleTime: 5 * 60 * 1000,
    },
  });

  const filtered = allowedSubcategoryIds
    ? subcategories.filter(s => allowedSubcategoryIds.includes(s.id))
    : subcategories;

  // Auto-advance when only one subcategory exists
  useEffect(() => {
    if (!isLoading && filtered.length === 1 && !autoAdvancedRef.current && !selectedSubcategoryId) {
      autoAdvancedRef.current = true;
      const only = filtered[0];
      onSelect(only.name, only.id);
    }
  }, [isLoading, filtered, selectedSubcategoryId, onSelect]);

  // Auto-skip when empty after load/timeout
  useEffect(() => {
    if (!isLoading && (filtered.length === 0 || useFallback) && !autoSkipFiredRef.current && onAutoSkip) {
      // Only fire if we actually got results back (or timed out) and they're empty
      if (filtered.length === 0) {
        autoSkipFiredRef.current = true;
        trackEvent('wizard_auto_skip', 'client', { step: 'subcategory', reason: useFallback ? 'timeout' : 'empty' });
        onAutoSkip();
      }
    }
  }, [isLoading, filtered.length, useFallback, onAutoSkip]);

  if (!categoryId) {
    return null;
  }

  if (isLoading && !useFallback) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getSubcategoryLabel = (sub: Subcategory): string => {
    const key = `common:subcategories.${sub.slug}`;
    const translated = t(key, { defaultValue: '' });
    if (translated && translated !== key) return translated;
    const human = sub.slug.replace(/-/g, ' ');
    return human.charAt(0).toUpperCase() + human.slice(1);
  };

  return (
    <div className="space-y-2">
      {filtered.length === 0 ? (
        <p className="text-muted-foreground">{t('wizard:subcategory.noSubcategories')}</p>
      ) : (
        filtered.map((subcategory) => {
          const isSelected = selectedSubcategoryId === subcategory.id;
          return (
            <button
              key={subcategory.id}
              type="button"
              onClick={() => onSelect(subcategory.name, subcategory.id)}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              {getSubcategoryLabel(subcategory)}
            </button>
          );
        })
      )}
    </div>
  );
}
