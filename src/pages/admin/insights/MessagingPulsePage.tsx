import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMessagingPulse } from "../hooks/useMessagingPulse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, MessageSquare, Clock, AlertTriangle, TrendingUp,
  Users, Zap, Timer, Mail, Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid,
} from "recharts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useActionOutcomes } from "../hooks/useActionOutcomes";
import { ActionOutcomeBadge } from "../components/ActionOutcomeBadge";

function formatMinutes(m: number | null): string {
  if (m == null) return "—";
  if (m < 60) return `${Math.round(m)}m`;
  const h = Math.floor(m / 60);
  const rem = Math.round(m % 60);
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

const TIMEFRAMES = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

export default function MessagingPulsePage() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useMessagingPulse(days);
  const { data: nudgeOutcomes } = useActionOutcomes(["nudge_client"]);

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load messaging data: {error.message}
      </div>
    );
  }

  const rt = data?.response_times;
  const summary = data?.summary;
  const replyRate = rt && rt.total_convos > 0
    ? Math.round((rt.convos_with_pro_reply / rt.total_convos) * 100)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Messaging Pulse</h1>
              <p className="text-sm text-muted-foreground">
                Response times, message flow, and conversation health
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* Timeframe picker */}
        <div className="flex gap-2">
          {TIMEFRAMES.map((tf) => (
            <Button
              key={tf.days}
              variant={days === tf.days ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(tf.days)}
            >
              {tf.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : (
          <>
            {/* ── Summary Stats ── */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
              <StatCard icon={<MessageSquare className="h-5 w-5 text-primary" />} label="Total Messages" value={summary?.total_messages ?? 0} />
              <StatCard icon={<TrendingUp className="h-5 w-5 text-primary" />} label="Active Conversations" value={summary?.active_conversations ?? 0} />
              <StatCard icon={<Users className="h-5 w-5 text-primary" />} label="Unique Senders" value={summary?.unique_senders ?? 0} />
              <StatCard icon={<Zap className="h-5 w-5 text-accent" />} label="Pros Messaging" value={summary?.unique_pros_messaging ?? 0} />
              <StatCard icon={<Users className="h-5 w-5 text-accent" />} label="Clients Messaging" value={summary?.unique_clients_messaging ?? 0} />
            </div>

            {/* ── Response Time Stats ── */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" /> Pro Response Times
              </h2>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={<Timer className="h-5 w-5 text-primary" />}
                  label="Median Response"
                  value={formatMinutes(rt?.median_response_minutes ?? null)}
                />
                <StatCard
                  icon={<Timer className="h-5 w-5 text-muted-foreground" />}
                  label="Average Response"
                  value={formatMinutes(rt?.avg_response_minutes ?? null)}
                />
                <StatCard
                  icon={<Zap className="h-5 w-5 text-accent" />}
                  label="Reply Rate"
                  value={replyRate != null ? `${replyRate}%` : "—"}
                  subtitle={rt ? `${rt.convos_with_pro_reply} / ${rt.total_convos} convos` : undefined}
                />
                <StatCard
                  icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
                  label="No Pro Reply"
                  value={rt?.convos_no_pro_reply ?? 0}
                />
              </div>
              {/* Response time buckets */}
              {rt && rt.total_convos > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-3">Reply Speed Distribution</p>
                    <div className="flex gap-3 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        ≤30min: {rt.replied_within_30m}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ≤1h: {rt.replied_within_1h}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ≤4h: {rt.replied_within_4h}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                        &gt;4h: {rt.convos_with_pro_reply - rt.replied_within_4h}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* ── Daily Volume Chart ── */}
            {data?.daily_volume && data.daily_volume.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Message Volume</h2>
                <Card>
                  <CardContent className="p-4">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.daily_volume}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            dataKey="day"
                            tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            className="text-xs fill-muted-foreground"
                          />
                          <YAxis className="text-xs fill-muted-foreground" />
                          <Tooltip
                            labelFormatter={(v) => new Date(v).toLocaleDateString()}
                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                          />
                          <Legend />
                          <Bar dataKey="from_clients" name="From Clients" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="from_pros" name="From Pros" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* ── Stale Conversations ── */}
            {data?.stale_conversations && data.stale_conversations.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Stale Conversations
                  <Badge variant="destructive" className="text-xs">{data.stale_conversations.length}</Badge>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Open/active jobs where the last message was 48+ hours ago
                </p>
                <div className="space-y-2">
                  {data.stale_conversations.map((sc) => (
                    <StaleConversationCard
                      key={sc.id}
                      conversation={sc}
                      outcome={nudgeOutcomes?.find((o) => o.target_id === sc.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Most Active Conversations ── */}
            {data?.most_active && data.most_active.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Most Active Threads</h2>
                <div className="space-y-2">
                  {data.most_active.map((ac) => (
                    <Card key={ac.conversation_id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ac.job_title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ac.client_name ?? "Client"} ↔ {ac.pro_name ?? "Pro"}
                            {ac.category && ` • ${ac.category}`}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {ac.msg_count} msgs
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtitle }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function StaleConversationCard({ conversation: sc, outcome }: {
  conversation: import("../hooks/useMessagingPulse").StaleConversation;
  outcome?: import("../hooks/useActionOutcomes").ActionOutcome;
}) {
  const queryClient = useQueryClient();
  const nudge = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("admin_nudge_client", {
        p_conversation_id: sc.id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(`Nudge sent for "${sc.job_title}"`);
      queryClient.invalidateQueries({ queryKey: ["admin", "action_outcomes"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Nudge failed");
    },
  });

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{sc.job_title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {[sc.category, sc.area].filter(Boolean).join(" • ")}
            {sc.pro_name && ` — ${sc.pro_name}`}
          </p>
          {sc.last_message_preview && (
            <p className="text-xs text-muted-foreground mt-1 truncate italic">
              "{sc.last_message_preview}"
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <Badge variant={sc.hours_silent > 96 ? "destructive" : "secondary"} className="text-xs">
              {Math.round(sc.hours_silent)}h silent
            </Badge>
            <p className="text-[10px] text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(sc.last_message_at), { addSuffix: true })}
            </p>
          </div>
          {outcome && (
            <ActionOutcomeBadge
              status={outcome.outcome_status}
              createdAt={outcome.created_at}
              details={outcome.outcome_details}
              compact
            />
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => nudge.mutate()}
            disabled={nudge.isPending || nudge.isSuccess}
          >
            {nudge.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
            {nudge.isSuccess ? "Sent" : "Nudge"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
