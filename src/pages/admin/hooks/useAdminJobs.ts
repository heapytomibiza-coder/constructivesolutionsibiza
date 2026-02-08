/**
 * Admin Jobs Hook
 * Fetches jobs for admin moderation with filtering by status and flags.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { JobsBoardRow } from "@/pages/jobs/types";

export type AdminJobsFilter = "all" | "flagged" | "open" | "in_progress" | "completed" | "archived";

interface UseAdminJobsOptions {
  filter?: AdminJobsFilter;
  search?: string;
}

async function fetchAdminJobs(filter: AdminJobsFilter, search: string): Promise<JobsBoardRow[]> {
  let query = supabase
    .from("jobs")
    .select(`
      id,
      title,
      teaser,
      category,
      subcategory,
      micro_slug,
      area,
      location,
      budget_type,
      budget_value,
      budget_min,
      budget_max,
      start_timing,
      start_date,
      has_photos,
      highlights,
      created_at,
      updated_at,
      status,
      is_publicly_listed,
      flags,
      computed_inspection_bias,
      computed_safety
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  // Apply status filter
  switch (filter) {
    case "flagged":
      // Jobs with any flags (safety concerns, etc.)
      query = query.not("flags", "is", null).neq("flags", []);
      break;
    case "open":
      query = query.eq("status", "open");
      break;
    case "in_progress":
      query = query.eq("status", "in_progress");
      break;
    case "completed":
      query = query.eq("status", "completed");
      break;
    case "archived":
      query = query.eq("status", "archived");
      break;
    // "all" - no filter
  }

  const { data, error } = await query;

  if (error) throw error;

  let jobs = (data ?? []) as JobsBoardRow[];

  // Client-side search filter
  if (search.trim()) {
    const term = search.toLowerCase();
    jobs = jobs.filter(
      (job) =>
        job.title?.toLowerCase().includes(term) ||
        job.category?.toLowerCase().includes(term) ||
        job.subcategory?.toLowerCase().includes(term) ||
        job.area?.toLowerCase().includes(term)
    );
  }

  return jobs;
}

export function useAdminJobs(options: UseAdminJobsOptions = {}) {
  const { filter = "all", search = "" } = options;

  return useQuery({
    queryKey: ["admin", "jobs", filter, search],
    queryFn: () => fetchAdminJobs(filter, search),
    staleTime: 30_000,
  });
}
