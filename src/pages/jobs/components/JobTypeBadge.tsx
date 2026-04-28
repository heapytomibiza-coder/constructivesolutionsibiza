import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, ClipboardCheck, Layers, Info } from "lucide-react";
import {
  classifyJobDisplayType,
  getJobDisplayCopy,
  jobDisplayTypeBadgeVariant,
  type JobClassificationInput,
  type JobDisplayAudience,
  type JobDisplayType,
} from "@/lib/jobClassification";

interface JobTypeBadgeProps {
  job: JobClassificationInput | null | undefined;
  audience?: JobDisplayAudience;
  variant?: "badge" | "card";
  /** Hides the text label, keeps the icon (used in tight card headers). */
  compact?: boolean;
  className?: string;
}

const ICONS: Record<JobDisplayType, React.ComponentType<{ className?: string }>> = {
  QUICK_QUOTE: Zap,
  SITE_VISIT_REQUIRED: ClipboardCheck,
  COMPLEX_PROJECT: Layers,
  NEEDS_CLARIFICATION: Info,
};

export function JobTypeBadge({
  job,
  audience = "pro",
  variant = "badge",
  compact = false,
  className,
}: JobTypeBadgeProps) {
  const type = classifyJobDisplayType(job);
  const copy = getJobDisplayCopy(type, audience);
  const badgeVariant = jobDisplayTypeBadgeVariant(type);
  const Icon = ICONS[type];

  if (variant === "card") {
    return (
      <div
        className={`flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 p-3 ${className ?? ""}`}
      >
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-background">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{copy.title}</span>
            <Badge variant={badgeVariant} className="text-[10px] uppercase tracking-wide">
              {copy.shortLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{copy.description}</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={badgeVariant} className={`gap-1 ${className ?? ""}`}>
            <Icon className="h-3 w-3" />
            {!compact && copy.shortLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <p className="font-medium">{copy.title}</p>
          <p className="mt-1 text-muted-foreground">{copy.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
