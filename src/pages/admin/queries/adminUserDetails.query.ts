import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";

export interface AdminUserDetails {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  created_at: string;
  // Roles
  roles: string[];
  active_role: string;
  suspended_at: string | null;
  suspension_reason: string | null;
  // Pro profile (if exists)
  pro: {
    display_name: string | null;
    business_name: string | null;
    verification_status: string;
    onboarding_phase: string;
    services_count: number;
    is_publicly_listed: boolean;
    service_zones: string[] | null;
    tagline: string | null;
  } | null;
  // Activity counts
  jobs_count: number;
  conversations_count: number;
  support_tickets_count: number;
}

async function fetchAdminUserDetails(userId: string): Promise<AdminUserDetails> {
  const [profileRes, rolesRes, proRes, jobsCountRes, convosCountRes, ticketsCountRes] = await Promise.all([
    supabase.from("profiles").select("display_name, phone, created_at").eq("user_id", userId).single(),
    supabase.from("user_roles").select("roles, active_role, suspended_at, suspension_reason").eq("user_id", userId).single(),
    supabase.from("professional_profiles").select("display_name, business_name, verification_status, onboarding_phase, services_count, is_publicly_listed, service_zones, tagline").eq("user_id", userId).maybeSingle(),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("conversations").select("id", { count: "exact", head: true }).or(`client_id.eq.${userId},pro_id.eq.${userId}`),
    supabase.from("support_requests").select("id", { count: "exact", head: true }).eq("created_by_user_id", userId),
  ]);

  if (profileRes.error) throw profileRes.error;

  return {
    user_id: userId,
    display_name: profileRes.data.display_name,
    phone: profileRes.data.phone,
    created_at: profileRes.data.created_at ?? "",
    roles: rolesRes.data?.roles ?? ["client"],
    active_role: rolesRes.data?.active_role ?? "client",
    suspended_at: rolesRes.data?.suspended_at ?? null,
    suspension_reason: rolesRes.data?.suspension_reason ?? null,
    pro: proRes.data ?? null,
    jobs_count: jobsCountRes.count ?? 0,
    conversations_count: convosCountRes.count ?? 0,
    support_tickets_count: ticketsCountRes.count ?? 0,
  };
}

export function useAdminUserDetails(userId: string | null) {
  return useQuery({
    queryKey: adminKeys.userDetail(userId ?? ""),
    queryFn: () => fetchAdminUserDetails(userId!),
    enabled: !!userId,
  });
}
