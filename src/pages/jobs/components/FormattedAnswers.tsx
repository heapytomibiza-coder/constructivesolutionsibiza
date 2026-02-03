import type { ResolvedServicePack } from "@/pages/jobs/lib/buildJobPack";

interface FormattedAnswersProps {
  services: ResolvedServicePack[];
}

/**
 * Pure component that renders resolved service packs with human-readable labels.
 * No Supabase imports - receives fully resolved data from parent.
 * 
 * When packs haven't loaded yet, services will have isFallback=true and show
 * humanized labels based on question IDs (updated when packs arrive).
 */
export function FormattedAnswers({ services }: FormattedAnswersProps) {
  if (!services.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No specific answers provided.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {services.map((service) => (
        <div key={service.slug} className="space-y-3">
          <div className="text-sm font-semibold text-foreground">
            {service.title}
            {service.isFallback && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                (loading labels…)
              </span>
            )}
          </div>
          <ul className="grid gap-2">
            {service.answers.map((answer) => (
              <li key={answer.questionId} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-primary/60">•</span>
                <div className="flex-1">
                  <span className="text-muted-foreground">{answer.questionLabel}:</span>{" "}
                  <span className="font-medium">{answer.displayValue}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
