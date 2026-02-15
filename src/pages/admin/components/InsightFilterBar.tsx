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

const AREAS = [
  "Ibiza Town", "San Antonio", "Santa Eulalia", "San José",
  "San Juan", "Santa Gertrudis", "San Rafael", "Es Canar", "Cala Llonga",
];

const CATEGORIES = [
  "electrical", "plumbing", "carpentry", "hvac", "construction",
  "kitchen-bathroom", "pool-spa", "handyman", "gardening-landscaping",
];

export function InsightFilterBar({
  area, onAreaChange, category, onCategoryChange, onExportCSV,
}: InsightFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={area ?? "all"} onValueChange={(v) => onAreaChange(v === "all" ? null : v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Areas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Areas</SelectItem>
          {AREAS.map((a) => (
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
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>{c.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
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
