import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface InsightFilterBarProps {
  area: string | null;
  onAreaChange: (v: string | null) => void;
  category: string | null;
  onCategoryChange: (v: string | null) => void;
  onExportCSV?: () => void;
}

function useFilterOptions() {
  const { data: categories } = useQuery({
    queryKey: ["admin", "filter_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("slug, name")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const { data: areas } = useQuery({
    queryKey: ["admin", "filter_areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("area")
        .not("area", "is", null)
        .neq("area", "");
      if (error) throw error;
      const unique = [...new Set((data ?? []).map((j) => j.area as string))].sort();
      return unique;
    },
    staleTime: 5 * 60_000,
  });

  return { categories: categories ?? [], areas: areas ?? [] };
}

export function InsightFilterBar({
  area, onAreaChange, category, onCategoryChange, onExportCSV,
}: InsightFilterBarProps) {
  const { areas, categories } = useFilterOptions();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={area ?? "all"} onValueChange={(v) => onAreaChange(v === "all" ? null : v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Areas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Areas</SelectItem>
          {areas.map((a) => (
            <SelectItem key={a} value={a}>{a}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={category ?? "all"} onValueChange={(v) => onCategoryChange(v === "all" ? null : v)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {onExportCSV && (
        <Button variant="outline" size="sm" onClick={onExportCSV} className="gap-1.5">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      )}
    </div>
  );
}
