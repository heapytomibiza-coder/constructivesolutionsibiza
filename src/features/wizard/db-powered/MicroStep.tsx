import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResilientQuery } from "@/features/wizard/canonical/hooks/useResilientQuery";
import { trackEvent } from "@/lib/trackEvent";

interface MicroCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface Props {
  subcategoryId: string;
  selectedMicroIds: string[];
  onSelect: (microNames: string[], microIds: string[], microSlugs: string[]) => void;
  multiSelect?: boolean;
  /** When set, only show micros whose IDs are in this list (direct mode scoping) */
  allowedMicroIds?: string[];
  /** Called when step should be auto-skipped (empty results after timeout) */
  onAutoSkip?: () => void;
}

export default function MicroStep({
  subcategoryId,
  selectedMicroIds,
  onSelect,
  multiSelect = true,
  allowedMicroIds,
  onAutoSkip,
}: Props) {
  const { t } = useTranslation(['wizard', 'micros']);

  const { data: rawMicros = [], isLoading, useFallback, retryCount, manualRetry, isFetching } = useResilientQuery<MicroCategory[]>({
    queryKey: ['service-micros-wizard', subcategoryId],
    queryFn: async (signal) => {
      const { data, error } = await supabase
        .from("service_micro_categories")
        .select("id, name, slug, description")
        .eq("subcategory_id", subcategoryId)
        .eq("is_active", true)
        .order("display_order")
        .abortSignal(signal);

      if (error) throw error;
      return data ?? [];
    },
    stepName: 'micro',
    queryOptions: {
      enabled: !!subcategoryId,
      staleTime: 5 * 60 * 1000,
    },
  });

  const microCategories = allowedMicroIds
    ? rawMicros.filter(m => allowedMicroIds.includes(m.id))
    : rawMicros;

  // Recovery is user-driven — no auto-skip effects

  if (!subcategoryId) {
    return null;
  }

  const getMicroLabel = (micro: MicroCategory): string => {
    const translated = t(`micros:${micro.slug}`, { defaultValue: '' });
    return translated || micro.name;
  };

  const handleToggle = (micro: MicroCategory) => {
    if (multiSelect) {
      const isSelected = selectedMicroIds.includes(micro.id);
      let newIds: string[];
      
      if (isSelected) {
        newIds = selectedMicroIds.filter(id => id !== micro.id);
      } else {
        newIds = [...selectedMicroIds, micro.id];
      }
      
      const selected = microCategories.filter(m => newIds.includes(m.id));
      onSelect(
        selected.map(m => m.name),
        selected.map(m => m.id),
        selected.map(m => m.slug)
      );
    } else {
      onSelect([micro.name], [micro.id], [micro.slug]);
    }
  };

  // Error or empty state with escalating recovery
  if ((isError || microCategories.length === 0) && !isLoading) {
    const hasRetried = retryCount >= 1;
    return (
      <div>
        <label className="block text-sm font-medium mb-2">
          {multiSelect ? t('wizard:micro.selectMultiple') : t('wizard:micro.selectSingle')}
        </label>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {hasRetried
              ? t('wizard:fallback.simplifying', "We'll simplify things to keep you moving")
              : t('wizard:micro.noServices', 'No services found')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (hasRetried && onAutoSkip) {
                trackEvent('wizard_auto_skip', 'client', { step: 'micro', reason: 'user_chose_keep_going' });
                onAutoSkip();
              } else {
                manualRetry();
              }
            }}
          >
            {hasRetried
              ? t('wizard:fallback.keepGoing', 'Keep going')
              : t('common:actions.retry', 'Try again')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {multiSelect ? t('wizard:micro.selectMultiple') : t('wizard:micro.selectSingle')}
      </label>
      
      {isLoading && !useFallback ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {microCategories.map((micro) => {
            const isSelected = selectedMicroIds.includes(micro.id);
            return (
              <button
                key={micro.id}
                type="button"
                onClick={() => handleToggle(micro)}
                className={`w-full text-left p-4 rounded-lg border transition-colors min-h-[56px] md:min-h-0 ${
                  isSelected 
                    ? 'border-primary bg-primary/10 text-foreground' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{getMicroLabel(micro)}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center ml-3 shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
      
      {multiSelect && selectedMicroIds.length > 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          {t('wizard:micro.tasksSelected', { count: selectedMicroIds.length })}
        </p>
      )}
    </div>
  );
}
