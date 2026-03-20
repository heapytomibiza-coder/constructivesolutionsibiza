/**
 * Dispute analytics dashboard — collapsible summary above the queue.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, BarChart3, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminKeys } from '../../queries/keys';
import { fetchDisputeAnalytics, type DisputeAnalyticsData } from '../../queries/adminDisputes.query';

function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: string; icon: typeof BarChart3; accent?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`text-xl font-bold ${accent ?? 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function IssueBar({ issue, count, max }: { issue: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-32 truncate capitalize text-muted-foreground">{issue.replace(/_/g, ' ')}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right font-mono text-muted-foreground">{count}</span>
    </div>
  );
}

export default function DisputeAnalytics() {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: [...adminKeys.all, 'dispute-analytics'],
    queryFn: fetchDisputeAnalytics,
    enabled: expanded,
    staleTime: 60_000,
  });

  return (
    <Card className="mb-4">
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between px-4 py-3 h-auto"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4" />
          Dispute Analytics
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : data ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Total Disputes"
                  value={String(data.total_disputes ?? 0)}
                  icon={BarChart3}
                />
                <StatCard
                  label="Avg Resolution"
                  value={data.avg_resolution_hours != null ? `${Math.round(data.avg_resolution_hours / 24)}d` : '—'}
                  icon={TrendingUp}
                />
                <StatCard
                  label="Median Resolution"
                  value={data.median_resolution_hours != null ? `${Math.round(data.median_resolution_hours / 24)}d` : '—'}
                  icon={TrendingUp}
                />
                <StatCard
                  label="Escalation Rate"
                  value={data.escalation_rate != null ? `${Math.round(data.escalation_rate * 100)}%` : '—'}
                  icon={AlertTriangle}
                  accent={data.escalation_rate > 0.2 ? 'text-destructive' : undefined}
                />
              </div>

              {/* Issue breakdown */}
              {data.top_issues?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Top Issue Types</p>
                  <div className="space-y-1.5">
                    {data.top_issues.slice(0, 6).map((it: any) => (
                      <IssueBar
                        key={it.issue}
                        issue={it.issue}
                        count={it.count}
                        max={data.top_issues[0].count}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Repeat offenders */}
              {data.repeat_offenders?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Repeat Parties
                  </p>
                  <div className="text-xs space-y-1">
                    {data.repeat_offenders.slice(0, 5).map((ro: any) => (
                      <div key={ro.user_id} className="flex items-center justify-between">
                        <span className="font-medium">{ro.name}</span>
                        <span className="text-muted-foreground">
                          {ro.count} disputes · last {new Date(ro.last_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}
