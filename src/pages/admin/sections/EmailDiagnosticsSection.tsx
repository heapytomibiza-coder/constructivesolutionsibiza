/**
 * EmailDiagnosticsSection — Track 1 admin troubleshooting UI.
 *
 * Reads from `email_send_log` (RLS-gated to admins) and exposes:
 *  - Filters: status, template, recipient search, time range
 *  - Deduplicated table (latest row per message_id)
 *  - Status counts
 *  - Manual test sender for the 4 platform email types
 *
 * Does NOT modify routing, auth, dashboards, matching, or wizard logic.
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Mail, RefreshCw, Send, AlertTriangle } from "lucide-react";

interface LogRow {
  id: string;
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

const STATUS_OPTIONS = ["all", "pending", "sent", "failed", "dlq", "suppressed", "bounced", "complained"];
const TIME_RANGES = [
  { label: "Last 1h", hours: 1 },
  { label: "Last 24h", hours: 24 },
  { label: "Last 7d", hours: 24 * 7 },
  { label: "Last 30d", hours: 24 * 30 },
];
const TEST_TEMPLATES = [
  { key: "job_posted", label: "Job posted (client)" },
  { key: "new_job_alert", label: "New job alert (pro)" },
  { key: "new_message", label: "New message" },
  { key: "quote_received", label: "Quote received" },
] as const;

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "sent":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
    case "dlq":
    case "bounced":
    case "complained":
      return "destructive";
    case "suppressed":
      return "outline";
    default:
      return "outline";
  }
}

export default function EmailDiagnosticsSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [template, setTemplate] = useState<string>("all");
  const [recipient, setRecipient] = useState("");
  const [hours, setHours] = useState<number>(24);
  const [testTo, setTestTo] = useState("");

  const sinceIso = useMemo(
    () => new Date(Date.now() - hours * 3600 * 1000).toISOString(),
    [hours],
  );

  const logQuery = useQuery({
    queryKey: ["admin-email-log", status, template, recipient, sinceIso],
    queryFn: async () => {
      let q = supabase
        .from("email_send_log")
        .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(500);
      if (status !== "all") q = q.eq("status", status);
      if (template !== "all") q = q.eq("template_name", template);
      if (recipient.trim()) q = q.ilike("recipient_email", `%${recipient.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LogRow[];
    },
  });

  // Deduplicate by message_id, keep latest row.
  const dedupedRows = useMemo(() => {
    const rows = logQuery.data ?? [];
    const seen = new Set<string>();
    const out: LogRow[] = [];
    for (const r of rows) {
      const key = r.message_id ?? r.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  }, [logQuery.data]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of dedupedRows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [dedupedRows]);

  const templates = useMemo(() => {
    const set = new Set<string>();
    for (const r of dedupedRows) if (r.template_name) set.add(r.template_name);
    return Array.from(set).sort();
  }, [dedupedRows]);

  const sendTestMutation = useMutation({
    mutationFn: async (templateKey: string) => {
      const { data, error } = await supabase.functions.invoke("admin-email-diagnostics", {
        body: { action: "send_test", template: templateKey, to: testTo.trim() || undefined },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, templateKey) => {
      toast({
        title: "Test email enqueued",
        description: `${templateKey} → ${data?.recipient ?? "you"} (id ${String(data?.messageId).slice(0, 8)}…)`,
      });
      setTimeout(() => qc.invalidateQueries({ queryKey: ["admin-email-log"] }), 800);
    },
    onError: (err: unknown) => {
      toast({
        title: "Test send failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send test email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enqueues a single branded test email for the chosen template. Defaults to your admin
            address — leave the field blank to send to yourself.
          </p>
          <Input
            placeholder="Recipient (optional, defaults to your email)"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            type="email"
          />
          <div className="flex flex-wrap gap-2">
            {TEST_TEMPLATES.map((t) => (
              <Button
                key={t.key}
                variant="outline"
                size="sm"
                disabled={sendTestMutation.isPending}
                onClick={() => sendTestMutation.mutate(t.key)}
              >
                <Mail className="h-4 w-4 mr-2" />
                {t.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email send log
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => logQuery.refetch()}
              disabled={logQuery.isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${logQuery.isFetching ? "animate-spin" : ""}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((r) => (
                  <SelectItem key={r.hours} value={String(r.hours)}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All templates</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Recipient contains…"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(counts).map(([s, n]) => (
              <Badge key={s} variant={statusVariant(s)}>{s}: {n}</Badge>
            ))}
            {dedupedRows.length === 0 && !logQuery.isLoading && (
              <span className="text-sm text-muted-foreground">No entries</span>
            )}
          </div>

          {logQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : logQuery.error ? (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              {(logQuery.error as Error).message}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message ID</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dedupedRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">{r.template_name ?? "—"}</TableCell>
                      <TableCell className="text-xs">{r.recipient_email ?? "—"}</TableCell>
                      <TableCell><Badge variant={statusVariant(r.status)}>{r.status}</Badge></TableCell>
                      <TableCell className="font-mono text-[11px]">
                        {r.message_id ? r.message_id.slice(0, 8) + "…" : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-[260px] truncate" title={r.error_message ?? ""}>
                        {r.error_message ?? ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
