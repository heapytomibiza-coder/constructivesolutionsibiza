import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Subcategory {
  id: string;
  name: string;
}

interface Props {
  categoryId: string | null;
  value: string | null;
  onChange: (subcategoryId: string, subcategoryName: string) => void;
}

export default function SubcategorySelector({
  categoryId,
  value,
  onChange,
}: Props) {
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
        .order("name");

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

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        Subcategory
      </label>
      <select
        value={value || ""}
        onChange={(e) => {
          const selectedId = e.target.value;
          const selected = subcategories.find(s => s.id === selectedId);
          if (selected) {
            onChange(selectedId, selected.name);
          }
        }}
        className="w-full rounded border p-2"
        disabled={loading}
      >
        <option value="" disabled>
          {loading ? "Loading…" : "Select a subcategory"}
        </option>
        {subcategories.map((subcategory) => (
          <option key={subcategory.id} value={subcategory.id}>
            {subcategory.name}
          </option>
        ))}
      </select>
    </div>
  );
}
