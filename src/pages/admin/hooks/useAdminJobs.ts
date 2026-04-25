/**
 * Admin Jobs Hook
 * Fetches jobs for admin moderation with filtering by status and flags.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { JobsBoardRow } from "@/pages/jobs/types";

export type AdminJobsFilter = "all" | "flagged" | "open" | "in_progress" | "completed" | "archived" | "needs_quote" | "custom" | "unclassified_custom";

interface UseAdminJobsOptions {
  filter?: AdminJobsFilter;
  search?: string;
}

export interface AdminJobRow extends JobsBoardRow {
  conversation_count?: number;
  quote_count?: number;
  needs_quote?: boolean;
}

async function fetchAdminJobs(filter: AdminJobsFilter, search: string): Promise<AdminJobRow[]> {
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
      is_custom_request,
      flags,
      computed_inspection_bias,
      computed_safety,
      source_lang,
      title_i18n,
      teaser_i18n
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  // For needs_quote, we filter open jobs then do client-side filtering
  switch (filter) {
    case "flagged":
      query = query.not("flags", "is", null).neq("flags", []);
      break;
    case "open":
    case "needs_quote":
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
    case "custom":
      query = query.eq("is_custom_request", true);
      break;
  }

  const { data, error } = await query;
  if (error) throw error;

  let jobs = (data ?? []) as unknown as AdminJobRow[];

  // Enrich with conversation and quote counts for all jobs
  if (jobs.length > 0) {
    const jobIds = jobs.map(j => j.id);

    const [convsRes, quotesRes] = await Promise.all([
      supabase.from("conversations").select("job_id").in("job_id", jobIds),
      supabase.from("quotes").select("job_id").in("job_id", jobIds),
    ]);

    const convCounts = new Map<string, number>();
    (convsRes.data ?? []).forEach(c => {
      convCounts.set(c.job_id, (convCounts.get(c.job_id) ?? 0) + 1);
    });

    const quoteCounts = new Map<string, number>();
    (quotesRes.data ?? []).forEach(q => {
      quoteCounts.set(q.job_id, (quoteCounts.get(q.job_id) ?? 0) + 1);
    });

    jobs = jobs.map(j => {
      const cc = convCounts.get(j.id) ?? 0;
      const qc = quoteCounts.get(j.id) ?? 0;
      return {
        ...j,
        conversation_count: cc,
        quote_count: qc,
        needs_quote: j.status === 'open' && cc > 0 && qc === 0,
      };
    });
  }

  // Apply needs_quote filter
  if (filter === "needs_quote") {
    jobs = jobs.filter(j => j.needs_quote);
  }

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
