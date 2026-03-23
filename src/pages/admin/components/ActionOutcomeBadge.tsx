import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, Clock, XCircle, Timer } from "lucide-react";
import type { OutcomeStatus } from "../hooks/useActionOutcomes";
import { formatDistanceToNow } from "date-fns";

const statusConfig: Record<OutcomeStatus, {
  label: string;
  icon: typeof Clock;
  className: string;
}> = {
  pending: {
    label: "Pending",
    icon: Timer,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  observed: {
    label: "Effect observed",
    icon: CheckCircle,
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  no_effect: {
    label: "No effect yet",
    icon: Clock,
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  expired: {
    label: "No effect",
    icon: XCircle,
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

interface ActionOutcomeBadgeProps {
  status: OutcomeStatus;
  createdAt: string;
  details?: Record<string, unknown>;
  compact?: boolean;
}

export function ActionOutcomeBadge({ status, createdAt, details, compact }: ActionOutcomeBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const tooltipLines: string[] = [
    `Status: ${config.label}`,
    `Triggered: ${formatDistanceToNow(new Date(createdAt), { addSuffix: true })}`,
  ];

  if (details) {
    if (details.client_replied) tooltipLines.push("✓ Client replied");
    if (typeof details.new_messages === "number" && (details.new_messages as number) > 0)
      tooltipLines.push(`${details.new_messages} new messages`);
    if (typeof details.new_conversations === "number" && (details.new_conversations as number) > 0)
      tooltipLines.push(`${details.new_conversations} new conversations`);
    if (typeof details.pros_notified === "number")
      tooltipLines.push(`${details.pros_notified} pros notified`);
    if (typeof details.new_pros_in_category === "number")
      tooltipLines.push(`${details.new_pros_in_category} new pros in category`);
    if (details.latest_message_at)
      tooltipLines.push(`Last activity: ${formatDistanceToNow(new Date(details.latest_message_at as string), { addSuffix: true })}`);
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge className={`${config.className} text-xs gap-1`}>
          <Icon className="h-3 w-3" />
          {!compact && config.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="text-xs max-w-[200px]">
        {tooltipLines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}
