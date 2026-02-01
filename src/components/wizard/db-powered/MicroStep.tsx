import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MicroCategory {
  id: string;
  name: string;
}

interface Props {
  subcategoryId: string | null;
  selectedIds: string[];
  onChange: (microIds: string[], microNames: string[]) => void;
  multiSelect?: boolean;
}

export default function MicroStep({
  subcategoryId,
  selectedIds,
  onChange,
  multiSelect = true,
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

  const handleToggle = (micro: MicroCategory) => {
    if (multiSelect) {
      const isSelected = selectedIds.includes(micro.id);
      if (isSelected) {
        // Remove
        const newIds = selectedIds.filter(id => id !== micro.id);
        const newNames = microCategories
          .filter(m => newIds.includes(m.id))
          .map(m => m.name);
        onChange(newIds, newNames);
      } else {
        // Add
        const newIds = [...selectedIds, micro.id];
        const newNames = microCategories
          .filter(m => newIds.includes(m.id))
          .map(m => m.name);
        onChange(newIds, newNames);
      }
    } else {
      // Single select
      onChange([micro.id], [micro.name]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {multiSelect ? 'Select tasks (multiple allowed)' : 'Select a service'}
      </label>
      
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : microCategories.length === 0 ? (
        <p className="text-muted-foreground">No services available</p>
      ) : (
        <div className="space-y-2">
          {microCategories.map((micro) => {
            const isSelected = selectedIds.includes(micro.id);
            return (
              <button
                key={micro.id}
                type="button"
                onClick={() => handleToggle(micro)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isSelected 
                    ? 'border-primary bg-primary/10 text-foreground' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                  {micro.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
      
      {multiSelect && selectedIds.length > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {selectedIds.length} task{selectedIds.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
