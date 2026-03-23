import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useActionOutcomes } from "../hooks/useActionOutcomes";
import { ActionOutcomeBadge } from "./ActionOutcomeBadge";
import { formatDistanceToNow } from "date-fns";
import { Bell, Mail, Rocket, Activity } from "lucide-react";

const actionIcons: Record<string, typeof Bell> = {
  notify_matching_pros: Bell,
  nudge_client: Mail,
  boost_category: Rocket,
};

const actionLabels: Record<string, string> = {
  notify_matching_pros: "Notify Pros",
  nudge_client: "Nudge Client",
  boost_category: "Boost Category",
};

export function AdminActionsPanel() {
  const { data, isLoading } = useActionOutcomes();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" /> Recent Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" /> Recent Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No admin actions taken yet. Use Insight pages to trigger actions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" /> Recent Actions
          <Badge variant="outline" className="text-xs ml-auto">{data.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((action) => {
          const Icon = actionIcons[action.action_type] ?? Activity;
          const label = actionLabels[action.action_type] ?? action.action_type;
          const meta = action.action_metadata;

          let targetLabel = "";
          if (action.action_type === "nudge_client") {
            targetLabel = (meta?.job_title as string) ?? "Conversation";
          } else if (action.action_type === "notify_matching_pros") {
            targetLabel = (meta?.category as string)?.replace(/-/g, " ") ?? "Job";
          } else if (action.action_type === "boost_category") {
            targetLabel = `${(meta?.category as string)?.replace(/-/g, " ")} in ${meta?.area ?? "—"}`;
          }

          return (
            <div
              key={action.action_id}
              className="flex items-center gap-3 p-3 rounded-lg border"
            >
              <div className="p-1.5 rounded bg-primary/10 shrink-0">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground truncate capitalize">
                    {targetLabel}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                </p>
              </div>
              <ActionOutcomeBadge
                status={action.outcome_status}
                createdAt={action.created_at}
                details={action.outcome_details}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
