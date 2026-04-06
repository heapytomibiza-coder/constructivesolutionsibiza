import { AlertTriangle } from 'lucide-react';

export function DisclaimerBanner() {
  return (
    <div className="rounded-lg border-2 border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm text-foreground">
            Ballpark Estimate Only
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These figures are guideline estimates and are not fixed quotes. Final pricing
            may vary depending on materials, access, complexity, finish level, urgency,
            and professional rates. Post a job to receive real quotes from vetted professionals.
          </p>
        </div>
      </div>
    </div>
  );
}
