import { supabase } from '@/integrations/supabase/client';
import {
  disputesTable,
  disputeInputsTable,
  disputeEvidenceTable,
  disputeAnalysisTable,
  disputeStatusHistoryTable,
  disputeAiEventsTable,
} from '@/lib/supabaseTyped';
import type { DisputeRow, DisputeInputRow, DisputeEvidenceRow, DisputeAnalysisRow, DisputeStatusHistoryRow, DisputeAiEventRow } from '@/lib/supabaseTyped';

export interface DisputeWithJob extends DisputeRow {
  jobs: { title: string; category: string | null; area: string | null };
}

export interface DisputeDetailWithJob extends DisputeRow {
  jobs: {
    title: string;
    category: string | null;
    area: string | null;
    description: string | null;
    user_id: string;
    assigned_professional_id: string | null;
  };
}

export interface DisputeDetailResult {
  dispute: DisputeDetailWithJob;
  inputs: DisputeInputRow[];
  evidence: DisputeEvidenceRow[];
  analysis: DisputeAnalysisRow | null;
  history: DisputeStatusHistoryRow[];
  aiEvents: DisputeAiEventRow[];
}

export async function fetchUserDisputes(): Promise<DisputeWithJob[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await disputesTable()
    .select('*, jobs!inner(title, category, area)')
    .or(`raised_by.eq.${user.id},counterparty_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as DisputeWithJob[];
}

export async function fetchDisputeDetail(disputeId: string): Promise<DisputeDetailResult> {
  const { data: dispute, error } = await disputesTable()
    .select('*, jobs!inner(title, category, area, description, user_id, assigned_professional_id)')
    .eq('id', disputeId)
    .single();

  if (error) throw error;

  const [inputsRes, evidenceRes, analysisRes, historyRes, aiEventsRes] = await Promise.all([
    disputeInputsTable().select('*').eq('dispute_id', disputeId).order('created_at'),
    disputeEvidenceTable().select('*').eq('dispute_id', disputeId).order('created_at'),
    disputeAnalysisTable().select('*').eq('dispute_id', disputeId).order('created_at', { ascending: false }).limit(1),
    disputeStatusHistoryTable().select('*').eq('dispute_id', disputeId).order('created_at'),
    disputeAiEventsTable().select('*').eq('dispute_id', disputeId).order('created_at'),
  ]);

  return {
    dispute: dispute as unknown as DisputeDetailWithJob,
    inputs: (inputsRes.data ?? []) as unknown as DisputeInputRow[],
    evidence: (evidenceRes.data ?? []) as unknown as DisputeEvidenceRow[],
    analysis: ((analysisRes.data ?? []) as unknown as DisputeAnalysisRow[])[0] ?? null,
    history: (historyRes.data ?? []) as unknown as DisputeStatusHistoryRow[],
    aiEvents: (aiEventsRes.data ?? []) as unknown as DisputeAiEventRow[],
  };
}
