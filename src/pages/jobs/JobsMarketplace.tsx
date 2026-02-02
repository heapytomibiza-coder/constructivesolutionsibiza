import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobListingCard } from "@/pages/jobs/JobListingCard";
import { Loader2, FilterX } from "lucide-react";
import type { JobsBoardRow } from "@/pages/jobs/types";

type Filters = {
  search: string;
  categories: string[];
  location: string;
  hasPhotos: boolean;
  highBudget: boolean;
  newToday: boolean;
  budgetRange: [number, number];
};

function budgetProxy(j: JobsBoardRow): number {
  return (j.budget_value ?? j.budget_max ?? j.budget_min ?? 0) as number;
}

function isNewToday(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

function applyFilters(jobs: JobsBoardRow[], f: Filters): JobsBoardRow[] {
  const needle = f.search.trim().toLowerCase();
  const locNeedle = f.location.trim().toLowerCase();

  return jobs.filter((j) => {
    if (needle) {
      const hay = `${j.title ?? ""} ${j.teaser ?? ""}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }

    if (f.categories.length) {
      if (!j.category || !f.categories.includes(j.category)) return false;
    }

    if (locNeedle) {
      const area = (j.area ?? j.location?.area ?? "").toLowerCase();
      const town = (j.location?.town ?? "").toLowerCase();
      if (!area.includes(locNeedle) && !town.includes(locNeedle)) return false;
    }

    const b = budgetProxy(j);
    const [minB, maxB] = f.budgetRange;
    if (b < minB || b > maxB) return false;

    if (f.hasPhotos && !j.has_photos) return false;
    if (f.highBudget && budgetProxy(j) < 500) return false;
    if (f.newToday && !isNewToday(j.created_at)) return false;

    return true;
  });
}

function featuredPredicate(j: JobsBoardRow): boolean {
  return isNewToday(j.created_at) && budgetProxy(j) >= 500 && !!j.has_photos;
}

async function fetchJobsBoard(): Promise<JobsBoardRow[]> {
  const { data, error } = await supabase
    .from("jobs_board")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data ?? []) as JobsBoardRow[];
}

export function JobsMarketplace() {
  const [filters, setFilters] = React.useState<Filters>({
    search: "",
    categories: [],
    location: "",
    hasPhotos: false,
    highBudget: false,
    newToday: false,
    budgetRange: [0, 5000],
  });

  const { data: jobs, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["jobs_board"],
    queryFn: fetchJobsBoard,
    staleTime: 30_000,
  });

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    (jobs ?? []).forEach((j) => j.category && set.add(j.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const filtered = React.useMemo(() => applyFilters(jobs ?? [], filters), [jobs, filters]);

  const featured = React.useMemo(() => filtered.filter(featuredPredicate).slice(0, 3), [filtered]);
  const featuredIds = React.useMemo(() => new Set(featured.map((j) => j.id)), [featured]);
  const regular = React.useMemo(() => filtered.filter((j) => !featuredIds.has(j.id)), [filtered, featuredIds]);

  const clearFilters = () => {
    setFilters({
      search: "",
      categories: [],
      location: "",
      hasPhotos: false,
      highBudget: false,
      newToday: false,
      budgetRange: [0, 5000],
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading jobs…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-destructive">
          Failed to load jobs: {(error as Error)?.message ?? "Unknown error"}
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main */}
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search jobs (e.g. plumbing, shelves, leak)…"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            className="flex-1"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.newToday ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters((p) => ({ ...p, newToday: !p.newToday }))}
            >
              New today
            </Button>
            <Button
              variant={filters.highBudget ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFilters((p) => ({
                  ...p,
                  highBudget: !p.highBudget,
                  budgetRange: !p.highBudget ? [500, p.budgetRange[1]] : p.budgetRange,
                }))
              }
            >
              High budget
            </Button>
            <Button
              variant={filters.hasPhotos ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters((p) => ({ ...p, hasPhotos: !p.hasPhotos }))}
            >
              Photos
            </Button>
          </div>
        </div>

        {featured.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Featured</h2>
              <Badge variant="secondary">Top {featured.length}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {featured.map((job) => (
                <JobListingCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Jobs</h2>
            <Badge variant="secondary">{regular.length} results</Badge>
          </div>

          {regular.length === 0 ? (
            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              No jobs match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {regular.map((job) => (
                <JobListingCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-4 rounded-xl border p-4 h-fit">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Filters</div>
            <div className="text-xs text-muted-foreground">Client-side filtering</div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
            <FilterX className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Location</div>
          <Input
            placeholder="e.g. San Antonio"
            value={filters.location}
            onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Categories</div>
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
                      categories: active ? p.categories.filter((x) => x !== c) : [...p.categories, c],
                    }))
                  }
                >
                  {c}
                </Button>
              );
            })}
            {categories.length === 0 && (
              <div className="text-xs text-muted-foreground">No categories found.</div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Budget range (€)</div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.budgetRange[0] || ""}
              onChange={(e) =>
                setFilters((p) => ({ ...p, budgetRange: [Number(e.target.value || 0), p.budgetRange[1]] }))
              }
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.budgetRange[1] || ""}
              onChange={(e) =>
                setFilters((p) => ({ ...p, budgetRange: [p.budgetRange[0], Number(e.target.value || 5000)] }))
              }
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
