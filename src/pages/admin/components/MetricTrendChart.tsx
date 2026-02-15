import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminMetricTimeseries, type MetricPoint } from "../hooks/useAdminMetricTimeseries";
import { DeltaBadge } from "./DeltaBadge";
import type { AdminMetricKey } from "../lib/metricRegistry";
import { format, subDays } from "date-fns";

interface MetricTrendChartProps {
  metric: AdminMetricKey;
  area?: string | null;
  category?: string | null;
}

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

export function MetricTrendChart({ metric, area, category }: MetricTrendChartProps) {
  const [rangeDays, setRangeDays] = useState(30);

  const now = useMemo(() => new Date().toISOString(), []);
  const from = useMemo(() => subDays(new Date(), rangeDays).toISOString(), [rangeDays]);
  const prevFrom = useMemo(() => subDays(new Date(), rangeDays * 2).toISOString(), [rangeDays]);

  const { data, isLoading } = useAdminMetricTimeseries({
    metric, from, to: now, bucket: rangeDays <= 7 ? "hour" : "day", area, category,
  });
  const { data: prevData } = useAdminMetricTimeseries({
    metric, from: prevFrom, to: from, bucket: "day", area, category,
  });

  const currentTotal = useMemo(() => data?.reduce((s, p) => s + p.value, 0) ?? 0, [data]);
  const prevTotal = useMemo(() => prevData?.reduce((s, p) => s + p.value, 0) ?? 0, [prevData]);

  const chartData = useMemo(() =>
    (data ?? []).map((p) => ({
      date: format(new Date(p.bucket_start), rangeDays <= 7 ? "MMM d HH:mm" : "MMM d"),
      value: p.value,
    })),
    [data, rangeDays]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold">{currentTotal}</span>
          <DeltaBadge current={currentTotal} previous={prevTotal} suffix={`vs prior ${rangeDays}d`} />
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.label}
              size="sm"
              variant={rangeDays === r.days ? "default" : "outline"}
              onClick={() => setRangeDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[250px] w-full rounded-lg" />
      ) : chartData.length === 0 ? (
        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 13 }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary) / 0.15)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
