import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminMetricTimeseries } from "../hooks/useAdminMetricTimeseries";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { subDays } from "date-fns";



const COLORS = ["hsl(var(--primary))", "hsl(var(--primary) / 0.8)", "hsl(var(--primary) / 0.6)", "hsl(var(--primary) / 0.4)", "hsl(var(--primary) / 0.3)"];

export default function FunnelsPage() {
  const now = useMemo(() => new Date().toISOString(), []);
  const from = useMemo(() => subDays(new Date(), 30).toISOString(), []);

  // Use available metrics for funnel approximation
  const { data: jobsPosted, isLoading: l1 } = useAdminMetricTimeseries({ metric: "jobs_posted", from, to: now });
  const { data: conversations, isLoading: l2 } = useAdminMetricTimeseries({ metric: "conversations", from, to: now });
  const { data: completed, isLoading: l3 } = useAdminMetricTimeseries({ metric: "completed_jobs", from, to: now });
  const { data: newUsers, isLoading: l4 } = useAdminMetricTimeseries({ metric: "new_users", from, to: now });
  const { data: newPros, isLoading: l5 } = useAdminMetricTimeseries({ metric: "new_pros", from, to: now });

  const isLoading = l1 || l2 || l3 || l4 || l5;

  const sum = (d: typeof jobsPosted) => d?.reduce((s, p) => s + p.value, 0) ?? 0;

  const clientFunnel = useMemo(() => [
    { step: "New Users", value: sum(newUsers) },
    { step: "Jobs Posted", value: sum(jobsPosted) },
    { step: "Conversations", value: sum(conversations) },
    { step: "Completed", value: sum(completed) },
  ], [newUsers, jobsPosted, conversations, completed]);

  const proFunnel = useMemo(() => [
    { step: "Pro Signups", value: sum(newPros) },
    { step: "Conversations", value: sum(conversations) },
    { step: "Jobs Completed", value: sum(completed) },
  ], [newPros, conversations, completed]);

  const calcDropoff = (funnel: { step: string; value: number }[]) =>
    funnel.map((item, i) => ({
      ...item,
      dropoff: i === 0 ? 0 : funnel[i - 1].value === 0 ? 0 :
        Math.round((1 - item.value / funnel[i - 1].value) * 100),
    }));

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Conversion Funnels" description="Track drop-offs across client and professional journeys. Last 30 days." />

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[350px] rounded-lg" />
          <Skeleton className="h-[350px] rounded-lg" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Client Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={clientFunnel} layout="vertical">
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="step" type="category" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {clientFunnel.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-1">
                {calcDropoff(clientFunnel).map((item) => (
                  <div key={item.step} className="flex items-center justify-between text-sm">
                    <span>{item.step}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.value}</span>
                      {item.dropoff > 0 && (
                        <Badge variant="outline" className="text-xs text-red-600">
                          -{item.dropoff}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pro Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Professional Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={proFunnel} layout="vertical">
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="step" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {proFunnel.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-1">
                {calcDropoff(proFunnel).map((item) => (
                  <div key={item.step} className="flex items-center justify-between text-sm">
                    <span>{item.step}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.value}</span>
                      {item.dropoff > 0 && (
                        <Badge variant="outline" className="text-xs text-red-600">
                          -{item.dropoff}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-amber-800 font-semibold">
            ⚠️ Funnels are approximated until event instrumentation is complete.
          </p>
          <p className="text-sm text-amber-700">
            These funnels use aggregate platform metrics as a proxy. Once <code className="bg-amber-100 px-1 rounded">trackEvent()</code> is
            instrumented, funnels will show per-step drop-off with precise conversion rates and time-between-steps analysis.
          </p>
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Instrumentation checklist:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
              <li>Instrument wizard step events (<code className="text-xs bg-amber-100 px-1 rounded">job_wizard_started</code>, <code className="text-xs bg-amber-100 px-1 rounded">job_step_completed</code>)</li>
              <li>Instrument onboarding step events (<code className="text-xs bg-amber-100 px-1 rounded">pro_signup_started</code>, <code className="text-xs bg-amber-100 px-1 rounded">pro_scope_selected</code>)</li>
              <li>Instrument conversation + first reply timestamps (<code className="text-xs bg-amber-100 px-1 rounded">lead_received</code>, <code className="text-xs bg-amber-100 px-1 rounded">replied</code>)</li>
              <li>Instrument hire + completion events (<code className="text-xs bg-amber-100 px-1 rounded">hire_initiated</code>, <code className="text-xs bg-amber-100 px-1 rounded">review_submitted</code>)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
