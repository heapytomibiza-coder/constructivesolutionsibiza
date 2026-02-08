/**
 * Priority badge for support tickets
 */
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

type Priority = 'low' | 'medium' | 'high';

const priorityConfig: Record<Priority, { 
  label: string; 
  className: string;
  icon: React.ReactNode;
}> = {
  high: { 
    label: "High", 
    className: "bg-destructive text-destructive-foreground",
    icon: <AlertTriangle className="h-3 w-3" />
  },
  medium: { 
    label: "Medium", 
    className: "bg-secondary text-secondary-foreground",
    icon: <AlertCircle className="h-3 w-3" />
  },
  low: { 
    label: "Low", 
    className: "bg-muted text-muted-foreground",
    icon: <Info className="h-3 w-3" />
  },
};

interface Props {
  priority: string | null;
}

export function SupportPriorityBadge({ priority }: Props) {
  const config = priorityConfig[priority as Priority] ?? priorityConfig.medium;
  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
