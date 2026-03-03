/**
 * Quote queries for the jobs domain.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Quote } from "../types";

export const quoteKeys = {
  forJob: (jobId: string) => ["quotes", "job", jobId] as const,
  myQuote: (jobId: string) => ["quotes", "mine", jobId] as const,
};

/**
 * Fetch all quotes for a job (client view).
 */
export function useQuotesForJob(jobId: string | null, enabled = true) {
  return useQuery({
    queryKey: quoteKeys.forJob(jobId ?? "none"),
    queryFn: async (): Promise<Quote[]> => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from("quotes")
        .select("*, quote_line_items(*)")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map((q: any) => ({
        ...q,
        line_items: q.quote_line_items ?? [],
      })) as Quote[];
    },
    enabled: enabled && !!jobId,
  });
}

/**
 * Fetch current user's quote for a job (pro view).
 */
export function useMyQuoteForJob(jobId: string | null, userId: string | null, enabled = true) {
  return useQuery({
    queryKey: quoteKeys.myQuote(jobId ?? "none"),
    queryFn: async (): Promise<Quote | null> => {
      if (!jobId || !userId) return null;
      const { data, error } = await supabase
        .from("quotes")
        .select("*, quote_line_items(*)")
        .eq("job_id", jobId)
        .eq("professional_id", userId)
        .order("revision_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Treat 403 (RLS denial) as "no quote" instead of crashing
      if (error) {
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          return null;
        }
        throw error;
      }
      if (!data) return null;
      return { ...data, line_items: (data as any).quote_line_items ?? [] } as Quote;
    },
    enabled: enabled && !!jobId && !!userId,
  });
}
