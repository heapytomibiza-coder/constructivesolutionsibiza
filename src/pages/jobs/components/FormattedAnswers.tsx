import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildAnswerLookups,
  resolveAnswerValue,
  type QuestionPack,
} from "@/pages/jobs/lib/answerResolver";

interface FormattedAnswersProps {
  microAnswers: Record<string, Record<string, unknown>>;
  microSlugs: string[];
}

export function FormattedAnswers({ microAnswers, microSlugs }: FormattedAnswersProps) {
  const { data: packs, isLoading } = useQuery({
    queryKey: ["question_packs_for_display", microSlugs],
    queryFn: async () => {
      if (microSlugs.length === 0) return [];
      const { data, error } = await supabase
        .from("question_packs")
        .select("micro_slug, title, questions")
        .in("micro_slug", microSlugs)
        .eq("is_active", true);

      if (error) throw error;
      return (data ?? []) as unknown as QuestionPack[];
    },
    enabled: microSlugs.length > 0,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!packs || packs.length === 0 || Object.keys(microAnswers).length === 0) {
    return <div className="text-sm text-muted-foreground">No specific answers provided.</div>;
  }

  const { questionLabels, optionLabels } = buildAnswerLookups(packs);

  return (
    <div className="space-y-4">
      {Object.entries(microAnswers).map(([slug, answers]) => {
        const pack = packs.find((p) => p.micro_slug === slug);
        const packTitle = pack?.title || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const qLabels = questionLabels.get(slug);
        const oLabels = optionLabels.get(slug);

        const answerEntries = Object.entries(answers).filter(
          ([key]) => !key.startsWith("_")
        );

        if (answerEntries.length === 0) return null;

        return (
          <Card key={slug}>
            <CardContent className="p-4">
              <div className="text-sm font-semibold text-foreground mb-3">{packTitle}</div>
              <div className="space-y-2">
                {answerEntries.map(([questionId, value]) => {
                  const questionLabel = qLabels?.get(questionId) || formatQuestionId(questionId);
                  const optMap = oLabels?.get(questionId);
                  const displayValue = resolveAnswerValue(value, optMap);

                  return (
                    <div key={questionId} className="space-y-0.5">
                      <div className="text-xs text-muted-foreground">{questionLabel}</div>
                      <div className="text-sm font-medium">{displayValue}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Fallback: convert snake_case or kebab-case to Title Case
function formatQuestionId(id: string): string {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
