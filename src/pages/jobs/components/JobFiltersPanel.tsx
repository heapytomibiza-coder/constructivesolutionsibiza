import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterX } from "lucide-react";

export type Filters = {
  search: string;
  categories: string[];
  location: string;
  budgetRange: [number, number];
  hasPhotos: boolean;
  highBudget: boolean;
  newToday: boolean;
  asapOnly: boolean;
};

export const EMPTY_FILTERS: Filters = {
  search: "",
  categories: [],
  location: "",
  budgetRange: [0, 5000],
  hasPhotos: false,
  highBudget: false,
  newToday: false,
  asapOnly: false,
};

export function activeFilterCount(f: Filters): number {
  return (
    f.categories.length +
    (f.location.trim() ? 1 : 0) +
    (f.budgetRange[0] > 0 || f.budgetRange[1] < 5000 ? 1 : 0) +
    (f.hasPhotos ? 1 : 0) +
    (f.highBudget ? 1 : 0) +
    (f.newToday ? 1 : 0) +
    (f.asapOnly ? 1 : 0)
  );
}

interface JobFiltersPanelProps {
  categories: string[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onClear: () => void;
}

export function JobFiltersPanel({
  categories,
  filters,
  setFilters,
  onClear,
}: JobFiltersPanelProps) {
  const { t } = useTranslation("jobs");
  const count = activeFilterCount(filters);

  return (
    <aside className="space-y-4 rounded-xl border p-4 h-fit">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">{t('filters.title')}</div>
          {count > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {count}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClear} title={t('filters.clearFilters')}>
          <FilterX className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">{t('filters.location')}</div>
        <Input
          placeholder={t('filters.locationPlaceholder')}
          value={filters.location}
          onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">{t('filters.categories')}</div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = filters.categories.includes(c);
            return (
              <Button
                key={c}
                type="button"
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setFilters((p) => ({
                    ...p,
                    categories: active
                      ? p.categories.filter((x) => x !== c)
                      : [...p.categories, c],
                  }))
                }
              >
                {c}
              </Button>
            );
          })}
          {categories.length === 0 && (
            <div className="text-xs text-muted-foreground">{t('filters.noCategories')}</div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">{t('filters.budgetRange')}</div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder={t('filters.min')}
            value={filters.budgetRange[0] || ""}
            onChange={(e) =>
              setFilters((p) => ({
                ...p,
                budgetRange: [Number(e.target.value || 0), p.budgetRange[1]],
              }))
            }
          />
          <span className="text-xs text-muted-foreground">{t('filters.to')}</span>
          <Input
            type="number"
            placeholder={t('filters.max')}
            value={filters.budgetRange[1] || ""}
            onChange={(e) =>
              setFilters((p) => ({
                ...p,
                budgetRange: [p.budgetRange[0], Number(e.target.value || 5000)],
              }))
            }
          />
        </div>
      </div>
    </aside>
  );
}
