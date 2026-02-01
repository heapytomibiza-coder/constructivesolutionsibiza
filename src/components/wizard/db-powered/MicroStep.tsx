import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MicroCategory {
  id: string;
  name: string;
}

interface Props {
  subcategoryId: string | null;
  value: string | null;
  onChange: (microCategoryId: string) => void;
}

export default function MicroStep({
  subcategoryId,
  value,
  onChange,
}: Props) {
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
        .select("id, name")
        .eq("subcategory_id", subcategoryId)
        .order("name");

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

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        Service type
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border p-2"
        disabled={loading}
      >
        <option value="" disabled>
          {loading ? "Loading…" : "Select a service"}
        </option>
        {microCategories.map((micro) => (
          <option key={micro.id} value={micro.id}>
            {micro.name}
          </option>
        ))}
      </select>
    </div>
  );
}
