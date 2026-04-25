/**
 * Hook for fetching and managing AI classification suggestions for custom jobs.
 *
 * NAMING NOTE: `suggested_category_slug` and `suggested_subcategory_slug`
 * store display names (e.g. "Carpentry"), NOT slugs. They map directly
 * to `jobs.category` / `jobs.subcategory` which also store display names.
 * Only `suggested_micro_slugs` contains actual slugs.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClassificationSuggestion {
  id: string;
  job_id: string;
  model_name: string;
  status: "pending" | "accepted" | "rejected";
  suggested_category_slug: string | null;
  suggested_subcategory_slug: string | null;
  suggested_micro_slugs: string[];
  confidence: number | null;
  reasoning_summary: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function useClassificationSuggestion(jobId: string | null) {
  return useQuery({
    queryKey: ["admin", "classification", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_classification_suggestions")
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ClassificationSuggestion | null;
    },
    enabled: !!jobId,
  });
}

export function useReviewClassification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      suggestionId,
      jobId,
      action,
      overrides,
    }: {
      suggestionId: string;
      jobId: string;
      action: "accepted" | "rejected";
      overrides?: {
        category?: string;
        subcategory?: string;
        micro_slugs?: string[];
      };
    }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update suggestion status
      const { error: updateErr } = await supabase
        .from("job_classification_suggestions")
        .update({
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", suggestionId);

      if (updateErr) throw updateErr;

      // If accepted, apply classification to the job
      if (action === "accepted") {
        // Fetch the suggestion to get values (or use overrides)
        const { data: suggestion } = await supabase
          .from("job_classification_suggestions")
          .select("*")
          .eq("id", suggestionId)
          .single();

        if (!suggestion) throw new Error("Suggestion not found");

        // Note: suggested_category_slug / suggested_subcategory_slug actually hold
        // display names (e.g. "Carpentry"), matching jobs.category / jobs.subcategory.
        // Only micro_slugs are real slugs.
        const category = overrides?.category ?? suggestion.suggested_category_slug;
        const subcategory = overrides?.subcategory ?? suggestion.suggested_subcategory_slug;
        const microSlugs = overrides?.micro_slugs ?? suggestion.suggested_micro_slugs ?? [];

        // Update job with accepted classification.
        // Note: jobs.micro_slug holds the primary (first) slug for backwards
        // compatibility. The full set of accepted slugs is fanned out to
        // job_micro_links automatically by the sync_job_micro_links_from_job
        // trigger (Phase 2B), which reads from both jobs.micro_slug and
        // jobs.answers.selected.microSlugs. We mirror microSlugs into
        // answers.selected.microSlugs so the trigger picks up multi-service
        // classifications, not just the primary slug.
        const { data: existing, error: fetchErr } = await supabase
          .from("jobs")
          .select("answers")
          .eq("id", jobId)
          .single();
        if (fetchErr) throw fetchErr;

        const nextAnswers = (() => {
          const base = (existing?.answers as Record<string, unknown> | null) ?? {};
          const selected = ((base as { selected?: Record<string, unknown> }).selected ?? {}) as Record<string, unknown>;
          return {
            ...base,
            selected: {
              ...selected,
              microSlugs: microSlugs,
            },
          };
        })();

        const { error: jobErr } = await supabase
          .from("jobs")
          .update({
            category,
            subcategory,
            micro_slug: microSlugs.length > 0 ? microSlugs[0] : null,
            answers: nextAnswers,
          })
          .eq("id", jobId);

        if (jobErr) throw jobErr;

        // Phase 2B: explicitly fan out ALL accepted micro_slugs into
        // job_micro_links so multi-service classifications are matched
        // correctly. The DB trigger also covers this, but writing here
        // makes the intent explicit and robust to future trigger changes.
        if (microSlugs.length > 0) {
          const rows = microSlugs
            .filter((s) => typeof s === "string" && s.trim().length > 0)
            .map((micro_slug) => ({ job_id: jobId, micro_slug }));
          if (rows.length > 0) {
            const { error: jmlErr } = await supabase
              .from("job_micro_links")
              .upsert(rows, { onConflict: "job_id,micro_slug", ignoreDuplicates: true });
            if (jmlErr) throw jmlErr;
          }
        }

        // Log admin action
        await supabase.from("admin_actions_log").insert({
          admin_user_id: user.id,
          action_type: "classify_custom_job",
          target_type: "job",
          target_id: jobId,
          metadata: {
            suggestion_id: suggestionId,
            applied_category: category,
            applied_subcategory: subcategory,
            applied_micro_slugs: microSlugs,
            had_overrides: !!overrides,
          },
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "classification", variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      toast.success(
        variables.action === "accepted"
          ? "Classification applied to job"
          : "Classification rejected"
      );
    },
    onError: (err) => {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    },
  });
}

/** Pending suggestions count for badges/indicators */
export function usePendingClassificationCount() {
  return useQuery({
    queryKey: ["admin", "classification", "pending_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("job_classification_suggestions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });
}
