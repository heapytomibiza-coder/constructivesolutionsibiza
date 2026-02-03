import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ClipboardCheck, Zap } from "lucide-react";

interface JobFlagBadgesProps {
  flags?: string[] | null;
  inspectionBias?: string | null;
  safety?: string | null;
  compact?: boolean;
}

/**
 * Display badges for job flags computed by the rules engine.
 * Shows inspection requirements, safety status, and emergency indicators.
 */
export function JobFlagBadges({ 
  flags, 
  inspectionBias, 
  safety, 
  compact = false 
}: JobFlagBadgesProps) {
  const badges: React.ReactNode[] = [];
  const flagArray = flags ?? [];
  
  // Emergency/Safety badges
  if (safety === "red" || flagArray.includes("EMERGENCY")) {
    badges.push(
      <Badge 
        key="emergency" 
        variant="destructive" 
        className="gap-1"
      >
        <Zap className="h-3 w-3" />
        {!compact && "Emergency"}
      </Badge>
    );
  } else if (safety === "amber") {
    badges.push(
      <Badge 
        key="urgent" 
        variant="outline" 
        className="gap-1 border-warning text-warning"
      >
        <AlertTriangle className="h-3 w-3" />
        {!compact && "Urgent"}
      </Badge>
    );
  }
  
  // Inspection badges
  if (
    inspectionBias === "mandatory" || 
    inspectionBias === "high" ||
    flagArray.includes("INSPECTION_MANDATORY") ||
    flagArray.includes("INSPECTION_REQUIRED")
  ) {
    badges.push(
      <Badge 
        key="inspection" 
        variant="secondary" 
        className="gap-1"
      >
        <ClipboardCheck className="h-3 w-3" />
        {!compact && "Quote subject to inspection"}
      </Badge>
    );
  }
  
  // Show specific flags if interesting
  const interestingFlags = flagArray.filter(f => 
    !["EMERGENCY", "INSPECTION_MANDATORY", "INSPECTION_REQUIRED", "URGENT"].includes(f)
  );
  
  // Only show first 2 extra flags to avoid clutter
  interestingFlags.slice(0, 2).forEach((flag, i) => {
    badges.push(
      <Badge key={`flag-${i}`} variant="outline" className="text-xs">
        {flag.replace(/_/g, " ").toLowerCase()}
      </Badge>
    );
  });
  
  if (badges.length === 0) return null;
  
  return <>{badges}</>;
}
