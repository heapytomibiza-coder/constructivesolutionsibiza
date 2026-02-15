import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketGap } from "../hooks/useMarketGap";
import { subDays } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function gapColor(score: number): string {
  if (score >= 0.7) return "bg-red-100 text-red-800 border-red-200";
  if (score >= 0.5) return "bg-amber-100 text-amber-800 border-amber-200";
  if (score >= 0.3) return "bg-yellow-50 text-yellow-800 border-yellow-200";
  return "bg-emerald-50 text-emerald-800 border-emerald-200";
}

export default function MarketGapPage() {
  const now = useMemo(() => new Date().toISOString(), []);
  const from = useMemo(() => subDays(new Date(), 30).toISOString(), []);
  const { data, isLoading } = useMarketGap(from, now);

  // Build grid structure
  const areas = useMemo(() => [...new Set(data?.map((d) => d.area) ?? [])].sort(), [data]);
  const categories = useMemo(() => [...new Set(data?.map((d) => d.category) ?? [])].sort(), [data]);
  const lookup = useMemo(() => {
    const m = new Map<string, typeof data extends (infer T)[] ? T : never>();
    data?.forEach((d) => m.set(`${d.area}|${d.category}`, d));
    return m;
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Demand vs Supply Heatmap</h2>
        <p className="text-sm text-muted-foreground">
          Market Gap Index — red = shortage, green = well-served. Last 30 days.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-[400px] w-full rounded-lg" />
      ) : areas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No demand/supply data yet. Post jobs and onboard professionals to populate this view.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 font-medium text-muted-foreground border-b">Area</th>
                {categories.map((cat) => (
                  <th key={cat} className="p-2 font-medium text-muted-foreground border-b text-center capitalize">
                    {cat.replace(/-/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => (
                <tr key={area}>
                  <td className="p-2 font-medium border-b whitespace-nowrap">{area}</td>
                  {categories.map((cat) => {
                    const cell = lookup.get(`${area}|${cat}`);
                    if (!cell) {
                      return (
                        <td key={cat} className="p-2 border-b text-center">
                          <span className="text-muted-foreground">—</span>
                        </td>
                      );
                    }
                    return (
                      <td key={cat} className="p-2 border-b text-center">
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge className={`${gapColor(cell.gap_score)} text-xs`}>
                              {cell.gap_score.toFixed(2)}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            <div>Demand: {cell.demand_count} jobs (€{cell.total_budget.toLocaleString()})</div>
                            <div>Supply: {cell.supply_count} pros</div>
                            <div className="font-bold mt-1">Gap Score: {cell.gap_score.toFixed(2)}</div>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top Gaps */}
      {data && data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Shortages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.filter((d) => d.gap_score >= 0.5).slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
                  <div>
                    <span className="font-medium capitalize">{d.category.replace(/-/g, " ")}</span>
                    <span className="text-muted-foreground"> in </span>
                    <span className="font-medium">{d.area}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span>{d.demand_count} jobs</span>
                    <span className="text-muted-foreground">vs</span>
                    <span>{d.supply_count} pros</span>
                    <Badge className={gapColor(d.gap_score)}>
                      {d.gap_score.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))}
              {data.filter((d) => d.gap_score >= 0.5).length === 0 && (
                <p className="text-sm text-muted-foreground">No significant shortages detected.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
