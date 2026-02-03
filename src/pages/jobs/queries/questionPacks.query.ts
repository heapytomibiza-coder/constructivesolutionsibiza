import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { jobKeys } from "./keys";
import type { QuestionPack } from "../lib/answerResolver";

/**
 * Fetch question packs by micro slugs.
 */
export async function fetchQuestionPacks(slugs: string[]): Promise<QuestionPack[]> {
  if (!slugs.length) return [];

  const { data, error } = await supabase
    .from("question_packs")
    .select("micro_slug, title, questions")
    .in("micro_slug", slugs)
    .eq("is_active", true);

  if (error) throw error;
  
  // Transform to QuestionPack shape
  return (data ?? []).map((row) => ({
    micro_slug: row.micro_slug,
    title: row.title,
    questions: (row.questions as unknown[]) || [],
  })) as QuestionPack[];
}

/**
 * Hook to fetch question packs for displaying resolved answers.
 * Uses stable sorted key to ensure cache hits for same slugs in different order.
 * 
 * @param slugs - Array of micro_slug values to fetch packs for
 * @param enabled - Whether the query should run (default: true)
 */
export function useQuestionPacks(slugs: string[], enabled = true) {
  return useQuery({
    queryKey: jobKeys.questionPacks(slugs),
    queryFn: () => fetchQuestionPacks(slugs),
    enabled: enabled && slugs.length > 0,
    staleTime: 60_000, // Packs don't change often
  });
}
