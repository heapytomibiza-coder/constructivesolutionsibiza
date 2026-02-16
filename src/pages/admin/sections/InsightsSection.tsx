import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { metricRegistry, allMetricKeys } from "../lib/metricRegistry";
import {
  Map, BarChart3, Users, DollarSign, Zap, AlertTriangle, Repeat, UserCheck, Globe,
} from "lucide-react";

const LEADER_PAGES = [
  {
    path: "/dashboard/admin/insights/market-gap",
    label: "Demand vs Supply",
    description: "Market gap heatmap — find shortages by area + trade",
    icon: Map,
  },
  {
    path: "/dashboard/admin/insights/funnels",
    label: "Conversion Funnels",
    description: "Client + pro journey drop-off analysis",
    icon: BarChart3,
  },
  {
    path: "/dashboard/admin/insights/pro-performance",
    label: "Pro Performance",
    description: "Leaderboard, engagement, and SLA tracking",
    icon: Users,
  },
  {
    path: "/dashboard/admin/insights/pricing",
    label: "Price Intelligence",
    description: "Budget benchmarks and pricing analysis",
    icon: DollarSign,
  },
  {
    path: "/dashboard/admin/insights/trends",
    label: "Trend Radar",
    description: "Week-over-week growth and anomaly detection",
    icon: Zap,
  },
  {
    path: "/dashboard/admin/insights/unanswered-jobs",
    label: "Unanswered Jobs",
    description: "Jobs with no pro response — where demand is unserved",
    icon: AlertTriangle,
  },
  {
    path: "/dashboard/admin/insights/repeat-work",
    label: "Repeat Work & Trust",
    description: "Returning clients and rehired pros — your loyalty moat",
    icon: Repeat,
  },
  {
    path: "/dashboard/admin/insights/onboarding-funnel",
    label: "Onboarding Funnel",
    description: "Step-by-step timing, drop-off, and failure tracking for pro onboarding",
    icon: UserCheck,
  },
  {
    path: "/dashboard/admin/insights/top-sources",
    label: "Top Sources",
    description: "Where users come from — WhatsApp, Instagram, ads, direct",
    icon: Globe,
  },
];

export default function InsightsSection() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Construction Leader Pages */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Decision Pages</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEADER_PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <Card
                key={page.path}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(page.path)}
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{page.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{page.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* All Metric Workspaces */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Metric Workspaces</h2>
        <p className="text-sm text-muted-foreground">
          Click any metric to see trends, filters, and drill into the underlying records.
        </p>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {allMetricKeys.map((key) => {
            const metric = metricRegistry[key];
            const Icon = metric.icon;
            return (
              <Card
                key={key}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/dashboard/admin/insights/${key}`)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{metric.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{metric.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
