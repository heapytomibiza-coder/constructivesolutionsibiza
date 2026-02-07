import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

interface Subcategory {
  id: string;
  name: string;
}

interface Props {
  categoryId: string;
  categoryName?: string;
  selectedSubcategoryId?: string;
  onSelect: (subcategoryName: string, subcategoryId: string) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export default function SubcategorySelector({
  categoryId,
  selectedSubcategoryId,
  onSelect,
}: Props) {
  const { t } = useTranslation('wizard');
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
        .select("id, name")
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
    return <p className="text-muted-foreground">{t('subcategory.loading')}</p>;
  }

  return (
    <div className="space-y-2">
      {subcategories.length === 0 ? (
        <p className="text-muted-foreground">{t('subcategory.noSubcategories')}</p>
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
              {subcategory.name}
            </button>
          );
        })
      )}
    </div>
  );
}