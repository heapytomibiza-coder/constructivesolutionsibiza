import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";
import { Clock, TrendingDown, Users, AlertTriangle } from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  basic_info: "Basic Info",
  service_area: "Service Area",
  service_unlock: "Service Selection",
  review: "Review & Go Live",
};

const STEP_ORDER = ["basic_info", "service_area", "service_unlock", "review"];

const HEALTHY_TARGETS: Record<string, number> = {
  basic_info: 45,
  service_area: 30,
  service_unlock: 120,
  review: 20,
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.8)",
  "hsl(var(--primary) / 0.6)",
  "hsl(var(--primary) / 0.4)",
];

interface StepData {
  step: string;
  entered: number;
  completed: number;
  drop_off_count: number;
  drop_off_rate: number;
  avg_seconds: number;
  median_seconds: number;
  min_seconds: number;
  max_seconds: number;
  failure_count: number;
}

interface FunnelResult {
  steps: StepData[];
  total_started: number;
  total_completed_all: number;
}

function useOnboardingFunnel() {
  return useQuery<FunnelResult>({
    queryKey: ["admin", "onboarding-funnel"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_onboarding_funnel");
      if (error) throw error;
      return data as unknown as FunnelResult;
    },
    staleTime: 60_000,
  });
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function OnboardingFunnelPage() {
  const { data, isLoading } = useOnboardingFunnel();

  const sortedSteps = useMemo(() => {
    if (!data?.steps) return [];
    return [...data.steps].sort(
      (a, b) => STEP_ORDER.indexOf(a.step) - STEP_ORDER.indexOf(b.step)
    );
  }, [data]);

  const funnelChart = useMemo(
    () =>
      sortedSteps.map((s) => ({
        step: STEP_LABELS[s.step] || s.step,
        entered: s.entered,
        completed: s.completed,
      })),
    [sortedSteps]
  );

  const overallRate =
    data && data.total_started > 0
      ? Math.round((data.total_completed_all / data.total_started) * 100)
      : 0;

  const worstStep = useMemo(() => {
    if (!sortedSteps.length) return null;
    return sortedSteps.reduce((worst, s) =>
      s.drop_off_rate > worst.drop_off_rate ? s : worst
    );
  }, [sortedSteps]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[350px] rounded-lg" />
      </div>
    );
  }

  const noData = !sortedSteps.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader title="Onboarding Funnel" description="Step-by-step conversion, timing, and drop-off for professional onboarding. Last 30 days." />

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-2xl font-bold tabular-nums">{data?.total_started ?? 0}</p>
              <p className="text-xs text-muted-foreground">Started onboarding</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-2xl font-bold tabular-nums">{data?.total_completed_all ?? 0}</p>
              <p className="text-xs text-muted-foreground">Completed all steps</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-2xl font-bold tabular-nums">{overallRate}%</p>
              <p className="text-xs text-muted-foreground">Overall completion</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {worstStep ? `${worstStep.drop_off_rate}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Worst drop-off{worstStep ? `: ${STEP_LABELS[worstStep.step] || worstStep.step}` : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {noData ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-amber-800 font-medium">
              No onboarding events recorded in the last 30 days.
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Events will appear here once professionals start the onboarding flow.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Funnel bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step-by-Step Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={funnelChart} layout="vertical" barGap={2}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="step" type="category" width={130} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="entered" name="Entered" fill="hsl(var(--primary) / 0.3)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Per-step detail table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Step</th>
                      <th className="pb-2 pr-4 font-medium text-right">Entered</th>
                      <th className="pb-2 pr-4 font-medium text-right">Completed</th>
                      <th className="pb-2 pr-4 font-medium text-right">Drop-off</th>
                      <th className="pb-2 pr-4 font-medium text-right">Avg Time</th>
                      <th className="pb-2 pr-4 font-medium text-right">Median</th>
                      <th className="pb-2 font-medium text-right">Failures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSteps.map((s, i) => {
                      const target = HEALTHY_TARGETS[s.step];
                      const isSlow = target && s.avg_seconds > target * 2;
                      const isHighDropoff = s.drop_off_rate > 30;

                      return (
                        <tr key={s.step} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-medium">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                              />
                              {STEP_LABELS[s.step] || s.step}
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">{s.entered}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">{s.completed}</td>
                          <td className="py-3 pr-4 text-right">
                            <Badge
                              variant={isHighDropoff ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {s.drop_off_rate}%
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            <span className={isSlow ? "text-destructive font-medium" : ""}>
                              {s.avg_seconds > 0 ? formatTime(s.avg_seconds) : "—"}
                            </span>
                            {target && s.avg_seconds > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (target: {formatTime(target)})
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {s.median_seconds > 0 ? formatTime(s.median_seconds) : "—"}
                          </td>
                          <td className="py-3 text-right">
                            {s.failure_count > 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                {s.failure_count}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
