import * as React from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { JobListingCard } from "@/pages/jobs/JobListingCard";
import { Loader2, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/shared/components/EmptyState";
import { useSession } from "@/contexts/SessionContext";
import { useJobsBoard, useMatchedJobs } from "./queries";
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

export function JobsMarketplace() {
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeRole } = useSession();
  const { t } = useTranslation("jobs");
  
  const showMatchedOnly = searchParams.get("matched") === "true";
  const isProfessional = activeRole === "professional";

  const { data: allJobs, isLoading: allJobsLoading, isError: allJobsError, error: allJobsErrorData, refetch: refetchAllJobs } = useJobsBoard();
  const { matchedJobs, isLoading: matchedJobsLoading, isError: matchedJobsError, error: matchedJobsErrorData, refetch: refetchMatchedJobs } = useMatchedJobs();

  const isLoading = showMatchedOnly && isProfessional ? matchedJobsLoading : allJobsLoading;
  const isError = showMatchedOnly && isProfessional ? matchedJobsError : allJobsError;
  const error = showMatchedOnly && isProfessional ? matchedJobsErrorData : allJobsErrorData;
  const jobs = showMatchedOnly && isProfessional ? matchedJobs : allJobs;
  const refetch = showMatchedOnly && isProfessional ? refetchMatchedJobs : refetchAllJobs;

  const toggleMatchedFilter = React.useCallback(() => {
    if (showMatchedOnly) {
      searchParams.delete("matched");
    } else {
      searchParams.set("matched", "true");
    }
    setSearchParams(searchParams);
  }, [showMatchedOnly, searchParams, setSearchParams]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    (jobs ?? []).forEach((j) => j.category && set.add(j.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const filtered = React.useMemo(() => applyFilters(jobs ?? [], filters), [jobs, filters]);

  const activeJobs = filtered.length;
  const todayJobs = React.useMemo(() => filtered.filter((j) => isNewToday(j.created_at)).length, [filtered]);
  const totalBudget = React.useMemo(() => filtered.reduce((sum, j) => sum + budgetProxy(j), 0), [filtered]);

  const regular = filtered;

  const handleToggle = React.useCallback((key: keyof HeroToggles) => {
    setFilters((p) => {
      const newValue = !p[key];
      if (key === "highBudget") {
        return { ...p, highBudget: newValue, budgetRange: newValue ? [500, p.budgetRange[1]] : [0, p.budgetRange[1]] };
      }
      return { ...p, [key]: newValue };
    });
  }, []);

  const clearFilters = React.useCallback(() => setFilters(EMPTY_FILTERS), []);

  // Highlight newly posted job
  const location = useLocation();
  const highlightId = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("highlight");
  }, [location.search]);

  React.useEffect(() => {
    if (!highlightId || isLoading) return;
    const selector = `[data-job-id="${CSS.escape(highlightId)}"]`;
    const start = Date.now();
    let timeoutId: number | undefined;
    const tick = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary");
        timeoutId = window.setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 3000);
        return;
      }
      if (Date.now() - start < 1000) requestAnimationFrame(tick);
    };
    tick();
    return () => { if (timeoutId !== undefined) window.clearTimeout(timeoutId); };
  }, [highlightId, isLoading, jobs]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('board.loading')}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3 py-12 text-center">
        <div className="text-sm text-destructive">
          {t('board.loadError', { error: (error as Error)?.message ?? t('detail.unknownError') })}
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          {t('board.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <JobBoardHeroSection
        search={filters.search}
        onSearchChange={(v) => setFilters((p) => ({ ...p, search: v }))}
        toggles={{ newToday: filters.newToday, highBudget: filters.highBudget, hasPhotos: filters.hasPhotos, asapOnly: filters.asapOnly }}
        onToggle={handleToggle}
      />

      {isProfessional && (
        <div className="flex items-center gap-2">
          <Button variant={showMatchedOnly ? "default" : "outline"} size="sm" onClick={toggleMatchedFilter} className="gap-2">
            <Filter className="h-4 w-4" />
            {showMatchedOnly ? t('board.showingMatched') : t('board.showMatchedOnly')}
          </Button>
          {showMatchedOnly && (
            <span className="text-sm text-muted-foreground">{t('board.showingMatchedHint')}</span>
          )}
        </div>
      )}

      <JobBoardStatsBar activeJobs={activeJobs} todayJobs={todayJobs} totalBudget={totalBudget} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {showMatchedOnly && isProfessional ? t('board.matchedJobs') : t('board.jobs')}
              </h2>
              <Badge variant="secondary">{t('board.results', { count: regular.length })}</Badge>
            </div>

            {regular.length === 0 ? (
              <EmptyState
                icon={<Search className="h-8 w-8" />}
                message={
                  showMatchedOnly && isProfessional
                    ? t('board.noMatchedJobs')
                    : t('board.noJobsFiltered')
                }
                action={
                  showMatchedOnly && isProfessional ? (
                    <Button variant="link" className="p-0 h-auto" onClick={toggleMatchedFilter}>
                      {t('board.viewAllJobs')}
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={clearFilters}>
                      {t('board.clearFilters')}
                    </Button>
                  )
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {regular.map((job) => (
                  <JobListingCard key={job.id} job={job} isMatched={showMatchedOnly && isProfessional} />
                ))}
              </div>
            )}
          </div>
        </div>

        <JobFiltersPanel categories={categories} filters={filters} setFilters={setFilters} onClear={clearFilters} />
      </div>
    </div>
  );
}
