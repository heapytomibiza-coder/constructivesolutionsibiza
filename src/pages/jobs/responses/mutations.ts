/**
 * Track 5 — Response mutations.
 *
 * Thin wrappers around the existing RPCs. No backend changes; this layer
 * exists only to surface them to the UI with consistent invalidation.
 *
 * RPCs wired:
 *   express_interest         → pro: I'm interested
 *   link_quote_to_response   → pro: attach quote (called after submit_quote_with_items)
 *   withdraw_response        → pro: pull out
 *   shortlist_response       → client: bookmark a pro
 *   accept_response          → client: hire
 *   decline_response         → client: politely decline
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { responseKeys } from "./queries/keys";
import { quoteKeys } from "@/pages/jobs/queries/quotes.query";
import { jobKeys } from "@/pages/jobs/queries/keys";

interface JobScopedVars {
  jobId: string;
}

interface ResponseScopedVars {
  responseId: string;
  jobId: string;
}

function invalidateResponseScope(qc: ReturnType<typeof useQueryClient>, jobId: string) {
  qc.invalidateQueries({ queryKey: responseKeys.forJob(jobId) });
  qc.invalidateQueries({ queryKey: responseKeys.all });
  qc.invalidateQueries({ queryKey: quoteKeys.forJob(jobId) });
  qc.invalidateQueries({ queryKey: jobKeys.details(jobId) });
}

export function useExpressInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, message }: JobScopedVars & { message?: string }) => {
      const { data, error } = await supabase.rpc("express_interest", {
        p_job_id: jobId,
        p_message: message,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_data, vars) => invalidateResponseScope(qc, vars.jobId),
  });
}

export function useLinkQuoteToResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, quoteId }: JobScopedVars & { quoteId: string }) => {
      const { data, error } = await supabase.rpc("link_quote_to_response", {
        p_job_id: jobId,
        p_quote_id: quoteId,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_data, vars) => invalidateResponseScope(qc, vars.jobId),
  });
}

export function useWithdrawResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, reason }: JobScopedVars & { reason?: string }) => {
      const { data, error } = await supabase.rpc("withdraw_response", {
        p_job_id: jobId,
        p_reason: reason,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_data, vars) => invalidateResponseScope(qc, vars.jobId),
  });
}

export function useShortlistResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ responseId }: ResponseScopedVars) => {
      const { data, error } = await supabase.rpc("shortlist_response", {
        p_response_id: responseId,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_data, vars) => invalidateResponseScope(qc, vars.jobId),
  });
}

export function useDeclineResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      responseId,
      jobId: _jobId,
      reason,
    }: ResponseScopedVars & { reason?: string }) => {
      const { data, error } = await supabase.rpc("decline_response", {
        p_response_id: responseId,
        p_reason: reason,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_data, vars) => invalidateResponseScope(qc, vars.jobId),
  });
}

export function useAcceptResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ responseId }: ResponseScopedVars) => {
      const { data, error } = await supabase.rpc("accept_response", {
        _response_id: responseId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => invalidateResponseScope(qc, vars.jobId),
  });
}
