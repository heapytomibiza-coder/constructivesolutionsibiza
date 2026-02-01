import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
}

interface Props {
  value: string | null;
  onChange: (categoryId: string, categoryName: string) => void;
}

export default function CategorySelector({ value, onChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name")
        .order("name");

      if (!error && data) {
        setCategories(data);
      }

      setLoading(false);
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <p>Loading categories…</p>;
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        Category
      </label>
      <select
        value={value || ""}
        onChange={(e) => {
          const selectedId = e.target.value;
          const selectedCategory = categories.find(c => c.id === selectedId);
          if (selectedCategory) {
            onChange(selectedId, selectedCategory.name);
          }
        }}
        className="w-full rounded border p-2"
      >
        <option value="" disabled>
          Select a category
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}
