import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminMetricTimeseries } from "../hooks/useAdminMetricTimeseries";
import { TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { subDays } from "date-fns";

const CATEGORIES = [
  "electrical", "plumbing", "carpentry", "hvac", "construction",
  "kitchen-bathroom", "pool-spa", "handyman", "gardening-landscaping",
];

function TrendCard({ category }: { category: string }) {
  const now = useMemo(() => new Date().toISOString(), []);
  const thisWeekFrom = useMemo(() => subDays(new Date(), 7).toISOString(), []);
  const lastWeekFrom = useMemo(() => subDays(new Date(), 14).toISOString(), []);

  const { data: thisWeek, isLoading: l1 } = useAdminMetricTimeseries({
    metric: "jobs_posted", from: thisWeekFrom, to: now, category,
  });
  const { data: lastWeek, isLoading: l2 } = useAdminMetricTimeseries({
    metric: "jobs_posted", from: lastWeekFrom, to: thisWeekFrom, category,
  });

  const isLoading = l1 || l2;
  const thisTotal = thisWeek?.reduce((s, p) => s + p.value, 0) ?? 0;
  const lastTotal = lastWeek?.reduce((s, p) => s + p.value, 0) ?? 0;
  const pctChange = lastTotal === 0
    ? (thisTotal > 0 ? 100 : 0)
    : Math.round(((thisTotal - lastTotal) / lastTotal) * 100);

  const isUp = pctChange > 0;
  const isDown = pctChange < 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-2">
        {isUp ? <TrendingUp className="h-4 w-4 text-emerald-600" /> :
         isDown ? <TrendingDown className="h-4 w-4 text-red-600" /> :
         <Minus className="h-4 w-4 text-muted-foreground" />}
        <span className="font-medium capitalize">{category.replace(/-/g, " ")}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-6 w-20" />
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm">{thisTotal} jobs</span>
          <Badge
            variant="outline"
            className={`text-xs ${
              isUp ? "text-emerald-600 border-emerald-200" :
              isDown ? "text-red-600 border-red-200" :
              ""
            }`}
          >
            {isUp ? "+" : ""}{pctChange}%
          </Badge>
        </div>
      )}
    </div>
  );
}

export default function TrendRadarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Trend Radar
        </h2>
        <p className="text-sm text-muted-foreground">
          Week-over-week growth by category. Spot emerging demand and seasonal shifts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Trends (This Week vs Last Week)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {CATEGORIES.map((cat) => (
            <TrendCard key={cat} category={cat} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Coming soon:</strong> Anomaly detection, seasonal pattern analysis,
            and external signals (planning permits, weather impacts) will be added as data volume grows.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
