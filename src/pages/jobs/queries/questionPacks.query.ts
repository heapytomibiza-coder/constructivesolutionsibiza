import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { jobKeys } from "./keys";
import type { QuestionPack } from "../lib/answerResolver";
import { validatePackQuestions, type PackValidationResult } from "../lib/packSchema";

/**
 * Fetch question packs by micro slugs.
 * Runs schema validation in dev and logs warnings — never blocks rendering.
 */
export async function fetchQuestionPacks(slugs: string[]): Promise<QuestionPack[]> {
  if (!slugs.length) return [];

  const { data, error } = await supabase
    .from("question_packs")
    .select("micro_slug, title, questions")
    .in("micro_slug", slugs)
    .eq("is_active", true);

  if (error) throw error;

  const packs = (data ?? []).map((row) => ({
    micro_slug: row.micro_slug,
    title: row.title,
    questions: (row.questions as unknown[]) || [],
  })) as QuestionPack[];

  // Dev-only runtime validation (never blocks UI)
  if (import.meta.env.DEV) {
    for (const pack of packs) {
      const result = validatePackQuestions(pack.micro_slug, pack.title, pack.questions as unknown[]);
      if (!result.valid || result.lintWarnings.length > 0) {
        console.warn(
          `[PackLint] ${pack.micro_slug} — ${result.qualityTier} (score: ${result.score})`,
          { errors: result.errors, warnings: result.lintWarnings }
        );
      }
    }
  }

  return packs;
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
