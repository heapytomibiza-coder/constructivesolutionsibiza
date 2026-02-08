/**
 * Status badge for support tickets
 */
import { Badge } from "@/components/ui/badge";

type Status = 'open' | 'triage' | 'joined' | 'resolved' | 'closed';

const statusConfig: Record<Status, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  open: { label: "Open", variant: "destructive" },
  triage: { label: "Triage", variant: "secondary" },
  joined: { label: "Joined", variant: "default" },
  resolved: { label: "Resolved", variant: "outline" },
  closed: { label: "Closed", variant: "outline" },
};

interface Props {
  status: string | null;
}

export function SupportStatusBadge({ status }: Props) {
  const config = statusConfig[status as Status] ?? { label: status ?? "Unknown", variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
