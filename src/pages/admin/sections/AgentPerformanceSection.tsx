import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bot, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { useAgentPerformance, type AgentMetrics } from "../hooks/useAgentPerformance";
import { cn } from "@/lib/utils";

const AGENT_META: Record<string, { label: string; description: string }> = {
  quote_coach: {
    label: "Quote Quality Coach",
    description: "Advisory feedback on quote clarity for professionals",
  },
  budget_suggestion: {
    label: "Smart Budget Suggestion",
    description: "Data-driven budget ranges shown to clients in wizard",
  },
  classifier: {
    label: "Custom Request Classifier",
    description: "Taxonomy suggestions for custom/uncategorized jobs",
  },
  job_content: {
    label: "Job Content Agent",
    description: "Title, teaser & worker brief generation for posted jobs",
  },
};

const PERIOD_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function MetricCell({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[60px]">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

function AgentCard({ metrics }: { metrics: AgentMetrics }) {
  const meta = AGENT_META[metrics.agent_name] ?? {
    label: metrics.agent_name,
    description: "",
  };

  const successRate =
    metrics.triggered > 0
      ? Math.round((metrics.succeeded / metrics.triggered) * 100)
      : null;

  const acceptanceRate =
    metrics.accepted + metrics.dismissed > 0
      ? Math.round(
          (metrics.accepted / (metrics.accepted + metrics.dismissed)) * 100,
        )
      : null;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm">{meta.label}</h3>
            <p className="text-xs text-muted-foreground">{meta.description}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {successRate !== null && (
              <Badge
                variant={successRate >= 90 ? "default" : successRate >= 70 ? "secondary" : "destructive"}
                className="text-[10px]"
              >
                {successRate}% success
              </Badge>
            )}
            {acceptanceRate !== null && (
              <Badge variant="outline" className="text-[10px]">
                {acceptanceRate}% accepted
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t">
          <MetricCell
            value={metrics.triggered}
            label="Triggers"
            icon={<TrendingUp className="h-3 w-3" />}
          />
          <MetricCell
            value={metrics.succeeded}
            label="Success"
            icon={<CheckCircle2 className="h-3 w-3 text-primary" />}
          />
          <MetricCell
            value={metrics.failed}
            label="Failed"
            icon={<XCircle className="h-3 w-3 text-destructive" />}
          />
          <MetricCell
            value={metrics.accepted}
            label="Accepted"
            icon={<ThumbsUp className="h-3 w-3 text-primary" />}
          />
          <MetricCell
            value={metrics.dismissed}
            label="Dismissed"
            icon={<ThumbsDown className="h-3 w-3 text-muted-foreground" />}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="p-8 text-center space-y-2">
        <Bot className="h-10 w-10 mx-auto text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No agent events recorded yet. Data will appear as agents are triggered by users.
        </p>
      </CardContent>
    </Card>
  );
}

export default function AgentPerformanceSection() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useAgentPerformance(days);

  // Show all known agents even if no data yet
  const allAgents = Object.keys(AGENT_META);
  const dataMap = new Map((data ?? []).map((d) => [d.agent_name, d]));

  const rows: AgentMetrics[] = allAgents.map(
    (name) =>
      dataMap.get(name) ?? {
        agent_name: name,
        triggered: 0,
        succeeded: 0,
        failed: 0,
        accepted: 0,
        dismissed: 0,
      },
  );

  const totalTriggers = rows.reduce((s, r) => s + r.triggered, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Agent Performance</h2>
          {!isLoading && (
            <Badge variant="secondary" className="text-xs">
              {totalTriggers} total triggers
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.days}
              size="sm"
              variant={days === opt.days ? "default" : "outline"}
              className="h-7 text-xs px-2"
              onClick={() => setDays(opt.days)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : totalTriggers === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <AgentCard key={r.agent_name} metrics={r} />
          ))}
        </div>
      )}
    </div>
  );
}
