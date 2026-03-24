import { useMemo } from "react";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface BudgetBand {
  label: string;
  min: number;
  max: number;
  count: number;
  totalValue: number;
}

const BUDGET_BANDS = [
  { label: "€0–500", min: 0, max: 500 },
  { label: "€500–1k", min: 500, max: 1000 },
  { label: "€1k–3k", min: 1000, max: 3000 },
  { label: "€3k–5k", min: 3000, max: 5000 },
  { label: "€5k–10k", min: 5000, max: 10000 },
  { label: "€10k+", min: 10000, max: Infinity },
];

export default function PricingPage() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["admin", "pricing_jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("category, area, budget_type, budget_value, budget_min, budget_max, status, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const budgetDistribution = useMemo(() => {
    if (!jobs) return [];
    return BUDGET_BANDS.map((band) => {
      const matching = jobs.filter((j) => {
        const val = j.budget_value ?? j.budget_max ?? j.budget_min ?? 0;
        return val >= band.min && val < band.max;
      });
      return {
        label: band.label,
        count: matching.length,
        totalValue: matching.reduce((s, j) => s + (j.budget_value ?? 0), 0),
      };
    });
  }, [jobs]);

  const categoryPricing = useMemo(() => {
    if (!jobs) return [];
    const map = new Map<string, { count: number; totalBudget: number; avgBudget: number }>();
    jobs.forEach((j) => {
      if (!j.category) return;
      const val = j.budget_value ?? j.budget_max ?? j.budget_min ?? 0;
      const existing = map.get(j.category) ?? { count: 0, totalBudget: 0, avgBudget: 0 };
      existing.count += 1;
      existing.totalBudget += val;
      existing.avgBudget = existing.totalBudget / existing.count;
      map.set(j.category, existing);
    });
    return [...map.entries()]
      .map(([cat, stats]) => ({ category: cat, ...stats }))
      .sort((a, b) => b.avgBudget - a.avgBudget);
  }, [jobs]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Price Intelligence" description="Budget distribution and pricing benchmarks across categories. All jobs." />

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[350px] rounded-lg" />
          <Skeleton className="h-[350px] rounded-lg" />
        </div>
      ) : (
        <>
          {/* Budget Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Jobs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Average Budgets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Average Budget by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryPricing.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No pricing data yet</p>
              ) : (
                <div className="space-y-3">
                  {categoryPricing.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="font-medium capitalize">{cat.category.replace(/-/g, " ")}</span>
                        <span className="text-xs text-muted-foreground ml-2">({cat.count} jobs)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Avg €{Math.round(cat.avgBudget).toLocaleString()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Total €{Math.round(cat.totalBudget).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
