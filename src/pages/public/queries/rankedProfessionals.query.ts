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
}

/**
 * Fetch professionals ranked by match score for given micro IDs.
 * Used when category/subcategory filters are applied.
 * 
 * Ranking logic:
 * 1. Primary sort: coverage (pros who cover more of the requested micros)
 * 2. Secondary sort: match_score (preference + completions + ratings + verification)
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
    .neq('status', 'paused'); // Exclude paused services

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
      // Primary: coverage (pros who cover more of the job rank higher)
      if (b.coverage !== a.coverage) return b.coverage - a.coverage;
      // Secondary: match score
      return b.score - a.score;
    });

  // Step 4: Fetch profile details for ranked users
  const userIds = rankedUserIds.map(u => u.userId);
  
  const { data: profiles, error: profilesError } = await supabase
    .from('professional_profiles')
    .select('id, user_id, display_name, avatar_url, services_count, verification_status')
    .in('user_id', userIds)
    .eq('is_publicly_listed', true);

  if (profilesError) throw profilesError;

  // Step 5: Merge and return in ranked order
  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
  
  return rankedUserIds
    .filter(r => profileMap.has(r.userId))
    .map(r => ({
      ...profileMap.get(r.userId)!,
      match_score: r.score,
      coverage: r.coverage,
    }));
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

  // Get all micro categories
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

  // Category filter: need to get subcategories first
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
