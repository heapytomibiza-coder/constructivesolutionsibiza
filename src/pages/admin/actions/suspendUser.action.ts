import { supabase } from "@/integrations/supabase/client";

interface SuspendUserParams {
  userId: string;
  reason?: string;
}

/**
 * Suspend a user account
 */
export async function suspendUser({ userId, reason }: SuspendUserParams): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Prevent self-suspension
  if (user.id === userId) {
    return { success: false, error: 'Cannot suspend your own account' };
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
    .from('user_roles')
    .update({
      suspended_at: new Date().toISOString(),
      suspended_by: user.id,
      suspension_reason: reason?.trim() || null,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error suspending user:', error);
    return { success: false, error: 'Failed to suspend user. Please try again.' };
  }

  // Log the action
  await supabase.from('admin_actions_log').insert({
    admin_user_id: user.id,
    action_type: 'suspend_user',
    target_type: 'user',
    target_id: userId,
    metadata: { reason },
  });

  return { success: true };
}

/**
 * Unsuspend a user account
 */
export async function unsuspendUser(userId: string): Promise<{ success: boolean; error?: string }> {
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
    .from('user_roles')
    .update({
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error unsuspending user:', error);
    return { success: false, error: 'Failed to unsuspend user. Please try again.' };
  }

  // Log the action
  await supabase.from('admin_actions_log').insert({
    admin_user_id: user.id,
    action_type: 'unsuspend_user',
    target_type: 'user',
    target_id: userId,
  });

  return { success: true };
}
