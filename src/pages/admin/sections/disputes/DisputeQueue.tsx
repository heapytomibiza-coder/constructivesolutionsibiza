/**
 * Admin Dispute Queue — sortable, filterable dispute management with bulk actions
 */
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Scale, AlertTriangle, Brain, FileText, MessageSquare, ShieldCheck, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { adminKeys } from "../../queries/keys";
import { fetchAdminDisputes, type AdminDisputeRow } from "../../queries/adminDisputes.query";
import { advanceDisputeStatus } from "@/pages/disputes/actions/advanceDisputeStatus.action";
import DisputeRowActions from "./DisputeRowActions";
import DisputeAnalytics from "./DisputeAnalytics";

type DisputeFilter = 'active' | 'needs_review' | 'escalated' | 'overdue' | 'high_value' | 'resolved' | 'all';

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

const HIGH_VALUE_THRESHOLD = 5000;

function filterDisputes(disputes: AdminDisputeRow[], filter: DisputeFilter): AdminDisputeRow[] {
  switch (filter) {
    case 'active':
      return disputes.filter(d => !['resolved', 'closed', 'draft'].includes(d.status));
    case 'needs_review':
      return disputes.filter(d => d.human_review_required && !['resolved', 'closed'].includes(d.status));
    case 'escalated':
      return disputes.filter(d => d.status === 'escalated');
    case 'overdue':
      return disputes.filter(d =>
        d.response_deadline &&
        new Date(d.response_deadline) < new Date() &&
        !d.counterparty_responded_at &&
        !['resolved', 'closed'].includes(d.status)
      );
    case 'high_value':
      return disputes.filter(d =>
        (d.job_budget_value ?? 0) >= HIGH_VALUE_THRESHOLD &&
        !['resolved', 'closed'].includes(d.status)
      );
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

function CompletenessBadge({ level }: { level: string }) {
  const config: Record<string, { label: string; className: string }> = {
    high: { label: 'High', className: 'bg-primary/10 text-primary border-primary/20' },
    medium: { label: 'Med', className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800' },
    low: { label: 'Low', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  };
  const c = config[level] ?? config.low;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0 rounded border ${c.className}`}>
      <ShieldCheck className="h-2.5 w-2.5" />
      {c.label}
    </span>
  );
}

function AgeIndicator({ hours }: { hours: number }) {
  if (hours > 48) return <span className="text-destructive font-medium text-xs">{Math.floor(hours)}h</span>;
  if (hours > 24) return <span className="text-secondary-foreground font-medium text-xs">{Math.floor(hours)}h</span>;
  return <span className="text-muted-foreground text-xs">{Math.floor(hours)}h</span>;
}

export default function DisputeQueue() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<DisputeFilter>('active');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'close' | 'escalate' | null>(null);

  const { data: allDisputes, isLoading } = useQuery({
    queryKey: [...adminKeys.all, 'disputes'],
    queryFn: fetchAdminDisputes,
  });

  const disputes = allDisputes ? filterDisputes(allDisputes, filter) : [];

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selected.size === disputes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(disputes.map(d => d.id)));
    }
  }, [disputes, selected.size]);

  const bulkMutation = useMutation({
    mutationFn: async (targetStatus: string) => {
      const ids = Array.from(selected);
      const results = await Promise.allSettled(
        ids.map(id => advanceDisputeStatus(id, targetStatus))
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) throw new Error(`${failed} of ${ids.length} failed`);
    },
    onSuccess: () => {
      toast.success(`${selected.size} disputes updated`);
      setSelected(new Set());
      setBulkAction(null);
      qc.invalidateQueries({ queryKey: [...adminKeys.all, 'disputes'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      qc.invalidateQueries({ queryKey: [...adminKeys.all, 'disputes'] });
    },
  });

  const counts = allDisputes ? {
    active: allDisputes.filter(d => !['resolved', 'closed', 'draft'].includes(d.status)).length,
    needs_review: allDisputes.filter(d => d.human_review_required && !['resolved', 'closed'].includes(d.status)).length,
    escalated: allDisputes.filter(d => d.status === 'escalated').length,
    overdue: allDisputes.filter(d =>
      d.response_deadline &&
      new Date(d.response_deadline) < new Date() &&
      !d.counterparty_responded_at &&
      !['resolved', 'closed'].includes(d.status)
    ).length,
    high_value: allDisputes.filter(d =>
      (d.job_budget_value ?? 0) >= HIGH_VALUE_THRESHOLD &&
      !['resolved', 'closed'].includes(d.status)
    ).length,
  } : null;

  return (
    <>
      <DisputeAnalytics />
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
                {counts.overdue > 0 && (
                  <span className="text-destructive font-medium">
                    {counts.overdue} overdue
                  </span>
                )}
                <span>{counts.active} active</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={filter} onValueChange={(v) => { setFilter(v as DisputeFilter); setSelected(new Set()); }}>
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="active">Active{counts ? ` (${counts.active})` : ''}</TabsTrigger>
              <TabsTrigger value="needs_review">Needs Review{counts ? ` (${counts.needs_review})` : ''}</TabsTrigger>
              <TabsTrigger value="overdue">Overdue{counts ? ` (${counts.overdue})` : ''}</TabsTrigger>
              <TabsTrigger value="high_value">High Value{counts ? ` (${counts.high_value})` : ''}</TabsTrigger>
              <TabsTrigger value="escalated">Escalated</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={disputes.length > 0 && selected.size === disputes.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
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
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : !disputes.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No disputes found
                    </TableCell>
                  </TableRow>
                ) : (
                  disputes.map((d) => {
                    const statusCfg = STATUS_CONFIG[d.status] ?? { label: d.status, variant: 'outline' as const };
                    return (
                      <TableRow key={d.id} data-state={selected.has(d.id) ? 'selected' : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(d.id)}
                            onCheckedChange={() => toggleSelect(d.id)}
                          />
                        </TableCell>
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
                            <CompletenessBadge level={d.completeness_level} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <AgeIndicator hours={d.age_hours} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DisputeRowActions dispute={d} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="sticky bottom-4 flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{selected.size} selected</span>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  <X className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkAction('close')}
                >
                  Close Stale
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkAction('escalate')}
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Batch Escalate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk action confirmation */}
      <AlertDialog open={!!bulkAction} onOpenChange={(open) => !open && setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'close' ? 'Close Stale Disputes' : 'Batch Escalate Disputes'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will {bulkAction === 'close' ? 'close' : 'escalate'} {selected.size} dispute{selected.size !== 1 ? 's' : ''}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkMutation.mutate(bulkAction === 'close' ? 'closed' : 'escalated')}
              disabled={bulkMutation.isPending}
              className={bulkAction === 'escalate' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {bulkMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
