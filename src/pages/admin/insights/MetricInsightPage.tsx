import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MetricTrendChart } from "../components/MetricTrendChart";
import { InsightFilterBar } from "../components/InsightFilterBar";
import { DrilldownTable } from "../components/DrilldownTable";
import { useAdminMetricDrilldown } from "../hooks/useAdminMetricDrilldown";
import { metricRegistry, type AdminMetricKey } from "../lib/metricRegistry";
import { useAdminDrawer } from "../context/AdminDrawerContext";
import { subDays } from "date-fns";

const JOB_METRICS: string[] = ["jobs_posted", "open_jobs", "completed_jobs", "active_jobs"];
const USER_METRICS: string[] = ["new_users", "new_pros"];

export default function MetricInsightPage() {
  const { metricKey } = useParams<{ metricKey: string }>();
  const navigate = useNavigate();
  const metric = metricRegistry[metricKey as AdminMetricKey];
  const { openDrawer } = useAdminDrawer();

  const [area, setArea] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const now = useMemo(() => new Date().toISOString(), []);
  const from = useMemo(
    () => subDays(new Date(), metric?.defaultTimeframeDays ?? 30).toISOString(),
    [metric]
  );

  // Reset pagination when filters change
  useEffect(() => setPage(0), [area, category, metricKey]);

  const { data: drilldownRows, isLoading: drilldownLoading } = useAdminMetricDrilldown({
    metric: metricKey as AdminMetricKey,
    from,
    to: now,
    area,
    category,
    limit: pageSize,
    offset: page * pageSize,
  });

  const handleExportCSV = () => {
    if (!drilldownRows?.length || !metric) return;
    const headers = metric.drilldownColumns.map((c) => c.label).join(",");
    const rows = drilldownRows.map((row) =>
      metric.drilldownColumns.map((c) => `"${String(row[c.key] ?? "")}"`).join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${metricKey}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!metric) {
    return (
      <div className="container py-8 text-center text-muted-foreground">
        Unknown metric: {metricKey}
      </div>
    );
  }

  const Icon = metric.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Icon className="h-6 w-6 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{metric.label}</h1>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  {metric.description}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricTrendChart metric={metricKey as AdminMetricKey} area={area} category={category} />
          </CardContent>
        </Card>

        {/* Filters */}
        <InsightFilterBar
          area={area}
          onAreaChange={setArea}
          category={category}
          onCategoryChange={setCategory}
          onExportCSV={handleExportCSV}
        />

        {/* Drilldown Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Records</CardTitle>
          </CardHeader>
          <CardContent>
            <DrilldownTable
              columns={metric.drilldownColumns}
              rows={drilldownRows ?? []}
              isLoading={drilldownLoading}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onRowClick={(row) => {
                const id = row.id as string | undefined;
                if (!id) return;
                if (JOB_METRICS.includes(metricKey as string)) {
                  openDrawer({ type: "job", id });
                } else if (USER_METRICS.includes(metricKey as string)) {
                  openDrawer({ type: "user", id });
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

