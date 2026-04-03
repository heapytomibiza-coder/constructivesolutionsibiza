import { useCallback } from "react";
import { useAdminStats } from "../hooks/useAdminStats";
import { useLatestJobs, type LatestJob } from "../hooks/useLatestJobs";
import { useAdminAlerts } from "../hooks/useAdminAlerts";
import { AdminActionsPanel } from "../components/AdminActionsPanel";
import type { AdminAlert } from "../hooks/useAdminAlerts";
import { formatWhatsAppPost, copyToClipboard } from "../lib/formatWhatsAppPost";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  Headset,
  Briefcase,
  Copy,
  ExternalLink,
  Users,
  MessageSquare,
  Mail,
  Clock,
  UserPlus,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { StatTile } from "@/shared/components/StatTile";
import { useNavigate } from "react-router-dom";
import { useOnboardingHealth } from "../hooks/useOnboardingHealth";
import { MapPin, Phone, ShieldCheck } from "lucide-react";
import { QuoteFunnelCard } from "../components/QuoteFunnelCard";

function playNotifySound() {
  try {
    const audio = new Audio("/sounds/notify.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {}
}

function showBrowserNotification(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/favicon.ico" });
  } catch {}
}

const SEVERITY_ORDER: Record<string, number> = { red: 0, yellow: 1, blue: 2 };

const ALERT_ICONS: Record<string, React.ReactNode> = {
  failed_emails: <Mail className="h-5 w-5" />,
  high_priority_tickets: <Headset className="h-5 w-5" />,
  unanswered_jobs: <Briefcase className="h-5 w-5" />,
  open_tickets: <Headset className="h-5 w-5" />,
  stuck_onboarding: <Clock className="h-5 w-5" />,
  new_signups_24h: <UserPlus className="h-5 w-5" />,
  new_pros_24h: <Wrench className="h-5 w-5" />,
};

const SEVERITY_STYLES: Record<string, string> = {
  red: "border-destructive/30 bg-destructive/5 text-destructive",
  yellow: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
  blue: "border-primary/30 bg-primary/5 text-primary",
};

export function OperatorCockpit() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: health, isLoading: healthLoading } = useOnboardingHealth();
  const { data: alerts, isLoading: alertsLoading } = useAdminAlerts();

  const handleNewJob = useCallback((job: LatestJob) => {
    const desc = [job.area, job.category].filter(Boolean).join(" • ") || "New listing";
    toast(`🚨 New job: ${job.title}`, { description: desc });
    playNotifySound();
    showBrowserNotification("New Job Posted", `${job.title} — ${desc}`);
  }, []);

  const { data: latestJobs, isLoading: jobsLoading } = useLatestJobs(10, handleNewJob);

  const sortedAlerts = (alerts ?? []).sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  );
  const baseUrl = window.location.origin;

  const handleCopyWhatsApp = async (job: (typeof latestJobs)[number]) => {
    const text = formatWhatsAppPost(job, baseUrl);
    const ok = await copyToClipboard(text);
    if (ok) toast.success("Copied to clipboard");
    else toast.error("Copy failed — try selecting manually");
  };

  return (
    <div className="space-y-8">
      {/* ── Needs Attention ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Needs Attention</h2>

        {alertsLoading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : sortedAlerts.length === 0 ? (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-accent" />
              <div>
                <p className="font-medium">All clear</p>
                <p className="text-sm text-muted-foreground">
                  No alerts right now — everything looks good.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedAlerts.map((alert) => (
              <Card
                key={alert.key}
                className={`cursor-pointer transition-shadow hover:shadow-md ${SEVERITY_STYLES[alert.severity] ?? ""}`}
                onClick={() => navigate(alert.cta_href)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="shrink-0">
                    {ALERT_ICONS[alert.key] ?? <AlertTriangle className="h-5 w-5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold">{alert.count}</p>
                    <p className="text-xs font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{alert.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Onboarding Health ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Onboarding Health</h2>

        {healthLoading ? (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            <StatTile
              icon={<Clock className="h-5 w-5 text-amber-500" />}
              iconClassName="bg-amber-500/10"
              label="Stuck by Phase"
              value={(health?.stuck_not_started ?? 0) + (health?.stuck_basic_info ?? 0) + (health?.stuck_service_setup ?? 0)}
              onClick={() => navigate("/dashboard/admin/users?filter=professionals")}
            />
            <StatTile
              icon={<MapPin className="h-5 w-5 text-destructive" />}
              iconClassName="bg-destructive/10"
              label="No Zones"
              value={health?.no_zones ?? 0}
              onClick={() => navigate("/dashboard/admin/users?filter=professionals")}
            />
            <StatTile
              icon={<Phone className="h-5 w-5 text-amber-500" />}
              iconClassName="bg-amber-500/10"
              label="No Phone"
              value={health?.no_phone ?? 0}
              onClick={() => navigate("/dashboard/admin/users?filter=professionals")}
            />
            <StatTile
              icon={<Wrench className="h-5 w-5 text-amber-500" />}
              iconClassName="bg-amber-500/10"
              label="0 Offered Services"
              value={health?.zero_offered_services ?? 0}
              onClick={() => navigate("/dashboard/admin/users?filter=professionals")}
            />
            <StatTile
              icon={<ShieldCheck className="h-5 w-5 text-accent" />}
              iconClassName="bg-accent/10"
              label="Completed 24h"
              value={health?.completed_24h ?? 0}
            />
          </div>
        )}
      </section>

      {/* ── Latest Jobs Feed ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Latest Jobs</h2>

        {jobsLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : !latestJobs?.length ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No open jobs right now.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {latestJobs.map((job) => (
              <Card
                key={job.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors active:bg-accent"
                onClick={() => window.open(`/jobs/${job.id}`, "_blank")}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{job.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {[job.category, job.subcategory]
                        .filter(Boolean)
                        .join(" › ")}{" "}
                      • {job.area || "No location"} •{" "}
                      {formatDistanceToNow(new Date(job.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={(e) => { e.stopPropagation(); handleCopyWhatsApp(job); }}
                      title="Copy WhatsApp post"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={(e) => { e.stopPropagation(); window.open(`/jobs/${job.id}`, "_blank"); }}
                      title="Open job"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Quote Journey ── */}
      <QuoteFunnelCard />

      {/* ── Quick Stats ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Platform Snapshot</h2>

        {statsLoading ? (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            <StatTile
              icon={<Users className="h-5 w-5 text-primary" />}
              label="Total Users"
              value={stats?.total_users ?? 0}
              onClick={() => navigate("/dashboard/admin/insights/new_users")}
            />
            <StatTile
              icon={<Users className="h-5 w-5 text-primary" />}
              label="Active Pros"
              value={`${stats?.active_professionals ?? 0} / ${stats?.total_professionals ?? 0}`}
              onClick={() => navigate("/dashboard/admin/insights/new_pros")}
            />
            <StatTile
              icon={<Briefcase className="h-5 w-5 text-primary" />}
              label="Open Jobs"
              value={`${stats?.open_jobs ?? 0} / ${stats?.total_jobs ?? 0}`}
              onClick={() => navigate("/dashboard/admin/insights/open_jobs")}
            />
            <StatTile
              icon={<MessageSquare className="h-5 w-5 text-primary" />}
              label="Conversations"
              value={stats?.total_conversations ?? 0}
              onClick={() => navigate("/dashboard/admin/insights/conversations")}
            />
            <StatTile
              icon={<Headset className="h-5 w-5 text-primary" />}
              label="Open Tickets"
              value={stats?.open_support_tickets ?? 0}
              onClick={() => navigate("/dashboard/admin/insights/support_tickets")}
            />
          </div>
        )}
      </section>

      {/* Admin Actions with Outcome Tracking */}
      <section>
        <AdminActionsPanel />
      </section>
    </div>
  );
}
