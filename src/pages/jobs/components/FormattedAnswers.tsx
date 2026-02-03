import type { ResolvedServicePack } from "@/pages/jobs/lib/buildJobPack";
import { Card, CardContent } from "@/components/ui/card";

interface FormattedAnswersProps {
  services: ResolvedServicePack[];
  isLoading?: boolean;
}

/**
 * Pure component that renders resolved service packs with human-readable labels.
 * No Supabase imports - receives fully resolved data from parent.
 */
export function FormattedAnswers({ services, isLoading }: FormattedAnswersProps) {
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground animate-pulse">
        Loading specifications…
      </div>
    );
  }

  if (!services.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No specific answers provided.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <Card key={service.slug}>
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-foreground mb-3">
              {service.title}
              {service.isFallback && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  (loading labels…)
                </span>
              )}
            </div>
            <div className="space-y-2">
              {service.answers.map((answer) => (
                <div key={answer.questionId} className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">
                    {answer.questionLabel}
                  </div>
                  <div className="text-sm font-medium">
                    {answer.displayValue}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
