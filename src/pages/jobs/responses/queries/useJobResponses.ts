/**
 * useJobResponses — client-side inbox query.
 *
 * Fetches all responses for a job and enriches each with a lightweight
 * professional + quote snapshot. RLS enforces that only the job owner (or
 * an admin) can read the rows; the page-level guard mirrors this in UI.
 *
 * RPC contract: read-only, no writes here. All mutations live in mutations.ts.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { responseKeys } from "./keys";
import type {
  EnrichedResponse,
  ResponseProSummary,
  ResponseQuoteSummary,
  ResponseRow,
} from "../types";

interface QuoteJoin {
  id: string;
  price_type: string | null;
  price_fixed: number | null;
  price_min: number | null;
  price_max: number | null;
  total: number | null;
  status: string | null;
}

interface ProProfileJoin {
  user_id: string;
  display_name: string | null;
  business_name: string | null;
  avatar_url: string | null;
  rating_average: number | null;
  reviews_count: number | null;
  verification_status: string | null;
}

export function useJobResponses(jobId: string | null, enabled = true) {
  return useQuery({
    queryKey: jobId ? responseKeys.forJob(jobId) : ["responses", "job", "none"],
    enabled: enabled && !!jobId,
    queryFn: async (): Promise<EnrichedResponse[]> => {
      if (!jobId) return [];

      const { data: rows, error } = await supabase
        .from("job_responses")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const responses = (rows ?? []) as ResponseRow[];
      if (responses.length === 0) return [];

      const proIds = Array.from(new Set(responses.map((r) => r.professional_id)));
      const quoteIds = responses
        .map((r) => r.quote_id)
        .filter((id): id is string => !!id);

      const [prosResult, quotesResult] = await Promise.all([
        supabase
          .from("professional_profiles")
          .select(
            "user_id, display_name, business_name, avatar_url, rating_average, reviews_count, verification_status"
          )
          .in("user_id", proIds),
        quoteIds.length > 0
          ? supabase
              .from("quotes")
              .select("id, price_type, price_fixed, price_min, price_max, total, status")
              .in("id", quoteIds)
          : Promise.resolve({ data: [] as QuoteJoin[], error: null }),
      ]);

      // Best-effort enrichment — RLS gaps degrade gracefully to null
      const proById = new Map<string, ResponseProSummary>();
      if (!prosResult.error && prosResult.data) {
        for (const p of prosResult.data as ProProfileJoin[]) {
          proById.set(p.user_id, {
            professionalId: p.user_id,
            displayName: p.display_name,
            businessName: p.business_name,
            avatarUrl: p.avatar_url,
            rating: p.rating_average,
            reviewsCount: p.reviews_count,
            isVerified: p.verification_status === "verified",
          });
        }
      }

      const quoteById = new Map<string, ResponseQuoteSummary>();
      if (!quotesResult.error && quotesResult.data) {
        for (const q of quotesResult.data as QuoteJoin[]) {
          quoteById.set(q.id, {
            quoteId: q.id,
            priceType: q.price_type,
            priceFixed: q.price_fixed,
            priceMin: q.price_min,
            priceMax: q.price_max,
            total: q.total,
            status: q.status,
          });
        }
      }

      return responses.map((r) => ({
        response: r,
        pro: proById.get(r.professional_id) ?? null,
        quote: r.quote_id ? quoteById.get(r.quote_id) ?? null : null,
      }));
    },
  });
}
