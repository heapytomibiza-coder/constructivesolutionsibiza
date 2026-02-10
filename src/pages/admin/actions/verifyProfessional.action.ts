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

  // Verify admin role server-side
  const { data: hasAdmin } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });

  if (!hasAdmin) {
    return { success: false, error: 'Admin access required' };
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
    return { success: false, error: 'Failed to update verification status. Please try again.' };
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
