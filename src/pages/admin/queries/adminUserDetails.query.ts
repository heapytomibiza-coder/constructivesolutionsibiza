import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminKeys } from "./keys";

export interface ProServiceEntry {
  micro_id: string;
  micro_name: string;
  subcategory_name: string;
  category_name: string;
  status: string;
}

export interface ServiceListingSummary {
  id: string;
  display_title: string;
  status: string;
  has_hero: boolean;
  has_description: boolean;
  pricing_summary: string | null;
}

export interface ProfileCompleteness {
  score: number; // 0-100
  checks: { label: string; done: boolean }[];
}

export interface AskerJobSummary {
  id: string;
  title: string;
  status: string;
  category: string | null;
  area: string | null;
  created_at: string;
}

export interface AdminReviewSummary {
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_role: string;
}

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
    bio: string | null;
    avatar_url: string | null;
  } | null;
  // Pro services & listings
  pro_services: ProServiceEntry[];
  service_listings: ServiceListingSummary[];
  documents_count: number;
  completeness: ProfileCompleteness | null;
  // Asker data
  asker_jobs: AskerJobSummary[];
  asker_conversations_count: number;
  // Tasker conversations (as pro)
  tasker_conversations_count: number;
  // Activity counts (total)
  jobs_count: number;
  conversations_count: number;
  support_tickets_count: number;
  // Reviews (public reviews received as pro)
  review_avg: number | null;
  review_count: number;
  recent_reviews: AdminReviewSummary[];
}

function calcCompleteness(user: Omit<AdminUserDetails, 'completeness'>): ProfileCompleteness {
  const checks: { label: string; done: boolean }[] = [
    { label: "Display name", done: !!user.pro?.display_name },
    { label: "Phone number", done: !!user.phone },
    { label: "Business name", done: !!user.pro?.business_name },
    { label: "Bio written", done: !!user.pro?.bio },
    { label: "Tagline set", done: !!user.pro?.tagline },
    { label: "Avatar photo", done: !!user.pro?.avatar_url },
    { label: "Service zones configured", done: (user.pro?.service_zones?.length ?? 0) > 0 },
    { label: "At least 1 service selected", done: user.pro_services.length > 0 },
    { label: "Service listing created", done: user.service_listings.length > 0 },
    { label: "Publicly listed", done: !!user.pro?.is_publicly_listed },
    { label: "Documents uploaded", done: user.documents_count > 0 },
  ];
  const done = checks.filter((c) => c.done).length;
  return { score: Math.round((done / checks.length) * 100), checks };
}

async function fetchAdminUserDetails(userId: string): Promise<AdminUserDetails> {
  const [
    profileRes, rolesRes, proRes,
    jobsRes, clientConvosRes, proConvosRes,
    ticketsCountRes, servicesRes, listingsRes, docsCountRes,
    reviewsRes, reviewAggRes,
  ] = await Promise.all([
    supabase.from("profiles").select("display_name, phone, created_at").eq("user_id", userId).maybeSingle(),
    supabase.from("user_roles").select("roles, active_role, suspended_at, suspension_reason").eq("user_id", userId).maybeSingle(),
    supabase.from("professional_profiles").select("display_name, business_name, verification_status, onboarding_phase, services_count, is_publicly_listed, service_zones, tagline, bio, avatar_url").eq("user_id", userId).maybeSingle(),
    // Asker: recent jobs (up to 20)
    supabase.from("jobs").select("id, title, status, category, area, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    // Conversations as client
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("client_id", userId),
    // Conversations as pro
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("pro_id", userId),
    supabase.from("support_requests").select("id", { count: "exact", head: true }).eq("created_by_user_id", userId),
    supabase.from("professional_services").select("micro_id, status").eq("user_id", userId),
    supabase.from("service_listings").select("id, display_title, status, hero_image_url, short_description, pricing_summary").eq("provider_id", userId),
    supabase.from("professional_documents").select("id", { count: "exact", head: true }).eq("user_id", userId),
    // Public reviews received (as pro) — recent display list
    supabase.from("job_reviews").select("rating, comment, created_at, reviewer_role").eq("reviewee_user_id", userId).eq("visibility", "public").order("created_at", { ascending: false }).limit(10),
    // Full public review ratings for accurate aggregate
    supabase.from("job_reviews").select("rating").eq("reviewee_user_id", userId).eq("visibility", "public"),
  ]);

  if (profileRes.error) throw profileRes.error;

  // Resolve micro names from search index
  let proServices: ProServiceEntry[] = [];
  if (servicesRes.data && servicesRes.data.length > 0) {
    const microIds = servicesRes.data.map((s) => s.micro_id);
    const { data: taxData } = await supabase
      .from("service_search_index")
      .select("micro_id, micro_name, subcategory_name, category_name")
      .in("micro_id", microIds);

    const taxMap = new Map((taxData ?? []).map((t) => [t.micro_id, t]));
    proServices = servicesRes.data.map((s) => {
      const tax = taxMap.get(s.micro_id);
      return {
        micro_id: s.micro_id,
        micro_name: tax?.micro_name ?? "Unknown",
        subcategory_name: tax?.subcategory_name ?? "",
        category_name: tax?.category_name ?? "",
        status: s.status,
      };
    });
  }

  const serviceListings: ServiceListingSummary[] = (listingsRes.data ?? []).map((l) => ({
    id: l.id,
    display_title: l.display_title,
    status: l.status,
    has_hero: !!l.hero_image_url,
    has_description: !!l.short_description && l.short_description.length > 0,
    pricing_summary: l.pricing_summary,
  }));

  const askerJobs: AskerJobSummary[] = (jobsRes.data ?? []).map((j) => ({
    id: j.id,
    title: j.title,
    status: j.status,
    category: j.category,
    area: j.area,
    created_at: j.created_at,
  }));

  const clientConvos = clientConvosRes.count ?? 0;
  const proConvos = proConvosRes.count ?? 0;

  // Compute review aggregates from full ratings fetch (not limited display list)
  const allRatings = reviewAggRes.data ?? [];
  const reviewCount = allRatings.length;
  const reviewAvg = reviewCount > 0
    ? allRatings.reduce((s, r) => s + r.rating, 0) / reviewCount
    : null;

  const base: Omit<AdminUserDetails, 'completeness'> = {
    user_id: userId,
    display_name: profileRes.data.display_name,
    phone: profileRes.data.phone,
    created_at: profileRes.data.created_at ?? "",
    roles: rolesRes.data?.roles ?? ["client"],
    active_role: rolesRes.data?.active_role ?? "client",
    suspended_at: rolesRes.data?.suspended_at ?? null,
    suspension_reason: rolesRes.data?.suspension_reason ?? null,
    pro: proRes.data ? {
      ...proRes.data,
      service_zones: proRes.data.service_zones ?? null,
    } : null,
    pro_services: proServices,
    service_listings: serviceListings,
    documents_count: docsCountRes.count ?? 0,
    asker_jobs: askerJobs,
    asker_conversations_count: clientConvos,
    tasker_conversations_count: proConvos,
    jobs_count: askerJobs.length,
    conversations_count: clientConvos + proConvos,
    support_tickets_count: ticketsCountRes.count ?? 0,
    review_avg: reviewAvg,
    review_count: reviewCount,
    recent_reviews: (reviewsRes.data ?? []).map((r) => ({
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      reviewer_role: r.reviewer_role,
    })),
  };

  return {
    ...base,
    completeness: base.pro ? calcCompleteness(base) : null,
  };
}

export function useAdminUserDetails(userId: string | null) {
  return useQuery({
    queryKey: adminKeys.userDetail(userId ?? ""),
    queryFn: () => fetchAdminUserDetails(userId!),
    enabled: !!userId,
  });
}
