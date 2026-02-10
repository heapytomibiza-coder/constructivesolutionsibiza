import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_KEYS } from "@/i18n/categoryTranslations";

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

export default function CategorySelector({ selectedCategory, onSelect, onNext }: Props) {
  const { t } = useTranslation(['wizard', 'common']);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("display_order");

      if (!error && data) {
        setCategories(data);
      }

      setLoading(false);
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">{t('wizard:category.loading')}</p>;
  }

  const getCategoryLabel = (name: string): string => {
    const key = CATEGORY_KEYS[name];
    if (key) return t(`common:${key}`);
    return name;
  };

  return (
    <div className="space-y-2">
      {categories.map((category) => {
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
