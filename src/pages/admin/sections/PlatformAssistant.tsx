import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  Minus,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  Eye,
  Bell,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertCircle,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AssistantSummary {
  this_week: Record<string, any>;
  prev_week: Record<string, any>;
  trends: Array<Record<string, any>>;
  alerts: Array<Record<string, any>>;
  latest_report: {
    report_week: string;
    ai_analysis: string;
    issues: Array<{ title: string; severity: string; description: string }>;
    recommendations: Array<{
      title: string;
      priority: string;
      action: string;
      expected_impact: string;
    }>;
    created_at: string;
  } | null;
  generated_at: string;
}

function useAssistantSummary() {
  return useQuery({
    queryKey: ["platform_assistant_summary"],
    queryFn: async (): Promise<AssistantSummary> => {
      const { data, error } = await supabase.rpc(
        "get_platform_assistant_summary"
      );
      if (error) throw error;
      return data as unknown as AssistantSummary;
    },
    staleTime: 60_000,
  });
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-destructive/80 text-destructive-foreground",
  medium: "bg-amber-500 text-white",
  low: "bg-muted text-muted-foreground",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-destructive/30 bg-destructive/5",
  medium: "border-amber-500/30 bg-amber-500/5",
  low: "border-muted",
};

function DeltaIndicator({
  current,
  previous,
  suffix = "",
  invertColors = false,
}: {
  current: number | null;
  previous: number | null;
  suffix?: string;
  invertColors?: boolean;
}) {
  if (current == null || previous == null) return <Minus className="h-3 w-3 text-muted-foreground" />;
  const delta = current - previous;
  if (delta === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
  const isPositive = delta > 0;
  const isGood = invertColors ? !isPositive : isPositive;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${isGood ? "text-emerald-600" : "text-destructive"}`}>
      {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta)}{suffix}
    </span>
  );
}

function MetricCard({
  label,
  value,
  prevValue,
  suffix = "",
  invertColors = false,
}: {
  label: string;
  value: number | null;
  prevValue?: number | null;
  suffix?: string;
  invertColors?: boolean;
}) {
  return (
    <div className="text-center space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value ?? "—"}{suffix && value != null ? suffix : ""}</p>
      {prevValue !== undefined && (
        <DeltaIndicator current={value} previous={prevValue} suffix={suffix} invertColors={invertColors} />
      )}
    </div>
  );
}

export function PlatformAssistant() {
  const { data, isLoading, isError, error, refetch } = useAssistantSummary();
  const queryClient = useQueryClient();

  const generateReport = useMutation({
    mutationFn: async () => {
      const { data: result, error } = await supabase.functions.invoke(
        "generate-weekly-ai-report"
      );
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("AI report generated");
      queryClient.invalidateQueries({ queryKey: ["platform_assistant_summary"] });
    },
    onError: (err) => toast.error(`Report generation failed: ${err.message}`),
  });

  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("platform_alerts")
        .update({
          status: "acknowledged",
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform_assistant_summary"] });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("platform_alerts")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alert resolved");
      queryClient.invalidateQueries({ queryKey: ["platform_assistant_summary"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="font-medium">Failed to load assistant data</p>
            <p className="text-sm text-muted-foreground">{error?.message || "Unknown error"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto shrink-0">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tw = data?.this_week ?? {};
  const pw = data?.prev_week ?? {};
  const alerts = data?.alerts ?? [];
  const report = data?.latest_report;
  const trends = data?.trends ?? [];

  // Data freshness
  const latestMetricDate = trends.length > 0 ? trends[trends.length - 1]?.date : null;
  const latestAlertDate = alerts.length > 0 ? alerts[0]?.created_at?.split("T")[0] : null;
  const latestReportDate = report?.created_at ? new Date(report.created_at).toLocaleDateString() : null;
  const hasAnyData = tw.days > 0 || trends.length > 0;

  return (
    <div className="space-y-6">
      {/* Header + Generate + Freshness */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Platform Assistant</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => generateReport.mutate()}
              disabled={generateReport.isPending}
            >
              <Brain className="h-4 w-4 mr-1" />
              {generateReport.isPending ? "Generating…" : "Generate AI Report"}
            </Button>
          </div>
        </div>
        {/* Data Freshness Bar */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Metrics: {latestMetricDate || "No data yet"}
          </span>
          <span className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            Alerts: {latestAlertDate || "None"}
          </span>
          <span className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            AI Report: {latestReportDate || "Not generated yet"}
          </span>
        </div>
      </div>

      {/* This Week Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> This Week Summary
            {tw.period_start && (
              <span className="text-xs text-muted-foreground font-normal">
                {tw.period_start} → {tw.period_end}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasAnyData ? (
            <p className="text-sm text-muted-foreground">
              No daily metrics have been aggregated yet. Run the daily aggregation first.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-4">
              <MetricCard label="Jobs Posted" value={tw.jobs_posted} prevValue={pw.jobs_posted} />
              <MetricCard label="Jobs Completed" value={tw.jobs_completed} prevValue={pw.jobs_completed} />
              <MetricCard label="Conversations" value={tw.total_conversations} />
              <MetricCard label="New Users" value={tw.new_users} prevValue={pw.new_users} />
              <MetricCard label="Response Rate" value={tw.avg_response_rate} prevValue={pw.avg_response_rate} suffix="%" />
              <MetricCard label="Success Rate" value={tw.avg_success_rate} prevValue={pw.avg_success_rate} suffix="%" />
              <MetricCard label="Dispute Rate" value={tw.avg_dispute_rate} prevValue={pw.avg_dispute_rate} suffix="%" invertColors />
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis — show placeholder when no report */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" /> AI Analysis
            {report && (
              <span className="text-xs text-muted-foreground font-normal">
                Week of {report.report_week}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!report ? (
            <p className="text-sm text-muted-foreground">
              No AI report has been generated yet. Click "Generate AI Report" above to create one.
            </p>
          ) : report.ai_analysis && report.ai_analysis !== "AI analysis unavailable this week." && report.ai_analysis !== "No metrics data available for analysis." ? (
            <>
              <div className="prose prose-sm max-w-none text-foreground">
                {report.ai_analysis.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {report.issues?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Issues Identified
                  </h4>
                  {report.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className={SEVERITY_COLORS[issue.severity] || ""}>
                        {issue.severity}
                      </Badge>
                      <div>
                        <span className="font-medium">{issue.title}</span>
                        <span className="text-muted-foreground"> — {issue.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              AI analysis was not available for this report. Metrics and alerts are still shown below.
            </div>
          )}
        </CardContent>
      </Card>



      {/* Recommendations */}
      {report?.recommendations?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${PRIORITY_COLORS[rec.priority] || ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{rec.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{rec.action}</p>
                  {rec.expected_impact && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected impact: {rec.expected_impact}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" /> Active Alerts
            {alerts.length > 0 && (
              <Badge variant="secondary">{alerts.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              No active alerts — everything looks good.
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Badge className={SEVERITY_COLORS[alert.severity] || ""}>
                    {alert.severity}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.body}</p>
                    {alert.metric_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alert.metric_date}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {alert.status === "open" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acknowledgeAlert.mutate(alert.id)}
                        title="Acknowledge"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resolveAlert.mutate(alert.id)}
                      title="Resolve"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4-Week Trends */}
      {trends.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> 4-Week Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendChart
                data={trends}
                dataKey="success_rate"
                label="Success Rate %"
                color="hsl(var(--primary))"
              />
              <TrendChart
                data={trends}
                dataKey="response_rate"
                label="Response Rate %"
                color="hsl(var(--accent-foreground))"
              />
              <TrendChart
                data={trends}
                dataKey="dispute_rate"
                label="Dispute Rate %"
                color="hsl(var(--destructive))"
              />
              <TrendChart
                data={trends}
                dataKey="jobs_posted"
                label="Jobs Posted"
                color="hsl(var(--accent-foreground))"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TrendChart({
  data,
  dataKey,
  label,
  color,
}: {
  data: Array<Record<string, any>>;
  dataKey: string;
  label: string;
  color: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => v?.slice(5) || ""}
          />
          <YAxis tick={{ fontSize: 10 }} width={30} />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            labelFormatter={(v) => `Date: ${v}`}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
