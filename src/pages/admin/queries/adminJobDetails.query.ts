import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";

export interface AdminJobDetails {
  id: string;
  title: string;
  category: string | null;
  subcategory: string | null;
  micro_slug: string | null;
  area: string | null;
  status: string;
  budget_type: string | null;
  budget_value: number | null;
  budget_min: number | null;
  budget_max: number | null;
  start_timing: string | null;
  start_date: string | null;
  description: string | null;
  teaser: string | null;
  highlights: string[];
  flags: string[] | null;
  computed_safety: string | null;
  computed_inspection_bias: string | null;
  has_photos: boolean | null;
  is_custom_request: boolean;
  is_publicly_listed: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  user_id: string;
  assigned_professional_id: string | null;
  // Joined data
  client: { display_name: string | null; phone: string | null } | null;
  assigned_pro: { display_name: string | null; business_name: string | null; verification_status: string } | null;
  conversation_count: number;
  conversations: Array<{
    id: string;
    pro_id: string;
    last_message_preview: string | null;
    last_message_at: string | null;
    created_at: string;
  }>;
  status_history: Array<{
    id: string;
    from_status: string | null;
    to_status: string;
    change_source: string;
    created_at: string;
  }>;
}

async function fetchAdminJobDetails(jobId: string): Promise<AdminJobDetails> {
  // Fetch job + client + pro + conversations + history in parallel
  const [jobRes, convosRes, historyRes] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", jobId).single(),
    supabase.from("conversations").select("id, pro_id, last_message_preview, last_message_at, created_at").eq("job_id", jobId).order("created_at", { ascending: false }),
    supabase.from("job_status_history").select("id, from_status, to_status, change_source, created_at").eq("job_id", jobId).order("created_at", { ascending: true }),
  ]);

  if (jobRes.error) throw jobRes.error;
  const job = jobRes.data;

  // Fetch client profile
  const { data: clientProfile } = await supabase
    .from("profiles")
    .select("display_name, phone")
    .eq("user_id", job.user_id)
    .single();

  // Fetch assigned pro profile if exists
  let assignedPro: AdminJobDetails["assigned_pro"] = null;
  if (job.assigned_professional_id) {
    const { data: proProfile } = await supabase
      .from("professional_profiles")
      .select("display_name, business_name, verification_status")
      .eq("user_id", job.assigned_professional_id)
      .single();
    assignedPro = proProfile ?? null;
  }

  return {
    ...job,
    client: clientProfile ?? null,
    assigned_pro: assignedPro,
    conversation_count: convosRes.data?.length ?? 0,
    conversations: convosRes.data ?? [],
    status_history: historyRes.data ?? [],
  };
}

export function useAdminJobDetails(jobId: string | null) {
  return useQuery({
    queryKey: adminKeys.jobDetail(jobId ?? ""),
    queryFn: () => fetchAdminJobDetails(jobId!),
    enabled: !!jobId,
  });
}
