import { supabase } from '@/integrations/supabase/client';

export async function fetchUserDisputes() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('disputes' as any)
    .select('*, jobs!inner(title, category, area)')
    .or(`raised_by.eq.${user.id},counterparty_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchDisputeDetail(disputeId: string) {
  const { data: dispute, error } = await supabase
    .from('disputes' as any)
    .select('*, jobs!inner(title, category, area, description, user_id, assigned_professional_id)')
    .eq('id', disputeId)
    .single();

  if (error) throw error;

  // Fetch related data in parallel
  const [inputsRes, evidenceRes, analysisRes, historyRes] = await Promise.all([
    supabase.from('dispute_inputs' as any).select('*').eq('dispute_id', disputeId).order('created_at'),
    supabase.from('dispute_evidence' as any).select('*').eq('dispute_id', disputeId).order('created_at'),
    supabase.from('dispute_analysis' as any).select('*').eq('dispute_id', disputeId).order('created_at', { ascending: false }).limit(1),
    supabase.from('dispute_status_history' as any).select('*').eq('dispute_id', disputeId).order('created_at'),
  ]);

  return {
    dispute,
    inputs: inputsRes.data || [],
    evidence: evidenceRes.data || [],
    analysis: (analysisRes.data || [])[0] || null,
    history: historyRes.data || [],
  };
}
