/**
 * Issue type badge for support tickets
 */
import { Badge } from "@/components/ui/badge";
import { Clock, UserX, Scale, CreditCard, ShieldAlert, HelpCircle } from "lucide-react";

type IssueType = 'no_response' | 'no_show' | 'dispute' | 'payment' | 'safety_concern' | 'other';

const issueConfig: Record<IssueType, { 
  label: string; 
  icon: React.ReactNode;
}> = {
  no_response: { 
    label: "No Response", 
    icon: <Clock className="h-3 w-3" />
  },
  no_show: { 
    label: "No Show", 
    icon: <UserX className="h-3 w-3" />
  },
  dispute: { 
    label: "Dispute", 
    icon: <Scale className="h-3 w-3" />
  },
  payment: { 
    label: "Payment", 
    icon: <CreditCard className="h-3 w-3" />
  },
  safety_concern: { 
    label: "Safety", 
    icon: <ShieldAlert className="h-3 w-3" />
  },
  other: { 
    label: "Other", 
    icon: <HelpCircle className="h-3 w-3" />
  },
};

interface Props {
  issueType: string | null;
}

export function IssueTypeBadge({ issueType }: Props) {
  const config = issueConfig[issueType as IssueType] ?? issueConfig.other;
  return (
    <Badge variant="secondary" className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}
