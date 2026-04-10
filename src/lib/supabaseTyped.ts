/**
 * Typed helpers for Supabase tables and RPCs that exist in the database
 * but are not yet reflected in the auto-generated types file.
 *
 * Once the Supabase types regenerate to include these tables/RPCs,
 * this file can be deleted and callers can use supabase.from() / supabase.rpc() directly.
 */

import { supabase } from '@/integrations/supabase/client';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

// ── Table types ──────────────────────────────────────────────────────

export type DisputeRow = {
  id: string;
  job_id: string;
  milestone_label: string | null;
  raised_by: string;
  raised_by_role: string;
  issue_types: string[];
  secondary_tags: string[];
  status: string;
  summary_neutral: string | null;
  requested_outcome: string | null;
  ai_confidence_score: number | null;
  recommended_pathway: string | null;
  human_review_required: boolean;
  counterparty_id: string | null;
  counterparty_responded_at: string | null;
  resolution_type: string | null;
  resolution_description: string | null;
  resolution_accepted_at: string | null;
  evidence_deadline: string | null;
  response_deadline: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
};

export type DisputeInputRow = {
  id: string;
  dispute_id: string;
  user_id: string;
  input_type: string;
  raw_text: string | null;
  transcript: string | null;
  questionnaire_answers: Record<string, string> | null;
  voice_file_path: string | null;
  created_at: string;
};

export type DisputeEvidenceRow = {
  id: string;
  dispute_id: string;
  user_id: string;
  file_path: string;
  file_type: string;
  file_name: string | null;
  file_size_bytes: number | null;
  description: string | null;
  submitted_by_role: string | null;
  evidence_category: string;
  related_issue_type: string | null;
  is_visible_to_counterparty: boolean;
  created_at: string;
};

export type DisputeAnalysisRow = {
  id: string;
  dispute_id: string;
  issue_types: string[];
  agreed_facts: unknown[];
  disputed_points: unknown[];
  missing_evidence: unknown[];
  summary_neutral: string | null;
  suggested_pathway: string | null;
  confidence_score: number | null;
  requires_human_review: boolean;
  is_current: boolean;
  raw_ai_response: unknown | null;
  created_at: string;
};

export type DisputeStatusHistoryRow = {
  id: string;
  dispute_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  change_source: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type DisputeAiEventRow = {
  id: string;
  dispute_id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ClientReputationRow = {
  user_id: string;
  score: number;
  badges: string[];
  completion_rate: number;
  review_rate: number;
  dispute_rate: number;
  total_jobs: number;
  completed_jobs: number;
  repeat_hire_rate: number;
  avg_response_hours: number;
  updated_at: string;
};

// ── Typed table accessors ────────────────────────────────────────────
// These bypass the generic type parameter by returning PostgrestFilterBuilder
// with the correct row type.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function typedFrom<T extends Record<string, unknown>>(table: string): any {
  return supabase.from(table as any);
}

export const disputesTable = () => typedFrom<DisputeRow>('disputes');
export const disputeInputsTable = () => typedFrom<DisputeInputRow>('dispute_inputs');
export const disputeEvidenceTable = () => typedFrom<DisputeEvidenceRow>('dispute_evidence');
export const disputeAnalysisTable = () => typedFrom<DisputeAnalysisRow>('dispute_analysis');
export const disputeStatusHistoryTable = () => typedFrom<DisputeStatusHistoryRow>('dispute_status_history');
export const disputeAiEventsTable = () => typedFrom<DisputeAiEventRow>('dispute_ai_events');
export const clientReputationTable = () => typedFrom<ClientReputationRow>('client_reputation');

// ── Typed RPC caller ─────────────────────────────────────────────────
// For RPCs not in the generated types, wraps supabase.rpc with proper typing.

export function typedRpc<TResult = unknown>(fnName: string, params?: Record<string, unknown>) {
  return supabase.rpc(fnName as any, params as any) as unknown as
    Promise<{ data: TResult; error: null }> & { then: any; catch: any } &
    ReturnType<typeof supabase.rpc>;
}
