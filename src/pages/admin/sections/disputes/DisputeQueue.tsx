/**
 * Admin Dispute Queue — sortable, filterable dispute management
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Scale, AlertTriangle, Brain, FileText, MessageSquare, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { adminKeys } from "../../queries/keys";
import { fetchAdminDisputes, type AdminDisputeRow } from "../../queries/adminDisputes.query";

type DisputeFilter = 'active' | 'needs_review' | 'escalated' | 'resolved' | 'all';

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: 'Draft', variant: 'outline' },
  open: { label: 'Open', variant: 'destructive' },
  awaiting_counterparty: { label: 'Awaiting Response', variant: 'default' },
  evidence_collection: { label: 'Evidence', variant: 'default' },
  assessment: { label: 'Assessment', variant: 'default' },
  resolution_offered: { label: 'Resolution Offered', variant: 'secondary' },
  awaiting_acceptance: { label: 'Awaiting Acceptance', variant: 'secondary' },
  resolved: { label: 'Resolved', variant: 'outline' },
  escalated: { label: 'Escalated', variant: 'destructive' },
  closed: { label: 'Closed', variant: 'outline' },
};

function filterDisputes(disputes: AdminDisputeRow[], filter: DisputeFilter): AdminDisputeRow[] {
  switch (filter) {
    case 'active':
      return disputes.filter(d => !['resolved', 'closed', 'draft'].includes(d.status));
    case 'needs_review':
      return disputes.filter(d => d.human_review_required && !['resolved', 'closed'].includes(d.status));
    case 'escalated':
      return disputes.filter(d => d.status === 'escalated');
    case 'resolved':
      return disputes.filter(d => ['resolved', 'closed'].includes(d.status));
    default:
      return disputes;
  }
}

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground text-xs">—</span>;
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? 'text-primary' : pct >= 40 ? 'text-secondary-foreground' : 'text-destructive';
  return <span className={`font-mono text-xs font-medium ${color}`}>{pct}%</span>;
}

export default function DisputeQueue() {
  const [filter, setFilter] = useState<DisputeFilter>('active');
  const { data: allDisputes, isLoading } = useQuery({
    queryKey: [...adminKeys.all, 'disputes'],
    queryFn: fetchAdminDisputes,
  });

  const disputes = allDisputes ? filterDisputes(allDisputes, filter) : [];

  const counts = allDisputes ? {
    active: allDisputes.filter(d => !['resolved', 'closed', 'draft'].includes(d.status)).length,
    needs_review: allDisputes.filter(d => d.human_review_required && !['resolved', 'closed'].includes(d.status)).length,
    escalated: allDisputes.filter(d => d.status === 'escalated').length,
  } : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Dispute Queue
          </CardTitle>
          {counts && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {counts.escalated > 0 && (
                <span className="flex items-center gap-1 text-destructive font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {counts.escalated} escalated
                </span>
              )}
              <span>{counts.active} active</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as DisputeFilter)}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="active">Active{counts ? ` (${counts.active})` : ''}</TabsTrigger>
            <TabsTrigger value="needs_review">Needs Review{counts ? ` (${counts.needs_review})` : ''}</TabsTrigger>
            <TabsTrigger value="escalated">Escalated</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>Parties</TableHead>
                <TableHead>Signals</TableHead>
                <TableHead>Age</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : !disputes.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No disputes found
                  </TableCell>
                </TableRow>
              ) : (
                disputes.map((d) => {
                  const statusCfg = STATUS_CONFIG[d.status] ?? { label: d.status, variant: 'outline' as const };
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                          {d.human_review_required && (
                            <div className="flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              Review
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[180px]">
                          <div className="text-sm font-medium truncate">{d.job_title ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">
                            {[d.job_category, d.job_area].filter(Boolean).join(' · ')}
                          </div>
                          {d.job_budget_value != null && (
                            <div className="text-xs text-muted-foreground">€{d.job_budget_value.toLocaleString()}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {d.issue_types.slice(0, 3).map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">
                              {t.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                          {d.issue_types.length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              +{d.issue_types.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <div>
                            <span className="text-muted-foreground">By:</span>{' '}
                            <span className="font-medium">{d.raiser_name}</span>
                            <span className="text-muted-foreground ml-1">({d.raised_by_role})</span>
                          </div>
                          {d.counterparty_name && (
                            <div>
                              <span className="text-muted-foreground">Vs:</span>{' '}
                              <span className="font-medium">{d.counterparty_name}</span>
                              {d.counterparty_responded_at ? (
                                <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0">responded</Badge>
                              ) : (
                                <Badge variant="destructive" className="ml-1 text-[9px] px-1 py-0">no response</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5" title="Evidence">
                            <FileText className="h-3 w-3" />
                            {d.evidence_count}
                          </span>
                          <span className="flex items-center gap-0.5" title="Inputs">
                            <MessageSquare className="h-3 w-3" />
                            {d.input_count}
                          </span>
                          {d.analysis_exists && (
                            <span className="flex items-center gap-0.5" title="AI Analysis">
                              <Brain className="h-3 w-3 text-primary" />
                              <ConfidenceBadge score={d.ai_confidence_score} />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <AgeIndicator hours={d.age_hours} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild title="View dispute">
                          <a href={`/disputes/${d.id}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function AgeIndicator({ hours }: { hours: number }) {
  if (hours > 48) return <span className="text-destructive font-medium text-xs">{Math.floor(hours)}h</span>;
  if (hours > 24) return <span className="text-secondary-foreground font-medium text-xs">{Math.floor(hours)}h</span>;
  return <span className="text-muted-foreground text-xs">{Math.floor(hours)}h</span>;
}
