import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Share2, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Json } from "@/integrations/supabase/types";

interface SourceRow {
  source: string;
  utm_medium: string | null;
  utm_campaign: string | null;
  sessions: number;
  signups: number;
  jobs_posted: number;
  conversion_rate: number;
}

export default function TopSourcesPage() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);

  const fromTs = new Date(Date.now() - days * 86400000).toISOString();
  const toTs = new Date().toISOString();

  // Use admin-gated SECURITY DEFINER RPC instead of direct table query
  const { data: sources, isLoading } = useQuery({
    queryKey: ["admin", "top-sources", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_top_sources", {
        p_from_ts: fromTs,
        p_to_ts: toTs,
      });

      if (error) throw error;
      if (!data) return [];

      return (data as unknown as SourceRow[]).map((r) => ({
        source: r.source || "Direct",
        utm_medium: r.utm_medium,
        utm_campaign: r.utm_campaign,
        sessions: Number(r.sessions) || 0,
        signups: Number(r.signups) || 0,
        jobs_posted: Number(r.jobs_posted) || 0,
        conversion_rate: Number(r.conversion_rate) || 0,
      }));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/admin?tab=insights")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Top Sources</h1>
          <p className="text-sm text-muted-foreground">
            Where your users come from — WhatsApp, Instagram, ads, or direct.
          </p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <Button
            key={d}
            variant={days === d ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(d)}
          >
            {d}d
          </Button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{sources?.reduce((s, r) => s + r.sessions, 0) ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total sessions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Share2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{sources?.reduce((s, r) => s + r.signups, 0) ?? 0}</p>
              <p className="text-xs text-muted-foreground">Signups from tracked sources</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{sources?.reduce((s, r) => s + r.jobs_posted, 0) ?? 0}</p>
              <p className="text-xs text-muted-foreground">Jobs posted (attributed)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sources Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !sources?.length ? (
            <p className="text-sm text-muted-foreground">
              No attribution data yet. Share links with <code>?ref=wa_group_1</code> or UTM params to start tracking.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Signups</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Conv %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((row, i) => (
                  <TableRow key={`${row.source}-${row.utm_campaign}-${i}`}>
                    <TableCell className="font-medium">{row.source}</TableCell>
                    <TableCell className="text-muted-foreground">{row.utm_medium || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{row.utm_campaign || "—"}</TableCell>
                    <TableCell className="text-right">{row.sessions}</TableCell>
                    <TableCell className="text-right">{row.signups}</TableCell>
                    <TableCell className="text-right">{row.jobs_posted}</TableCell>
                    <TableCell className="text-right">{row.conversion_rate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
