/**
 * Track 5 — Response domain types.
 *
 * Mirrors the `job_responses` Row from generated Supabase types,
 * plus a frontend-only enriched shape used by the client inbox.
 */

import type { Database } from "@/integrations/supabase/types";

export type ResponseRow = Database["public"]["Tables"]["job_responses"]["Row"];

/** Lifecycle states as written by the RPCs. UI-only never invents new ones. */
export type ResponseStatus =
  | "interested"
  | "quoted"
  | "shortlisted"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "expired";

/** Lightweight pro snapshot for displaying a response card. */
export interface ResponseProSummary {
  professionalId: string;
  displayName: string | null;
  businessName: string | null;
  avatarUrl: string | null;
  rating: number | null;
  reviewsCount: number | null;
  isVerified: boolean;
}

/** Lightweight quote snapshot used to surface price on a response card. */
export interface ResponseQuoteSummary {
  quoteId: string;
  priceType: string | null;
  priceFixed: number | null;
  priceMin: number | null;
  priceMax: number | null;
  total: number | null;
  status: string | null;
}

/** Enriched response for the client-side inbox. */
export interface EnrichedResponse {
  response: ResponseRow;
  pro: ResponseProSummary | null;
  quote: ResponseQuoteSummary | null;
}
