import { supabase } from '@/integrations/supabase/client';
import type { DisputeIssueType } from '../types';
import { ESCROW_GUARDRAILS } from '@/domain/escrowGuardrails';

interface CreateDisputeParams {
  job_id: string;
  issue_types: DisputeIssueType[];
  requested_outcome: string;
  description: string;
  questionnaire_answers: Record<string, string>;
}

export async function createDispute(params: CreateDisputeParams) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get counterparty from job
  const { data: job } = await supabase
    .from('jobs')
    .select('user_id, assigned_professional_id')
    .eq('id', params.job_id)
    .single();

  if (!job) throw new Error('Job not found');

  const isClient = job.user_id === user.id;
  const counterpartyId = isClient ? job.assigned_professional_id : job.user_id;

  const evidenceDeadlineMs = ESCROW_GUARDRAILS.autoProgressionHours * 60 * 60 * 1000;
  const responseDeadlineMs = ESCROW_GUARDRAILS.responseWarningHours * 2 * 60 * 60 * 1000; // 96h (2x warning window)

  // Create dispute — skip 'open' and go straight to 'awaiting_counterparty'
  // since we always have a counterparty identified from the job
  const { data: dispute, error } = await supabase
    .from('disputes' as any)
    .insert({
      job_id: params.job_id,
      raised_by: user.id,
      raised_by_role: isClient ? 'client' : 'professional',
      issue_types: params.issue_types,
      requested_outcome: params.requested_outcome,
      counterparty_id: counterpartyId,
      status: 'awaiting_counterparty',
      evidence_deadline: new Date(Date.now() + evidenceDeadlineMs).toISOString(),
      response_deadline: new Date(Date.now() + responseDeadlineMs).toISOString(),
    } as any)
    .select()
    .single();

  if (error) throw error;

  // Add questionnaire input
  if (params.questionnaire_answers && Object.keys(params.questionnaire_answers).length > 0) {
    await supabase.from('dispute_inputs' as any).insert({
      dispute_id: (dispute as any).id,
      user_id: user.id,
      input_type: 'multiple_choice',
      questionnaire_answers: params.questionnaire_answers,
    } as any);
  }

  // Add description as text input
  if (params.description) {
    await supabase.from('dispute_inputs' as any).insert({
      dispute_id: (dispute as any).id,
      user_id: user.id,
      input_type: 'text',
      raw_text: params.description,
    } as any);
  }

  return dispute as any;
}
