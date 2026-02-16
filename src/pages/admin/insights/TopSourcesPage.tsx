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

interface SourceRow {
  source: string;
  sessions: number;
  signups: number;
  jobs_posted: number;
  conversion_rate: number;
}

export default function TopSourcesPage() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);

  const fromTs = new Date(Date.now() - days * 86400000).toISOString();

  // Query attribution_sessions joined with profiles and jobs
  const { data: sources, isLoading } = useQuery({
    queryKey: ["admin", "top-sources", days],
    queryFn: async () => {
      // Get all attribution sessions in range
      const { data: sessions, error } = await supabase
        .from("attribution_sessions")
        .select("session_id, utm_source, utm_campaign, ref, user_id, first_seen_at")
        .gte("first_seen_at", fromTs)
        .order("first_seen_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      if (!sessions?.length) return [];

      // Get jobs with attribution in range
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, attribution, created_at")
        .gte("created_at", fromTs)
        .not("attribution", "is", null)
        .limit(1000);

      // Group by source (ref > utm_source > "Direct")
      const sourceMap = new Map<string, { sessions: number; userIds: Set<string>; jobCount: number }>();

      for (const s of sessions) {
        const key = s.ref || s.utm_source || "Direct";
        if (!sourceMap.has(key)) {
          sourceMap.set(key, { sessions: 0, userIds: new Set(), jobCount: 0 });
        }
        const entry = sourceMap.get(key)!;
        entry.sessions++;
        if (s.user_id) entry.userIds.add(s.user_id);
      }

      // Count jobs per source
      for (const j of jobs ?? []) {
        const attr = j.attribution as Record<string, unknown> | null;
        if (!attr) continue;
        const key = (attr.ref as string) || (attr.utm_source as string) || "Direct";
        if (!sourceMap.has(key)) {
          sourceMap.set(key, { sessions: 0, userIds: new Set(), jobCount: 0 });
        }
        sourceMap.get(key)!.jobCount++;
      }

      const rows: SourceRow[] = [];
      for (const [source, data] of sourceMap) {
        rows.push({
          source,
          sessions: data.sessions,
          signups: data.userIds.size,
          jobs_posted: data.jobCount,
          conversion_rate: data.sessions > 0
            ? Math.round((data.jobCount / data.sessions) * 100)
            : 0,
        });
      }

      return rows.sort((a, b) => b.sessions - a.sessions);
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
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Signups</TableHead>
                  <TableHead className="text-right">Jobs Posted</TableHead>
                  <TableHead className="text-right">Conversion %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((row) => (
                  <TableRow key={row.source}>
                    <TableCell className="font-medium">{row.source}</TableCell>
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
