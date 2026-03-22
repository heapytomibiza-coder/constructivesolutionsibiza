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

/* ───────── Strict types ───────── */

interface WeekMetrics {
  days: number;
  jobs_created: number;
  jobs_posted: number;
  jobs_awarded: number;
  jobs_completed: number;
  jobs_disputed: number;
  total_conversations: number;
  total_messages: number;
  new_users: number;
  new_professionals: number;
  jobs_with_zero_responses: number;
  avg_response_rate: number | null;
  avg_success_rate: number | null;
  avg_dispute_rate: number | null;
  avg_wizard_completion: number | null;
  avg_job_score: number | null;
  period_start?: string;
  period_end?: string;
}

interface TrendPoint {
  date: string;
  success_rate: number | null;
  response_rate: number | null;
  dispute_rate: number | null;
  jobs_posted: number;
}

interface PlatformAlert {
  id: string;
  severity: string;
  title: string;
  body: string;
  category: string;
  status: string;
  metric_date: string | null;
  created_at: string;
}

interface ReportIssue {
  title: string;
  severity: string;
  description: string;
}

interface ReportRecommendation {
  title: string;
  priority: string;
  action: string;
  expected_impact: string;
}

type AiAnalysisStatus = "ok" | "unavailable" | "no_data";

interface LatestReport {
  report_week: string;
  ai_analysis: string | null;
  ai_analysis_status: AiAnalysisStatus;
  issues: ReportIssue[];
  recommendations: ReportRecommendation[];
  created_at: string;
}

interface AssistantSummary {
  this_week: WeekMetrics;
  prev_week: WeekMetrics;
  trends: TrendPoint[];
  alerts: PlatformAlert[];
  latest_report: LatestReport | null;
  generated_at: string;
}

/* ───────── Helpers ───────── */

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getUTCFullYear()}`;
};

const formatDelta = (n: number): string =>
  Number.isInteger(n) ? String(n) : n.toFixed(1);

/** Derive AI status from raw report data (backward compat for reports without explicit status) */
function deriveAiStatus(report: {
  ai_analysis: string | null;
  summary_json?: Record<string, unknown>;
}): AiAnalysisStatus {
  // Check structured flag first (new reports)
  const explicit = (report.summary_json as Record<string, unknown> | undefined)
    ?.ai_analysis_status as AiAnalysisStatus | undefined;
  if (explicit) return explicit;

  // Fallback: infer from text
  if (!report.ai_analysis) return "no_data";
  if (
    report.ai_analysis === "AI analysis unavailable this week." ||
    report.ai_analysis === "No metrics data available for analysis."
  )
    return "unavailable";
  return "ok";
}

/* ───────── Data hook ───────── */

function useAssistantSummary() {
  return useQuery({
    queryKey: ["platform_assistant_summary"],
    queryFn: async (): Promise<AssistantSummary> => {
      const { data, error } = await supabase.rpc(
        "get_platform_assistant_summary"
      );
      if (error) throw error;
      const raw = data as unknown as AssistantSummary;

      // Sort alerts client-side (newest first) to guarantee ordering
      if (Array.isArray(raw.alerts)) {
        raw.alerts.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      // Derive AI status for backward compatibility
      if (raw.latest_report) {
        raw.latest_report.ai_analysis_status = deriveAiStatus(
          raw.latest_report as { ai_analysis: string | null; summary_json?: Record<string, unknown> }
        );
      }

      return raw;
    },
    staleTime: 60_000,
  });
}

/* ───────── Constants ───────── */

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

/* ───────── Sub-components ───────── */

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
  if (current == null || previous == null)
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  const delta = current - previous;
  if (delta === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
  const isPositive = delta > 0;
  const isGood = invertColors ? !isPositive : isPositive;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${
        isGood ? "text-primary" : "text-destructive"
      }`}
    >
      {isPositive ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
      {formatDelta(Math.abs(delta))}
      {suffix}
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
      <p className="text-2xl font-bold">
        {value != null ? `${formatDelta(value)}${suffix}` : "—"}
      </p>
      {prevValue !== undefined && (
        <DeltaIndicator
          current={value}
          previous={prevValue}
          suffix={suffix}
          invertColors={invertColors}
        />
      )}
    </div>
  );
}

function TrendChart({
  data,
  dataKey,
  label,
  color,
  isPercentage = false,
}: {
  data: TrendPoint[];
  dataKey: keyof TrendPoint;
  label: string;
  color: string;
  isPercentage?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: string) => v?.slice(5) || ""}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            width={30}
            domain={isPercentage ? [0, 100] : ["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            labelFormatter={(v: string) => `Date: ${v}`}
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

/* ───────── Main component ───────── */

export function PlatformAssistant() {
  const { data, isLoading, isError, error, refetch } = useAssistantSummary();
  const queryClient = useQueryClient();
  const [backfillFrom, setBackfillFrom] = useState("2026-02-15");
  const [backfillTo, setBackfillTo] = useState(
    new Date(Date.now() - 86400000).toISOString().split("T")[0]
  );

  const generateReport = useMutation({
    mutationFn: async () => {
      const { data: result, error } = await supabase.functions.invoke(
        "generate-weekly-ai-report"
      );
      if (error) throw error;
      return result;
    },
    onSuccess: async () => {
      toast.success("AI report generated");
      await queryClient.invalidateQueries({
        queryKey: ["platform_assistant_summary"],
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Report generation failed: ${message}`);
    },
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
      queryClient.invalidateQueries({
        queryKey: ["platform_assistant_summary"],
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Acknowledge failed: ${message}`);
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
      queryClient.invalidateQueries({
        queryKey: ["platform_assistant_summary"],
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Resolve failed: ${message}`);
    },
  });

  const backfillMetrics = useMutation({
    mutationFn: async () => {
      const startDate = new Date(backfillFrom);
      const endDate = new Date(backfillTo);
      let daysProcessed = 0;
      let totalAlerts = 0;

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];
        const { error } = await supabase.rpc("aggregate_daily_metrics", {
          p_date: dateStr,
        });
        if (error)
          throw new Error(
            `Aggregation failed for ${dateStr}: ${error.message}`
          );
        daysProcessed++;
      }

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];
        const { data: alertCount, error } = await supabase.rpc(
          "run_platform_alert_rules",
          { p_date: dateStr }
        );
        if (error)
          throw new Error(
            `Alert rules failed for ${dateStr}: ${error.message}`
          );
        totalAlerts += (alertCount as number) || 0;
      }

      return { daysProcessed, totalAlerts };
    },
    onSuccess: (result) => {
      toast.success(
        `Backfill complete: ${result.daysProcessed} days, ${result.totalAlerts} alerts generated`
      );
      queryClient.invalidateQueries({
        queryKey: ["platform_assistant_summary"],
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Backfill failed: ${message}`);
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
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="ml-auto shrink-0"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tw: Partial<WeekMetrics> = data?.this_week ?? {};
  const pw: Partial<WeekMetrics> = data?.prev_week ?? {};
  const openAlerts = (data?.alerts ?? []).filter((a) => a.status === "open");
  const acknowledgedAlerts = (data?.alerts ?? []).filter(
    (a) => a.status === "acknowledged"
  );
  const allAlerts = [...openAlerts, ...acknowledgedAlerts];
  const report = data?.latest_report ?? null;
  const trends = data?.trends ?? [];

  // Data freshness
  const latestMetricDate =
    trends.length > 0 ? trends[trends.length - 1]?.date : null;
  const latestAlertDate =
    allAlerts.length > 0 ? allAlerts[0]?.created_at?.split("T")[0] : null;
  const latestReportDate = report?.created_at
    ? formatDate(report.created_at)
    : null;
  const hasAnyData = (tw.days ?? 0) > 0 || trends.length > 0;

  const aiStatus: AiAnalysisStatus =
    report?.ai_analysis_status ?? "no_data";

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
              No daily metrics have been aggregated yet. Run the daily
              aggregation first.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-4">
              <MetricCard
                label="Jobs Posted"
                value={tw.jobs_posted ?? null}
                prevValue={pw.jobs_posted ?? null}
              />
              <MetricCard
                label="Jobs Completed"
                value={tw.jobs_completed ?? null}
                prevValue={pw.jobs_completed ?? null}
              />
              <MetricCard
                label="Conversations"
                value={tw.total_conversations ?? null}
              />
              <MetricCard
                label="New Users"
                value={tw.new_users ?? null}
                prevValue={pw.new_users ?? null}
              />
              <MetricCard
                label="Response Rate"
                value={tw.avg_response_rate ?? null}
                prevValue={pw.avg_response_rate ?? null}
                suffix="%"
              />
              <MetricCard
                label="Success Rate"
                value={tw.avg_success_rate ?? null}
                prevValue={pw.avg_success_rate ?? null}
                suffix="%"
              />
              <MetricCard
                label="Dispute Rate"
                value={tw.avg_dispute_rate ?? null}
                prevValue={pw.avg_dispute_rate ?? null}
                suffix="%"
                invertColors
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis */}
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
              No AI report has been generated yet. Click "Generate AI Report"
              above to create one.
            </p>
          ) : aiStatus === "ok" ? (
            <>
              <div className="prose prose-sm max-w-none text-foreground">
                {(report.ai_analysis ?? "").split("\n\n").map((p, i) => (
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
                      <Badge
                        variant="outline"
                        className={SEVERITY_COLORS[issue.severity] || ""}
                      >
                        {issue.severity}
                      </Badge>
                      <div>
                        <span className="font-medium">{issue.title}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          — {issue.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              {aiStatus === "unavailable"
                ? "AI analysis was not available for this report. Metrics and alerts are still shown below."
                : "No metrics data was available for AI analysis."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report?.recommendations && report.recommendations.length > 0 && (
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
                  className={`rounded-lg border p-3 ${
                    PRIORITY_COLORS[rec.priority] || ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{rec.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rec.action}
                  </p>
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

      {/* Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" /> Alerts
            {allAlerts.length > 0 && (
              <Badge variant="secondary">{allAlerts.length}</Badge>
            )}
            {openAlerts.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {openAlerts.length} open
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allAlerts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              No active alerts — everything looks good.
            </div>
          ) : (
            <div className="space-y-2">
              {allAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Badge className={SEVERITY_COLORS[alert.severity] || ""}>
                    {alert.severity}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.body}
                    </p>
                    <div className="flex gap-2 mt-0.5">
                      {alert.metric_date && (
                        <p className="text-xs text-muted-foreground">
                          {alert.metric_date}
                        </p>
                      )}
                      {alert.status === "acknowledged" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0"
                        >
                          Acknowledged
                        </Badge>
                      )}
                    </div>
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
                isPercentage
              />
              <TrendChart
                data={trends}
                dataKey="response_rate"
                label="Response Rate %"
                color="hsl(var(--accent-foreground))"
                isPercentage
              />
              <TrendChart
                data={trends}
                dataKey="dispute_rate"
                label="Dispute Rate %"
                color="hsl(var(--destructive))"
                isPercentage
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

      {/* Backfill Metrics Utility */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" /> Backfill Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Re-aggregate daily metrics and generate alerts for a date range.
            Useful after fixing aggregation logic or catching up after downtime.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input
                type="date"
                value={backfillFrom}
                onChange={(e) => setBackfillFrom(e.target.value)}
                className="h-9 w-40 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input
                type="date"
                value={backfillTo}
                onChange={(e) => setBackfillTo(e.target.value)}
                className="h-9 w-40 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => backfillMetrics.mutate()}
              disabled={backfillMetrics.isPending}
            >
              <Database className="h-4 w-4 mr-1" />
              {backfillMetrics.isPending ? "Processing…" : "Run Backfill"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
