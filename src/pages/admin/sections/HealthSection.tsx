/**
 * Admin Health Section — Actionable platform operations dashboard
 * Shows email queues, error events, network failures with drill-downs and actions.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  AlertTriangle,
  Briefcase,
  Users,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Bug,
  Wifi,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { useNavigate } from "react-router-dom";

// ── Types ──────────────────────────────────────────────

interface HealthSnapshot {
  emails: { pending: number; failed: number; oldest_pending_minutes: number };
  jobs: { posted_today: number };
  users: { active_24h: number; active_7d: number };
}

interface QueueItem {
  id: string;
  job_id: string;
  event: string;
  attempts: number;
  created_at: string;
  last_error: string | null;
}

interface EmailQueueDetails {
  pending: QueueItem[];
  failed: QueueItem[];
}

interface ErrorEvent {
  id: string;
  error_type: string;
  message: string;
  stack: string | null;
  url: string | null;
  route: string | null;
  browser: string | null;
  viewport: string | null;
  user_id: string | null;
  created_at: string;
}

interface NetworkFailure {
  id: string;
  user_id: string;
  method: string | null;
  request_url: string | null;
  status_code: number | null;
  error_message: string | null;
  route: string | null;
  browser: string | null;
  created_at: string;
}

// ── Hooks ──────────────────────────────────────────────

function useHealthSnapshot() {
  return useQuery({
    queryKey: ["admin_health_snapshot"],
    queryFn: async (): Promise<HealthSnapshot> => {
      const { data, error } = await supabase.rpc("admin_health_snapshot");
      if (error) throw error;
      return data as unknown as HealthSnapshot;
    },
    refetchInterval: 30_000,
  });
}

function useEmailQueueDetails(enabled: boolean) {
  return useQuery({
    queryKey: ["admin_email_queue_details"],
    queryFn: async (): Promise<EmailQueueDetails> => {
      const { data, error } = await supabase.rpc("admin_email_queue_details");
      if (error) throw error;
      return data as unknown as EmailQueueDetails;
    },
    enabled,
    refetchInterval: 15_000,
  });
}

function useRecentErrors(enabled: boolean) {
  return useQuery({
    queryKey: ["admin_recent_errors"],
    queryFn: async (): Promise<ErrorEvent[]> => {
      const { data, error } = await supabase.rpc("admin_recent_errors", { p_limit: 30 });
      if (error) throw error;
      return (data ?? []) as unknown as ErrorEvent[];
    },
    enabled,
  });
}

function useNetworkFailures(enabled: boolean) {
  return useQuery({
    queryKey: ["admin_recent_network_failures"],
    queryFn: async (): Promise<NetworkFailure[]> => {
      const { data, error } = await supabase.rpc("admin_recent_network_failures", { p_limit: 20 });
      if (error) throw error;
      return (data ?? []) as unknown as NetworkFailure[];
    },
    enabled,
  });
}

// ── Sub-components ─────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  subtitle,
  severity,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtitle?: string;
  severity?: "ok" | "warn" | "danger";
  onClick?: () => void;
}) {
  const severityStyles = {
    ok: "border-accent/30",
    warn: "border-amber-500/30 bg-amber-500/5",
    danger: "border-destructive/30 bg-destructive/5",
  };

  return (
    <Card
      className={`${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${
        severity ? severityStyles[severity] : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground">{icon}</span>
          {severity === "danger" && (
            <Badge variant="destructive" className="text-[10px]">
              Needs action
            </Badge>
          )}
          {severity === "warn" && (
            <Badge variant="secondary" className="text-[10px]">
              Monitor
            </Badge>
          )}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {subtitle && (
          <div className="text-[10px] text-muted-foreground mt-1">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
}

function ExpandableSection({
  title,
  icon,
  count,
  severity,
  defaultOpen,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  severity?: "ok" | "warn" | "danger";
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={severity === "danger" ? "border-destructive/30" : ""}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {icon}
                <CardTitle className="text-sm">{title}</CardTitle>
                {count !== undefined && (
                  <Badge
                    variant={severity === "danger" ? "destructive" : severity === "warn" ? "secondary" : "outline"}
                    className="text-[10px]"
                  >
                    {count}
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function EmailQueuePanel() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useEmailQueueDetails(true);

  const retryOne = useMutation({
    mutationFn: async (emailId: string) => {
      const { data, error } = await supabase.rpc("admin_retry_failed_email", {
        p_email_id: emailId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Email queued for retry");
      queryClient.invalidateQueries({ queryKey: ["admin_email_queue_details"] });
      queryClient.invalidateQueries({ queryKey: ["admin_health_snapshot"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Retry failed");
    },
  });

  const retryAll = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("admin_retry_all_failed_emails");
      if (error) throw error;
      return data as unknown as { success: boolean; retried_count: number };
    },
    onSuccess: (result) => {
      const count = typeof result === "object" && result ? (result as any).retried_count : 0;
      toast.success(`${count} email(s) queued for retry`);
      queryClient.invalidateQueries({ queryKey: ["admin_email_queue_details"] });
      queryClient.invalidateQueries({ queryKey: ["admin_health_snapshot"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Retry all failed");
    },
  });

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const pending = data?.pending ?? [];
  const failed = data?.failed ?? [];

  return (
    <div className="space-y-4">
      {/* Failed emails — action required */}
      {failed.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5" />
              Failed ({failed.length})
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => retryAll.mutate()}
              disabled={retryAll.isPending}
              className="h-7 text-xs gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Retry All
            </Button>
          </div>
          <div className="rounded-md border border-destructive/20">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Event</TableHead>
                  <TableHead className="text-xs">Attempts</TableHead>
                  <TableHead className="text-xs">Error</TableHead>
                  <TableHead className="text-xs">Age</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failed.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs font-medium">
                      {item.event}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="text-[10px]">
                        {item.attempts}×
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                      {item.last_error || "Unknown error"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1"
                        onClick={() => retryOne.mutate(item.id)}
                        disabled={retryOne.isPending}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pending emails — monitoring */}
      {pending.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Pending ({pending.length})
          </h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Event</TableHead>
                  <TableHead className="text-xs">Attempts</TableHead>
                  <TableHead className="text-xs">Last Error</TableHead>
                  <TableHead className="text-xs">Queued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs font-medium">{item.event}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {item.attempts}×
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {item.last_error || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : failed.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
          <CheckCircle2 className="h-4 w-4 text-accent" />
          Email queue is clear — no pending or failed items
        </div>
      ) : null}
    </div>
  );
}

function ErrorEventsPanel() {
  const { data: errors, isLoading } = useRecentErrors(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  if (!errors?.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
        <CheckCircle2 className="h-4 w-4 text-accent" />
        No recent errors
      </div>
    );
  }

  // Group by message for deduplication display
  const grouped = errors.reduce<Record<string, { count: number; latest: ErrorEvent; all: ErrorEvent[] }>>(
    (acc, err) => {
      const key = `${err.error_type}:${err.message.slice(0, 100)}`;
      if (!acc[key]) {
        acc[key] = { count: 0, latest: err, all: [] };
      }
      acc[key].count++;
      acc[key].all.push(err);
      if (new Date(err.created_at) > new Date(acc[key].latest.created_at)) {
        acc[key].latest = err;
      }
      return acc;
    },
    {}
  );

  const entries = Object.values(grouped).sort(
    (a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime()
  );

  return (
    <div className="space-y-1 max-h-[400px] overflow-y-auto">
      {entries.map((entry) => {
        const isExpanded = expandedId === entry.latest.id;
        return (
          <div
            key={entry.latest.id}
            className="rounded-lg border p-3 space-y-2 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setExpandedId(isExpanded ? null : entry.latest.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {entry.latest.error_type}
                  </Badge>
                  {entry.count > 1 && (
                    <Badge variant="secondary" className="text-[10px]">
                      ×{entry.count}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium mt-1 line-clamp-2">{entry.latest.message}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                  {entry.latest.route && <span>{entry.latest.route}</span>}
                  {entry.latest.browser && <span>{entry.latest.browser}</span>}
                  <span>{formatDistanceToNow(new Date(entry.latest.created_at), { addSuffix: true })}</span>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>

            {isExpanded && entry.latest.stack && (
              <div className="bg-muted/50 rounded-md p-3 text-xs font-mono text-muted-foreground overflow-x-auto max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                {entry.latest.stack}
              </div>
            )}

            {isExpanded && (
              <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                {entry.latest.url && (
                  <div>
                    <span className="font-medium text-foreground">URL:</span> {entry.latest.url}
                  </div>
                )}
                {entry.latest.viewport && (
                  <div>
                    <span className="font-medium text-foreground">Viewport:</span> {entry.latest.viewport}
                  </div>
                )}
                {entry.latest.user_id && (
                  <div>
                    <span className="font-medium text-foreground">User:</span> {entry.latest.user_id.slice(0, 8)}…
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NetworkFailuresPanel() {
  const { data: failures, isLoading } = useNetworkFailures(true);

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  if (!failures?.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
        <CheckCircle2 className="h-4 w-4 text-accent" />
        No recent network failures
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs">URL</TableHead>
            <TableHead className="text-xs">Method</TableHead>
            <TableHead className="text-xs">Error</TableHead>
            <TableHead className="text-xs">When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {failures.map((f) => (
            <TableRow key={f.id}>
              <TableCell>
                <Badge
                  variant={
                    (f.status_code ?? 0) >= 500 ? "destructive" :
                    (f.status_code ?? 0) >= 400 ? "secondary" : "outline"
                  }
                  className="text-[10px]"
                >
                  {f.status_code ?? "ERR"}
                </Badge>
              </TableCell>
              <TableCell className="text-xs max-w-[200px] truncate font-mono">
                {f.request_url || "—"}
              </TableCell>
              <TableCell className="text-xs font-medium">{f.method || "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                {f.error_message || "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────

export function HealthSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useHealthSnapshot();

  const [emailsOpen, setEmailsOpen] = useState(false);
  const [errorsOpen, setErrorsOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load health data: {error.message}
      </div>
    );
  }

  const emailSeverity =
    (data?.emails.failed ?? 0) > 0 ? "danger" :
    (data?.emails.pending ?? 0) > 5 ? "warn" : "ok";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Platform Health</h2>
          <p className="text-sm text-muted-foreground">
            Real-time operational overview with drill-downs
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["admin_health_snapshot"] });
            queryClient.invalidateQueries({ queryKey: ["admin_email_queue_details"] });
            queryClient.invalidateQueries({ queryKey: ["admin_recent_errors"] });
            queryClient.invalidateQueries({ queryKey: ["admin_recent_network_failures"] });
            toast.success("Refreshed");
          }}
          className="gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {isLoading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : (
          <>
            <SummaryCard
              icon={<Mail className="h-5 w-5 text-muted-foreground" />}
              label="Pending Emails"
              value={data?.emails.pending ?? 0}
              subtitle={
                (data?.emails.oldest_pending_minutes ?? 0) > 0
                  ? `Oldest: ${Math.round(data!.emails.oldest_pending_minutes)} min`
                  : undefined
              }
              severity={(data?.emails.pending ?? 0) > 5 ? "warn" : "ok"}
              onClick={() => setEmailsOpen(true)}
            />
            <SummaryCard
              icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
              label="Failed Emails"
              value={data?.emails.failed ?? 0}
              severity={(data?.emails.failed ?? 0) > 0 ? "danger" : "ok"}
              onClick={() => setEmailsOpen(true)}
            />
            <SummaryCard
              icon={<Briefcase className="h-5 w-5 text-primary" />}
              label="Jobs Posted Today"
              value={data?.jobs.posted_today ?? 0}
              onClick={() => navigate("/dashboard/admin/insights/jobs_posted")}
            />
            <SummaryCard
              icon={<Users className="h-5 w-5 text-primary" />}
              label="Active Users (24h)"
              value={data?.users.active_24h ?? 0}
              subtitle="via messages"
              onClick={() => navigate("/dashboard/admin/insights/messages_sent")}
            />
            <SummaryCard
              icon={<Users className="h-5 w-5 text-accent" />}
              label="Active Users (7d)"
              value={data?.users.active_7d ?? 0}
              subtitle="via messages"
              onClick={() => navigate("/dashboard/admin/insights/messages_sent")}
            />
          </>
        )}
      </div>

      <Separator />

      {/* Expandable drill-down sections */}
      <div className="space-y-3">
        <ExpandableSection
          title="Email Queue"
          icon={<Mail className="h-4 w-4 text-muted-foreground" />}
          count={(data?.emails.pending ?? 0) + (data?.emails.failed ?? 0)}
          severity={emailSeverity}
          defaultOpen={emailsOpen || (data?.emails.failed ?? 0) > 0}
        >
          <EmailQueuePanel />
        </ExpandableSection>

        <ExpandableSection
          title="Client Errors"
          icon={<Bug className="h-4 w-4 text-muted-foreground" />}
          defaultOpen={errorsOpen}
        >
          <ErrorEventsPanel />
        </ExpandableSection>

        <ExpandableSection
          title="Network Failures"
          icon={<Wifi className="h-4 w-4 text-muted-foreground" />}
          defaultOpen={networkOpen}
        >
          <NetworkFailuresPanel />
        </ExpandableSection>
      </div>
    </div>
  );
}
