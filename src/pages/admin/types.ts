/**
 * Admin user types
 */

export interface AdminUser {
  id: string;
  roles: string[];
  active_role: string;
  created_at: string;
  suspended_at: string | null;
  suspension_reason: string | null;
  display_name: string | null;
  phone: string | null;
  pro_verification_status: string | null;
  pro_onboarding_phase: string | null;
  pro_services_count: number;
  pro_is_listed: boolean;
  status: 'active' | 'active_pro' | 'pending_pro' | 'suspended';
}

export type UserStatusFilter = 'all' | 'active' | 'professionals' | 'suspended';
