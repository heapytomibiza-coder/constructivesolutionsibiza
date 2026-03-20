import { supabase } from '@/integrations/supabase/client';

interface SubmitResponseParams {
  disputeId: string;
  responseText: string;
  questionnaireAnswers: Record<string, string>;
}

export async function submitCounterpartyResponse(params: SubmitResponseParams) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify user is the counterparty
  const { data: dispute } = await supabase
    .from('disputes' as any)
    .select('counterparty_id, raised_by, status')
    .eq('id', params.disputeId)
    .single();

  if (!dispute) throw new Error('Dispute not found');
  const d = dispute as any;
  if (d.counterparty_id !== user.id) {
    throw new Error('Only the counterparty can submit a response via this route');
  }

  // Add questionnaire response
  if (params.questionnaireAnswers && Object.keys(params.questionnaireAnswers).length > 0) {
    const { error: qErr } = await supabase.from('dispute_inputs' as any).insert({
      dispute_id: params.disputeId,
      user_id: user.id,
      input_type: 'multiple_choice',
      questionnaire_answers: params.questionnaireAnswers,
    } as any);
    if (qErr) throw qErr;
  }

  // Add text response
  if (params.responseText.trim()) {
    const { error: tErr } = await supabase.from('dispute_inputs' as any).insert({
      dispute_id: params.disputeId,
      user_id: user.id,
      input_type: 'text',
      raw_text: params.responseText,
    } as any);
    if (tErr) throw tErr;
  }

  // Update counterparty responded_at
  await supabase
    .from('disputes' as any)
    .update({
      counterparty_responded_at: new Date().toISOString(),
    } as any)
    .eq('id', params.disputeId);

  return true;
}