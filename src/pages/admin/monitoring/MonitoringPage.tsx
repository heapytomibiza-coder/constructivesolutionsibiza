/**
 * ADMIN MONITORING PAGE
 *
 * Shows error counts, recent tester reports, and most broken pages
 * from the Lighthouse Monitor telemetry tables.
 */

import { forwardRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertTriangle, Bug, Globe, Wifi, RefreshCw, MessageSquare, ExternalLink, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { contactBugReporter } from "../actions/contactBugReporter.action";

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

function useErrorStats() {
  return useQuery({
    queryKey: ["admin", "monitoring", "error-stats"],
    queryFn: async () => {
      const now = new Date();
      const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const h7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [errors24, errors7d, networkFails, openReports] = await Promise.all([
        supabase.from("error_events").select("id", { count: "exact", head: true }).gte("created_at", h24),
        supabase.from("error_events").select("id", { count: "exact", head: true }).gte("created_at", h7d),
        supabase.from("network_failures").select("id", { count: "exact", head: true }).gte("created_at", h24),
        supabase.from("tester_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      ]);

      return {
        errors24h: errors24.count ?? 0,
        errors7d: errors7d.count ?? 0,
        networkFails24h: networkFails.count ?? 0,
        openReports: openReports.count ?? 0,
      };
    },
    refetchInterval: 30_000,
  });
}

function useRecentErrors() {
  return useQuery({
    queryKey: ["admin", "monitoring", "recent-errors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("error_events")
        .select("id, error_type, message, route, created_at, browser, viewport")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
    refetchInterval: 30_000,
  });
}

function useRecentReports() {
  return useQuery({
    queryKey: ["admin", "monitoring", "recent-reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tester_reports")
        .select("id, description, url, route, browser, viewport, status, context, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
    refetchInterval: 30_000,
  });
}

function useBrokenPages() {
  return useQuery({
    queryKey: ["admin", "monitoring", "broken-pages"],
    queryFn: async () => {
      const h7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("error_events")
        .select("route")
        .gte("created_at", h7d);

      if (!data?.length) return [];

      const counts: Record<string, number> = {};
      for (const row of data) {
        const r = row.route || "(unknown)";
        counts[r] = (counts[r] || 0) + 1;
      }

      return Object.entries(counts)
        .map(([route, count]) => ({ route, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
    },
    refetchInterval: 30_000,
  });
}

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

const StatCard = forwardRef<HTMLDivElement, {
  label: string;
  value: number;
  icon: React.ElementType;
  variant?: "default" | "warning" | "danger";
}>(function StatCard({ label, value, icon: Icon, variant = "default" }, ref) {
  const colors = {
    default: "text-muted-foreground",
    warning: "text-yellow-600",
    danger: "text-destructive",
  };

  return (
    <Card ref={ref}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`rounded-lg bg-muted p-2.5 ${colors[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
});

const errorTypeBadge: Record<string, string> = {
  runtime: "bg-red-100 text-red-800",
  promise: "bg-orange-100 text-orange-800",
  console: "bg-yellow-100 text-yellow-800",
  network: "bg-blue-100 text-blue-800",
};

const reportStatusBadge: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  reviewed: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const MonitoringPage = forwardRef<HTMLDivElement>(function MonitoringPage(_props, ref) {
  const stats = useErrorStats();
  const errors = useRecentErrors();
  const reports = useRecentReports();
  const broken = useBrokenPages();

  const refetchAll = () => {
    stats.refetch();
    errors.refetch();
    reports.refetch();
    broken.refetch();
  };

  return (
    <div ref={ref} className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <Link to="/dashboard/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Lighthouse Monitor</h1>
              <p className="text-sm text-muted-foreground">Error tracking &amp; tester reports</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refetchAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="container space-y-6 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Errors (24h)"
            value={stats.data?.errors24h ?? 0}
            icon={AlertTriangle}
            variant={stats.data?.errors24h ? "danger" : "default"}
          />
          <StatCard
            label="Errors (7d)"
            value={stats.data?.errors7d ?? 0}
            icon={AlertTriangle}
          />
          <StatCard
            label="Network fails (24h)"
            value={stats.data?.networkFails24h ?? 0}
            icon={Wifi}
            variant={stats.data?.networkFails24h ? "warning" : "default"}
          />
          <StatCard
            label="Open reports"
            value={stats.data?.openReports ?? 0}
            icon={Bug}
            variant={stats.data?.openReports ? "danger" : "default"}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="errors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="errors">Recent Errors</TabsTrigger>
            <TabsTrigger value="reports">Tester Reports</TabsTrigger>
            <TabsTrigger value="broken">Most Broken Pages</TabsTrigger>
          </TabsList>

          {/* Errors tab */}
          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Last 50 Errors</CardTitle>
              </CardHeader>
              <CardContent>
                {!errors.data?.length ? (
                  <p className="py-8 text-center text-muted-foreground">No errors captured yet</p>
                ) : (
                  <div className="space-y-2">
                    {errors.data.map((e) => (
                      <div key={e.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${errorTypeBadge[e.error_type] ?? "bg-muted"}`}>
                                {e.error_type}
                              </span>
                              <span className="text-xs text-muted-foreground">{e.route}</span>
                            </div>
                            <p className="font-mono text-xs leading-relaxed text-foreground/90 break-all">
                              {(e.message ?? "").slice(0, 300)}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {format(new Date(e.created_at), "MMM d HH:mm")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tester Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {!reports.data?.length ? (
                  <p className="py-8 text-center text-muted-foreground">No reports submitted yet</p>
                ) : (
                  <div className="space-y-3">
                    {reports.data.map((r) => (
                      <div key={r.id} className="rounded-lg border p-4 text-sm">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${reportStatusBadge[r.status] ?? "bg-muted"}`}>
                            {r.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(r.created_at), "MMM d HH:mm")}
                          </span>
                        </div>
                        <p className="mb-2 font-medium">{r.description}</p>
                        <div className="space-y-0.5 text-xs text-muted-foreground">
                          <p>Route: {r.route}</p>
                          <p className="truncate">Browser: {(r.browser ?? "").slice(0, 60)}</p>
                          <p>Viewport: {r.viewport}</p>
                        </div>
                        {r.context && typeof r.context === "object" && (
                          <details className="mt-2 rounded bg-muted/50 p-2 text-xs">
                            <summary className="cursor-pointer font-medium">Context</summary>
                            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all">
                              {JSON.stringify(r.context, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Broken pages tab */}
          <TabsContent value="broken">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Broken Pages (7d)</CardTitle>
              </CardHeader>
              <CardContent>
                {!broken.data?.length ? (
                  <p className="py-8 text-center text-muted-foreground">No error data yet</p>
                ) : (
                  <div className="space-y-1">
                    {broken.data.map((b, i) => (
                      <div key={b.route} className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center text-xs font-bold text-muted-foreground">
                            {i + 1}
                          </span>
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <code className="text-xs">{b.route}</code>
                        </div>
                        <Badge variant="secondary">{b.count} errors</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});

export default MonitoringPage;
