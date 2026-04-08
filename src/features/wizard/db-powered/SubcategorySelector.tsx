import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const { data: subcategories = [], isLoading, isError, useFallback, retryCount, manualRetry } = useResilientQuery<Subcategory[]>({
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

  // Auto-skip when empty after load/timeout (only on initial load, not after manual retry)
  useEffect(() => {
    if (!isLoading && (filtered.length === 0 || useFallback) && !autoSkipFiredRef.current && onAutoSkip) {
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

  // Error or empty state with escalating recovery
  if ((isError || filtered.length === 0) && !isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {retryCount >= 1
            ? t('wizard:fallback.simplifying', "We'll simplify things to keep you moving")
            : t('wizard:subcategory.noSubcategories')}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (retryCount >= 1 && onAutoSkip) {
              onAutoSkip();
            } else {
              manualRetry();
            }
          }}
        >
          {retryCount >= 1
            ? t('wizard:fallback.keepGoing', 'Keep going')
            : t('common:actions.retry', 'Try again')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((subcategory) => {
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
      })}
    </div>
  );
}
