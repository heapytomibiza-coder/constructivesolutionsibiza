/**
 * Admin dispute inbox query
 */
import { supabase } from "@/integrations/supabase/client";

export interface AdminDisputeRow {
  id: string;
  job_id: string;
  raised_by: string;
  raised_by_role: string;
  counterparty_id: string | null;
  issue_types: string[];
  status: string;
  summary_neutral: string | null;
  requested_outcome: string | null;
  ai_confidence_score: number | null;
  recommended_pathway: string | null;
  human_review_required: boolean;
  counterparty_responded_at: string | null;
  response_deadline: string | null;
  evidence_deadline: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  job_title: string | null;
  job_category: string | null;
  job_budget_value: number | null;
  job_area: string | null;
  raiser_name: string;
  counterparty_name: string | null;
  evidence_count: number;
  input_count: number;
  analysis_exists: boolean;
  age_hours: number;
  completeness_level: string;
}

export async function fetchAdminDisputes(): Promise<AdminDisputeRow[]> {
  const { data, error } = await supabase.rpc('rpc_admin_dispute_inbox');
  if (error) throw error;
  return (data as unknown as AdminDisputeRow[]) ?? [];
}
