import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { JobListingCard } from "@/pages/jobs/JobListingCard";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobsBoardRow } from "@/pages/jobs/types";
import {
  JobBoardHeroSection,
  JobBoardStatsBar,
  JobFiltersPanel,
  EMPTY_FILTERS,
  type Filters,
  type HeroToggles,
} from "./components";

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
    if (f.highBudget && b < 500) return false;
    if (f.newToday && !isNewToday(j.created_at)) return false;
    if (f.asapOnly && j.start_timing !== "asap") return false;

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
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);

  const { data: jobs, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["jobs_board"],
    queryFn: fetchJobsBoard,
    staleTime: 30_000,
  });

  // Extract categories
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    (jobs ?? []).forEach((j) => j.category && set.add(j.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  // Apply filters
  const filtered = React.useMemo(() => applyFilters(jobs ?? [], filters), [jobs, filters]);

  // Compute stats from filtered jobs (so stats match what user sees)
  const activeJobs = filtered.length;
  const todayJobs = React.useMemo(
    () => filtered.filter((j) => isNewToday(j.created_at)).length,
    [filtered]
  );
  const totalBudget = React.useMemo(
    () => filtered.reduce((sum, j) => sum + budgetProxy(j), 0),
    [filtered]
  );

  // Featured vs regular
  const featured = React.useMemo(() => filtered.filter(featuredPredicate).slice(0, 3), [filtered]);
  const featuredIds = React.useMemo(() => new Set(featured.map((j) => j.id)), [featured]);
  const regular = React.useMemo(
    () => filtered.filter((j) => !featuredIds.has(j.id)),
    [filtered, featuredIds]
  );

  // Hero toggle handler
  const handleToggle = React.useCallback((key: keyof HeroToggles) => {
    setFilters((p) => {
      const newValue = !p[key];
      // Sync highBudget with budgetRange minimum
      if (key === "highBudget") {
        return {
          ...p,
          highBudget: newValue,
          budgetRange: newValue ? [500, p.budgetRange[1]] : [0, p.budgetRange[1]],
        };
      }
      return { ...p, [key]: newValue };
    });
  }, []);

  const clearFilters = React.useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, []);

  // Highlight newly posted job from wizard
  const params = new URLSearchParams(window.location.search);
  const highlightId = params.get("highlight");

  React.useEffect(() => {
    if (!highlightId || isLoading) return;

    const el = document.querySelector(`[data-job-id="${highlightId}"]`) as HTMLElement | null;
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary");
    const t = window.setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 3000);
    return () => window.clearTimeout(t);
  }, [highlightId, jobs, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading jobs…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3 py-12 text-center">
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
    <div className="space-y-6">
      {/* Hero with search and quick toggles */}
      <JobBoardHeroSection
        search={filters.search}
        onSearchChange={(v) => setFilters((p) => ({ ...p, search: v }))}
        toggles={{
          newToday: filters.newToday,
          highBudget: filters.highBudget,
          hasPhotos: filters.hasPhotos,
          asapOnly: filters.asapOnly,
        }}
        onToggle={handleToggle}
      />

      {/* Stats bar */}
      <JobBoardStatsBar activeJobs={activeJobs} todayJobs={todayJobs} totalBudget={totalBudget} />

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Jobs column */}
        <div className="space-y-6">
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

        {/* Filters sidebar */}
        <JobFiltersPanel
          categories={categories}
          filters={filters}
          setFilters={setFilters}
          onClear={clearFilters}
        />
      </div>
    </div>
  );
}
