/**
 * Dispute Engine — QA Dashboard
 * Admin-only hidden route for live E2E testing and DB verification.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAdminDisputes, type AdminDisputeRow } from "../queries/adminDisputes.query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { CheckCircle2, XCircle, Loader2, Database, ClipboardList, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────── Test Scenarios ── */
const TESTS = [
  {
    id: "t1",
    title: "Test 1 — Standard Two-Sided Dispute",
    goal: "Prove the happy-path dispute loop works end-to-end.",
    steps: [
      "Client navigates to /disputes/raise?job=<jobId>",
      "Client selects issue types",
      "Client fills questionnaire with detailed description",
      "Client uploads evidence file",
      "Client submits dispute",
      "Verify dispute created with status = 'open'",
      "Verify email queued for counterparty",
      "Professional opens /disputes/<id>/respond",
      "Professional submits response + evidence",
      "Verify counterparty_responded_at is set",
      "Admin triggers AI analysis",
      "Verify dispute_analysis row with is_current = true",
      "Admin advances to assessment → offers resolution",
      "Both parties see ResolutionBanner",
      "Both parties accept → status = 'resolved'",
      "Admin closes case → status = 'closed'",
      "Verify complete status_history chain",
    ],
  },
  {
    id: "t2",
    title: "Test 2 — No-Response Counterparty",
    goal: "Prove deadline and automation path works.",
    steps: [
      "Client opens dispute",
      "Verify response_deadline is set",
      "Counterparty does nothing",
      "Verify reminder email queued",
      "Simulate deadline pass",
      "Confirm dispute advances automatically",
      "Verify change_source = 'automation' in history",
      "Verify admin alert queued",
      "Complainant still sees progress",
    ],
  },
  {
    id: "t3",
    title: "Test 3 — AI Failure Path",
    goal: "Prove system survives AI outage gracefully.",
    steps: [
      "Open dispute, advance to evidence_collection",
      "Force AI failure (bad key / mock error)",
      "Trigger AI analysis",
      "Verify page doesn't crash",
      "Verify dispute_ai_events logs 'failed' event",
      "Verify NO corrupt dispute_analysis row",
      "Verify clear error message shown",
      "Dispute detail still loads normally",
      "Admin can continue manually",
      "Restore AI and re-run successfully",
    ],
  },
  {
    id: "t4",
    title: "Test 4 — Re-Analysis (Versioning)",
    goal: "Prove idempotency — only latest analysis is active.",
    steps: [
      "Generate analysis (run #1)",
      "Verify row #1 is_current = true",
      "Re-run analysis (run #2)",
      "Verify row #2 is_current = true",
      "Verify row #1 is_current = false",
      "Verify AI events log both runs",
      "Only latest shown as active in UI",
      "No duplicate is_current = true rows",
    ],
  },
  {
    id: "t5",
    title: "Test 5 — Resolution Rejection & Escalation",
    goal: "Prove resolution flow handles disagreement.",
    steps: [
      "Admin offers resolution",
      "Verify status = 'resolution_offered'",
      "One party rejects with reason",
      "Verify rejection reason stored in metadata",
      "Verify status = 'escalated'",
      "Both parties notified of escalation",
      "Admin sees escalated indicator in queue",
      "Dispute NOT accidentally resolved",
    ],
  },
  {
    id: "t6",
    title: "Test 6 — Admin Bulk Action Safety",
    goal: "Prove ops tools are safe and audited.",
    steps: [
      "Seed 3+ disputes in various statuses",
      "Select multiple in queue",
      "Batch escalate",
      "Verify only valid cases affected",
      "Verify admin_actions_log entries",
      "Batch close stale disputes",
      "Non-admin cannot access bulk actions",
      "Selection resets after action",
      "Partial failures handled gracefully",
    ],
  },
];

/* ───────────────────────────────────────── Health Checks ── */
interface HealthResult {
  pass: boolean;
  count: number;
}
type HealthData = Record<string, HealthResult>;

function useHealthChecks() {
  return useQuery({
    queryKey: ["dispute-qa-health"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("rpc_dispute_qa_health_checks");
      if (error) throw error;
      return data as unknown as HealthData;
    },
    refetchOnWindowFocus: false,
  });
}

const HEALTH_LABELS: Record<string, string> = {
  duplicate_active_analyses: "No duplicate active analyses",
  orphaned_disputes: "No orphaned disputes (missing status history)",
  resolved_without_acceptance: "All resolved disputes have resolution_accepted_at",
  stale_dispute_emails: "No stale pending dispute emails (> 1 hr)",
};

/* ───────────────────────────────────────── DB Inspector ── */
function useDisputeDetail(disputeId: string | null) {
  return useQuery({
    queryKey: ["dispute-qa-detail", disputeId],
    enabled: !!disputeId,
    queryFn: async () => {
      if (!disputeId) return null;

      const [history, inputs, evidence, analysis, aiEvents, emails] = await Promise.all([
        supabase
          .from("dispute_status_history")
          .select("*")
          .eq("dispute_id", disputeId)
          .order("created_at", { ascending: true }),
        supabase
          .from("dispute_inputs")
          .select("*")
          .eq("dispute_id", disputeId)
          .order("created_at", { ascending: true }),
        supabase
          .from("dispute_evidence")
          .select("*")
          .eq("dispute_id", disputeId)
          .order("created_at", { ascending: true }),
        supabase
          .from("dispute_analysis")
          .select("*")
          .eq("dispute_id", disputeId)
          .order("created_at", { ascending: true }),
        supabase
          .from("dispute_ai_events")
          .select("*")
          .eq("dispute_id", disputeId)
          .order("created_at", { ascending: true }),
        supabase
          .from("email_notifications_queue")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

      // Filter emails client-side (payload contains dispute_id)
      const emailRows = (emails.data ?? []).filter((e: any) => {
        const p = e.payload;
        return typeof p === "object" && p !== null && (p as any).dispute_id === disputeId;
      });

      return {
        history: history.data ?? [],
        inputs: inputs.data ?? [],
        evidence: evidence.data ?? [],
        analysis: analysis.data ?? [],
        aiEvents: aiEvents.data ?? [],
        emails: emailRows,
      };
    },
  });
}

/* ───────────────────────────────────────── Tiny Table ── */
function MiniTable({ rows, highlightKey }: { rows: any[]; highlightKey?: string }) {
  if (!rows.length)
    return <p className="text-sm text-muted-foreground py-4">No rows found.</p>;
  const keys = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/60">
            {keys.map((k) => (
              <th key={k} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={cn(
                "border-t border-border",
                highlightKey && row[highlightKey] === true && "bg-primary/5"
              )}
            >
              {keys.map((k) => (
                <td key={k} className="px-2 py-1 whitespace-nowrap max-w-[300px] truncate">
                  {typeof row[k] === "object" ? JSON.stringify(row[k]) : String(row[k] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────────────────────── Main Page ── */
export default function DisputeQADashboard() {
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const disputes = useQuery({ queryKey: ["admin-disputes-qa"], queryFn: fetchAdminDisputes });
  const health = useHealthChecks();
  const detail = useDisputeDetail(selectedDisputeId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dispute Engine — QA Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live testing, DB inspection, and health checks for the dispute resolution system.
          </p>
        </div>

        {/* ── Section 1: Health Checks ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Health Checks</h2>
            {health.isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          {health.error && (
            <p className="text-sm text-destructive">Failed to load health checks: {(health.error as Error).message}</p>
          )}
          {health.data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(HEALTH_LABELS).map(([key, label]) => {
                const check = health.data[key];
                if (!check) return null;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3",
                    check.pass
                        ? "border-primary/20 bg-primary/5"
                        : "border-destructive/30 bg-destructive/5"
                    )}
                  >
                    {check.pass ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      {!check.pass && (
                        <p className="text-xs text-destructive mt-0.5">{check.count} issue(s) found</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Section 2: DB Inspector ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Live DB Inspector</h2>
          </div>

          <select
            className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedDisputeId ?? ""}
            onChange={(e) => setSelectedDisputeId(e.target.value || null)}
          >
            <option value="">Select a dispute…</option>
            {(disputes.data ?? []).map((d: AdminDisputeRow) => (
              <option key={d.id} value={d.id}>
                {d.raiser_name} — {d.job_title ?? "No title"} ({d.status})
              </option>
            ))}
          </select>

          {selectedDisputeId && detail.isLoading && (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading dispute data…</span>
            </div>
          )}

          {detail.data && (
            <Tabs defaultValue="history" className="mt-2">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="history">Status History ({detail.data.history.length})</TabsTrigger>
                <TabsTrigger value="inputs">Inputs ({detail.data.inputs.length})</TabsTrigger>
                <TabsTrigger value="evidence">Evidence ({detail.data.evidence.length})</TabsTrigger>
                <TabsTrigger value="analysis">Analysis ({detail.data.analysis.length})</TabsTrigger>
                <TabsTrigger value="ai">AI Events ({detail.data.aiEvents.length})</TabsTrigger>
                <TabsTrigger value="emails">Emails ({detail.data.emails.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="history">
                <MiniTable rows={detail.data.history} />
              </TabsContent>
              <TabsContent value="inputs">
                <MiniTable rows={detail.data.inputs} />
              </TabsContent>
              <TabsContent value="evidence">
                <MiniTable rows={detail.data.evidence} />
              </TabsContent>
              <TabsContent value="analysis">
                <MiniTable rows={detail.data.analysis} highlightKey="is_current" />
              </TabsContent>
              <TabsContent value="ai">
                <MiniTable rows={detail.data.aiEvents} />
              </TabsContent>
              <TabsContent value="emails">
                <MiniTable rows={detail.data.emails} />
              </TabsContent>
            </Tabs>
          )}
        </section>

        {/* ── Section 3: Test Scenarios Reference ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Test Scenarios</h2>
          </div>

          <Accordion type="multiple" className="space-y-2">
            {TESTS.map((t) => (
              <AccordionItem key={t.id} value={t.id} className="rounded-lg border border-border px-4">
                <AccordionTrigger className="text-sm font-medium">{t.title}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-xs text-muted-foreground italic mb-3">{t.goal}</p>
                  <ol className="list-decimal list-inside space-y-1">
                    {t.steps.map((s, i) => (
                      <li key={i} className="text-sm text-foreground">{s}</li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  );
}
