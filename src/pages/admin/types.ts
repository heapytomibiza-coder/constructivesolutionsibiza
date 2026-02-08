/**
 * Admin domain types
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

/**
 * Support request types
 */
export interface SupportRequest {
  id: string;
  ticket_number: string;
  conversation_id: string | null;
  job_id: string | null;
  created_by_user_id: string;
  created_by_role: 'client' | 'professional';
  issue_type: 'no_response' | 'no_show' | 'dispute' | 'payment' | 'safety_concern' | 'other';
  summary: string | null;
  status: 'open' | 'triage' | 'joined' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  // From view joins
  job_title: string | null;
  job_category: string | null;
  client_id: string | null;
  pro_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  age_hours: number | null;
}

export type SupportStatusFilter = 'all' | 'active' | 'open' | 'triage' | 'assigned' | 'resolved';
