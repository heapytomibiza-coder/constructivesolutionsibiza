import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface QuestionPackQuestion {
  key: string;
  label: string;
  required?: boolean;
}

/**
 * Extracts "client provides" metadata from question packs.
 * Returns a map of micro_slug -> array of key required question labels.
 */
export function useQuestionPackMeta(microSlugs: string[]) {
  return useQuery({
    queryKey: ['question_pack_meta', microSlugs.slice().sort().join(',')],
    enabled: microSlugs.length > 0,
    staleTime: 60 * 60 * 1000, // 1 hour - packs don't change often
    queryFn: async (): Promise<Record<string, string[]>> => {
      const { data, error } = await supabase
        .from('question_packs')
        .select('micro_slug, questions')
        .in('micro_slug', microSlugs)
        .eq('is_active', true);

      if (error) throw error;

      const result: Record<string, string[]> = {};

      for (const pack of data || []) {
        const questions = pack.questions as unknown as QuestionPackQuestion[] | null;
        
        if (questions && Array.isArray(questions)) {
          // Get required question labels, take first 4
          const clientProvides = questions
            .filter(q => q.required !== false) // Default to required if not specified
            .map(q => q.label)
            .slice(0, 4);
          
          result[pack.micro_slug] = clientProvides;
        }
      }

      return result;
    },
  });
}
