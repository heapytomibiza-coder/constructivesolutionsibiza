import { supabase } from '@/integrations/supabase/client';

export interface RankedProfessional {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  services_count: number | null;
  verification_status: string | null;
  match_score: number;
  coverage: number;
  ranking_labels: string[];
  /** Whether the pro has at least one live listing for matched micros */
  has_live_listing: boolean;
}

/**
 * Fetch professionals ranked by match score for given micro IDs.
 * 
 * Ranking logic:
 * 1. Primary sort: coverage (pros who cover more of the requested micros)
 * 2. Secondary sort: match_score (preference + completions + ratings + verification)
 * 3. Tertiary sort: ranking_score (server-side only, not exposed to client)
 *
 * NOTE: ranking_score is fetched via server-side RPC for ordering
 * but is NOT included in the returned data to prevent leaking numeric scores.
 */
export async function getRankedProfessionals(
  microIds: string[]
): Promise<RankedProfessional[]> {
  if (!microIds.length) return [];

  // Step 1: Get match scores from the view
  const { data: scores, error: scoresError } = await supabase
    .from('professional_matching_scores')
    .select('user_id, micro_id, match_score, status, preference, verification_level')
    .in('micro_id', microIds)
    .neq('status', 'paused');

  if (scoresError) throw scoresError;
  if (!scores?.length) return [];

  // Step 2: Aggregate scores per user
  const userScores = new Map<string, { totalScore: number; coveredMicros: Set<string> }>();
  
  for (const row of scores) {
    const userId = row.user_id as string;
    const score = Number(row.match_score ?? 0);
    const microId = row.micro_id as string;

    if (!userScores.has(userId)) {
      userScores.set(userId, { totalScore: 0, coveredMicros: new Set() });
    }
    
    const entry = userScores.get(userId)!;
    entry.totalScore += score;
    entry.coveredMicros.add(microId);
  }

  // Step 3: Rank by coverage first, then score
  const rankedUserIds = [...userScores.entries()]
    .map(([userId, data]) => ({
      userId,
      score: data.totalScore,
      coverage: data.coveredMicros.size / microIds.length,
    }))
    .sort((a, b) => {
      if (b.coverage !== a.coverage) return b.coverage - a.coverage;
      return b.score - a.score;
    });

  // Step 4: Fetch profiles + labels (no raw scores) + ranking scores for ordering
  const userIds = rankedUserIds.map(u => u.userId);
  
  const [profilesResult, labelsResult, scoresResult] = await Promise.all([
    supabase
      .from('professional_profiles')
      .select('id, user_id, display_name, avatar_url, services_count, verification_status')
      .in('user_id', userIds)
      .eq('is_publicly_listed', true),
    supabase.rpc('get_professional_labels' as any, { p_user_ids: userIds }),
    supabase.rpc('get_professional_ranking_scores' as any, { p_user_ids: userIds }),
  ]);

  if (profilesResult.error) throw profilesResult.error;

  // Step 5: Build lookup maps
  const profileMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) ?? []);
  const labelMap = new Map(
    ((labelsResult.data as any[]) ?? []).map((r: any) => [r.user_id, r.labels ?? []])
  );
  const scoreMap = new Map(
    ((scoresResult.data as any[]) ?? []).map((r: any) => [r.user_id, Number(r.ranking_score ?? 0)])
  );
  
  // Step 6: Merge, sort with ranking_score tiebreaker, return WITHOUT ranking_score
  return rankedUserIds
    .filter(r => profileMap.has(r.userId))
    .map(r => ({
      ...profileMap.get(r.userId)!,
      match_score: r.score,
      coverage: r.coverage,
      ranking_labels: labelMap.get(r.userId) ?? [],
      _rankingScore: scoreMap.get(r.userId) ?? 0, // temporary for sorting
    }))
    .sort((a, b) => {
      if (b.coverage !== a.coverage) return b.coverage - a.coverage;
      if (b.match_score !== a.match_score) return b.match_score - a.match_score;
      return b._rankingScore - a._rankingScore;
    })
    .map(({ _rankingScore, ...rest }) => rest); // strip internal score
}

/**
 * Get micro IDs for a category or subcategory filter.
 * Helper used by the Professionals page.
 */
export async function getMicroIdsForFilter(
  categoryId: string | null,
  subcategoryId: string | null
): Promise<string[]> {
  if (!categoryId && !subcategoryId) return [];

  let microQuery = supabase
    .from('service_micro_categories')
    .select('id, subcategory_id');

  if (subcategoryId) {
    microQuery = microQuery.eq('subcategory_id', subcategoryId);
  }

  const { data: micros, error: microError } = await microQuery;
  if (microError) throw microError;

  if (subcategoryId) {
    return (micros || []).map(m => m.id);
  }

  if (categoryId) {
    const { data: subs } = await supabase
      .from('service_subcategories')
      .select('id')
      .eq('category_id', categoryId);
    
    const subIds = new Set((subs || []).map(s => s.id));
    return (micros || []).filter(m => subIds.has(m.subcategory_id)).map(m => m.id);
  }

  return [];
}
