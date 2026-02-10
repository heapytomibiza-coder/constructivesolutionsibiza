import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";

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
}

export default function MicroStep({
  subcategoryId,
  selectedMicroIds,
  onSelect,
  multiSelect = true,
  allowedMicroIds,
}: Props) {
  const { t } = useTranslation(['wizard', 'micros']);
  const [microCategories, setMicroCategories] = useState<MicroCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subcategoryId) {
      setMicroCategories([]);
      return;
    }

    const fetchMicroCategories = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("service_micro_categories")
        .select("id, name, slug, description")
        .eq("subcategory_id", subcategoryId)
        .eq("is_active", true)
        .order("display_order");

      if (!error && data) {
        setMicroCategories(data);
      }

      setLoading(false);
    };

    fetchMicroCategories();
  }, [subcategoryId]);

  if (!subcategoryId) {
    return null;
  }

  /** Get localized micro name: check micros namespace, fall back to DB name */
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

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {multiSelect ? t('wizard:micro.selectMultiple') : t('wizard:micro.selectSingle')}
      </label>
      
      {loading ? (
        <p className="text-muted-foreground">{t('wizard:micro.loading')}</p>
      ) : microCategories.length === 0 ? (
        <p className="text-muted-foreground">{t('wizard:micro.noServices')}</p>
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
                    {micro.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {micro.description}
                      </p>
                    )}
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
