import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

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
}

export default function SubcategorySelector({
  categoryId,
  selectedSubcategoryId,
  onSelect,
  allowedSubcategoryIds,
}: Props) {
  const { t } = useTranslation(['wizard', 'common']);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    const fetchSubcategories = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("service_subcategories")
        .select("id, name, slug")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("display_order");

      if (!error && data) {
        setSubcategories(data);
      }

      setLoading(false);
    };

    fetchSubcategories();
  }, [categoryId]);

  if (!categoryId) {
    return null;
  }

  if (loading) {
    return <p className="text-muted-foreground">{t('wizard:subcategory.loading')}</p>;
  }

  const getSubcategoryLabel = (sub: Subcategory): string => {
    const translated = t(`common:subcategories.${sub.slug}`, { defaultValue: '' });
    return translated || sub.name;
  };

  return (
    <div className="space-y-2">
      {subcategories.length === 0 ? (
        <p className="text-muted-foreground">{t('wizard:subcategory.noSubcategories')}</p>
      ) : (
        subcategories.map((subcategory) => {
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