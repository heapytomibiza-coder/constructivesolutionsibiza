import { supabase } from "@/integrations/supabase/client";

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

interface VerifyProfessionalParams {
  userId: string;
  status: VerificationStatus;
  notes?: string;
}

/**
 * Update a professional's verification status
 */
export async function verifyProfessional({ 
  userId, 
  status,
  notes 
}: VerifyProfessionalParams): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('professional_profiles')
    .update({
      verification_status: status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating verification status:', error);
    return { success: false, error: error.message };
  }

  // Log the action
  await supabase.from('admin_actions_log').insert({
    admin_user_id: user.id,
    action_type: 'verify_professional',
    target_type: 'user',
    target_id: userId,
    metadata: { status, notes },
  });

  return { success: true };
}
