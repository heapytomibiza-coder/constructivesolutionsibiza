import { useAdminStats } from "../hooks/useAdminStats";
import { useLatestJobs } from "../hooks/useLatestJobs";
import { formatWhatsAppPost, copyToClipboard } from "../lib/formatWhatsAppPost";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  Headset,
  UserPlus,
  Briefcase,
  Copy,
  ExternalLink,
  Users,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { StatTile } from "@/shared/components/StatTile";
import { useNavigate } from "react-router-dom";

interface HealthSnapshot {
  emails: { pending: number; failed: number; oldest_pending_minutes: number };
  jobs: { posted_today: number };
  users: { active_24h: number; active_7d: number };
}

export function OperatorCockpit() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: latestJobs, isLoading: jobsLoading } = useLatestJobs(10);
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["admin_health_snapshot"],
    queryFn: async (): Promise<HealthSnapshot> => {
      const { data, error } = await supabase.rpc("admin_health_snapshot");
      if (error) throw error;
      return data as unknown as HealthSnapshot;
    },
    refetchInterval: 60_000,
  });

  const baseUrl = window.location.origin;

  const handleCopyWhatsApp = async (job: (typeof latestJobs)[number]) => {
    const text = formatWhatsAppPost(job, baseUrl);
    const ok = await copyToClipboard(text);
    if (ok) {
      toast.success("Copied to clipboard");
    } else {
      toast.error("Copy failed — try selecting manually");
    }
  };

  // Attention items
  const failedEmails = health?.emails.failed ?? 0;
  const openTickets = stats?.open_support_tickets ?? 0;
  const jobsToday = health?.jobs.posted_today ?? 0;

  const allClear = failedEmails === 0 && openTickets === 0;
  const attentionLoading = healthLoading || statsLoading;

  return (
    <div className="space-y-8">
      {/* ── Needs Attention ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Needs Attention</h2>

        {attentionLoading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : allClear ? (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-accent" />
              <div>
                <p className="font-medium">All clear</p>
                <p className="text-sm text-muted-foreground">
                  No failed emails or urgent tickets right now.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {failedEmails > 0 && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">{failedEmails}</p>
                    <p className="text-xs text-muted-foreground">
                      Failed emails
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {openTickets > 0 && (
              <Card className="border-secondary/50 bg-secondary/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <Headset className="h-5 w-5 text-secondary-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{openTickets}</p>
                    <p className="text-xs text-muted-foreground">
                      Open support tickets
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {jobsToday > 0 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{jobsToday}</p>
                    <p className="text-xs text-muted-foreground">
                      Jobs posted today
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
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
              <Card key={job.id}>
                <CardContent className="p-4 flex items-center gap-4">
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
                      size="sm"
                      onClick={() => handleCopyWhatsApp(job)}
                      title="Copy WhatsApp post"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`/jobs/${job.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open job"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

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
    </div>
  );
}
