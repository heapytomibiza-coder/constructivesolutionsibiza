import {
  Briefcase, Users, MessageSquare, Headset, CheckCircle, Activity,
  UserPlus, Mail, type LucideIcon,
} from "lucide-react";

export type AdminMetricKey =
  | "open_jobs"
  | "active_jobs"
  | "completed_jobs"
  | "jobs_posted"
  | "new_users"
  | "new_pros"
  | "conversations"
  | "support_tickets"
  | "messages_sent";

export interface MetricDefinition {
  key: AdminMetricKey;
  label: string;
  description: string;
  icon: LucideIcon;
  defaultTimeframeDays: number;
  /** Columns shown in the drilldown table */
  drilldownColumns: { key: string; label: string }[];
}

export const metricRegistry: Record<AdminMetricKey, MetricDefinition> = {
  open_jobs: {
    key: "open_jobs",
    label: "Open Jobs",
    description: "Publicly listed jobs with status 'open'",
    icon: Briefcase,
    defaultTimeframeDays: 30,
    drilldownColumns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "area", label: "Area" },
      { key: "budget_type", label: "Budget" },
      { key: "created_at", label: "Posted" },
    ],
  },
  active_jobs: {
    key: "active_jobs",
    label: "Active Jobs",
    description: "Jobs currently in progress with an assigned professional",
    icon: Activity,
    defaultTimeframeDays: 30,
    drilldownColumns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "area", label: "Area" },
      { key: "created_at", label: "Started" },
    ],
  },
  completed_jobs: {
    key: "completed_jobs",
    label: "Completed Jobs",
    description: "Jobs that have been marked as completed",
    icon: CheckCircle,
    defaultTimeframeDays: 30,
    drilldownColumns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "area", label: "Area" },
      { key: "completed_at", label: "Completed" },
    ],
  },
  jobs_posted: {
    key: "jobs_posted",
    label: "Jobs Posted",
    description: "New jobs posted and made public in the time period",
    icon: Briefcase,
    defaultTimeframeDays: 14,
    drilldownColumns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "area", label: "Area" },
      { key: "start_timing", label: "Timing" },
      { key: "created_at", label: "Posted" },
    ],
  },
  new_users: {
    key: "new_users",
    label: "New Users",
    description: "Total user signups in the time period",
    icon: UserPlus,
    defaultTimeframeDays: 30,
    drilldownColumns: [
      { key: "display_name", label: "Name" },
      { key: "active_role", label: "Role" },
      { key: "created_at", label: "Joined" },
    ],
  },
  new_pros: {
    key: "new_pros",
    label: "New Professionals",
    description: "Professional signups in the time period",
    icon: Users,
    defaultTimeframeDays: 30,
    drilldownColumns: [
      { key: "display_name", label: "Name" },
      { key: "business_name", label: "Business" },
      { key: "verification_status", label: "Status" },
      { key: "services_count", label: "Services" },
      { key: "created_at", label: "Joined" },
    ],
  },
  conversations: {
    key: "conversations",
    label: "Conversations",
    description: "New conversations started between clients and professionals",
    icon: MessageSquare,
    defaultTimeframeDays: 30,
    drilldownColumns: [
      { key: "last_message_preview", label: "Last Message" },
      { key: "created_at", label: "Started" },
    ],
  },
  support_tickets: {
    key: "support_tickets",
    label: "Support Tickets",
    description: "Support requests created in the time period",
    icon: Headset,
    defaultTimeframeDays: 30,
    drilldownColumns: [
      { key: "ticket_number", label: "Ticket" },
      { key: "issue_type", label: "Issue" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Created" },
    ],
  },
  messages_sent: {
    key: "messages_sent",
    label: "Messages Sent",
    description: "User messages sent across all conversations",
    icon: Mail,
    defaultTimeframeDays: 14,
    drilldownColumns: [
      { key: "body_preview", label: "Preview" },
      { key: "created_at", label: "Sent" },
    ],
  },
};

export const allMetricKeys = Object.keys(metricRegistry) as AdminMetricKey[];
