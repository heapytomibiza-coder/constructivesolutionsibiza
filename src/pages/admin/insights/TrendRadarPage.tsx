import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { subDays } from "date-fns";

interface CategoryTrend {
  category: string;
  this_week: number;
  last_week: number;
  pct_change: number;
}

function useCategoryTrends() {
  const now = useMemo(() => new Date(), []);
  const thisWeekFrom = useMemo(() => subDays(now, 7).toISOString(), [now]);
  const lastWeekFrom = useMemo(() => subDays(now, 14).toISOString(), [now]);
  const nowIso = useMemo(() => now.toISOString(), [now]);

  return useQuery({
    queryKey: ["admin", "category_trends", thisWeekFrom],
    queryFn: async (): Promise<CategoryTrend[]> => {
      // Fetch all active categories
      const { data: cats } = await supabase
        .from("service_categories")
        .select("slug, name")
        .eq("is_active", true)
        .order("display_order");

      // Fetch this week's jobs grouped by category
      const { data: thisWeekJobs } = await supabase
        .from("jobs")
        .select("category")
        .eq("status", "open")
        .eq("is_publicly_listed", true)
        .gte("created_at", thisWeekFrom)
        .lte("created_at", nowIso);

      // Fetch last week's jobs grouped by category
      const { data: lastWeekJobs } = await supabase
        .from("jobs")
        .select("category")
        .eq("status", "open")
        .eq("is_publicly_listed", true)
        .gte("created_at", lastWeekFrom)
        .lt("created_at", thisWeekFrom);

      const thisMap = new Map<string, number>();
      const lastMap = new Map<string, number>();

      thisWeekJobs?.forEach((j) => {
        if (j.category) thisMap.set(j.category, (thisMap.get(j.category) ?? 0) + 1);
      });
      lastWeekJobs?.forEach((j) => {
        if (j.category) lastMap.set(j.category, (lastMap.get(j.category) ?? 0) + 1);
      });

      return (cats ?? []).map((c) => {
        const tw = thisMap.get(c.slug) ?? 0;
        const lw = lastMap.get(c.slug) ?? 0;
        const pct = lw === 0
          ? (tw > 0 ? 100 : 0)
          : Math.round(((tw - lw) / lw) * 100);
        return { category: c.name, this_week: tw, last_week: lw, pct_change: pct };
      });
    },
    staleTime: 60_000,
  });
}

export default function TrendRadarPage() {
  const { data: trends, isLoading } = useCategoryTrends();

  // Sort by absolute activity (this_week desc)
  const sorted = useMemo(() => {
    if (!trends) return [];
    return [...trends].sort((a, b) => b.this_week - a.this_week);
  }, [trends]);

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
          {isLoading ? (
            <>
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </>
          ) : sorted.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No categories found</p>
          ) : (
            sorted.map((trend) => {
              const isUp = trend.pct_change > 0;
              const isDown = trend.pct_change < 0;
              return (
                <div key={trend.category} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    {isUp ? <TrendingUp className="h-4 w-4 text-emerald-600" /> :
                     isDown ? <TrendingDown className="h-4 w-4 text-red-600" /> :
                     <Minus className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-medium">{trend.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{trend.this_week} jobs</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isUp ? "text-emerald-600 border-emerald-200" :
                        isDown ? "text-red-600 border-red-200" :
                        ""
                      }`}
                    >
                      {isUp ? "+" : ""}{trend.pct_change}%
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
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
