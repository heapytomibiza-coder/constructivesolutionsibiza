import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ClipboardCheck, Zap } from "lucide-react";

interface JobFlagBadgesProps {
  flags?: string[] | null;
  inspectionBias?: string | null;
  safety?: string | null;
  compact?: boolean;
}

export function JobFlagBadges({ 
  flags, 
  inspectionBias, 
  safety, 
  compact = false 
}: JobFlagBadgesProps) {
  const { t } = useTranslation("jobs");
  const badges: React.ReactNode[] = [];
  const flagArray = flags ?? [];
  
  if (safety === "red" || flagArray.includes("EMERGENCY")) {
    badges.push(
      <Badge key="emergency" variant="destructive" className="gap-1">
        <Zap className="h-3 w-3" />
        {!compact && t('flags.emergency')}
      </Badge>
    );
  } else if (safety === "amber") {
    badges.push(
      <Badge key="urgent" variant="outline" className="gap-1 border-warning text-warning">
        <AlertTriangle className="h-3 w-3" />
        {!compact && t('flags.urgent')}
      </Badge>
    );
  }
  
  if (
    inspectionBias === "mandatory" || 
    inspectionBias === "high" ||
    flagArray.includes("INSPECTION_MANDATORY") ||
    flagArray.includes("INSPECTION_REQUIRED") ||
    flagArray.includes("QUOTE_SUBJECT_TO_INSPECTION")
  ) {
    badges.push(
      <Badge key="inspection" variant="secondary" className="gap-1">
        <ClipboardCheck className="h-3 w-3" />
        {!compact && t('flags.quoteSubjectToInspection')}
      </Badge>
    );
  }
  
  const handledFlags = [
    "EMERGENCY", "URGENT",
    "INSPECTION_MANDATORY", "INSPECTION_REQUIRED", "QUOTE_SUBJECT_TO_INSPECTION"
  ];

  const EXTRA_FLAG_KEYS: Record<string, string> = {
    PERMITS_MAY_BE_NEEDED: 'flags.permitsMayBeNeeded',
    SITE_VISIT_NEEDED: 'flags.siteVisitNeeded',
    CLIENT_HAS_PERMIT_CONCERNS: 'flags.clientHasPermitConcerns',
  };

  const interestingFlags = flagArray.filter(f => !handledFlags.includes(f));
  
  interestingFlags.slice(0, 2).forEach((flag, i) => {
    const translationKey = EXTRA_FLAG_KEYS[flag];
    badges.push(
      <Badge key={`flag-${i}`} variant="outline" className="text-xs">
        {translationKey ? t(translationKey) : flag.replace(/_/g, " ").toLowerCase()}
      </Badge>
    );
  });
  
  if (badges.length === 0) return null;
  
  return <>{badges}</>;
}
