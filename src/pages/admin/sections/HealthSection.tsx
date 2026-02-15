import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Mail, AlertTriangle, Briefcase, Users, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HealthSnapshot {
  emails: { pending: number; failed: number; oldest_pending_minutes: number };
  jobs: { posted_today: number };
  users: { active_24h: number; active_7d: number };
}

function HealthCard({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Card
      className={onClick ? "cursor-pointer hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.98]" : ""}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

export function HealthSection() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin_health_snapshot'],
    queryFn: async (): Promise<HealthSnapshot> => {
      const { data, error } = await supabase.rpc('admin_health_snapshot');
      if (error) throw error;
      return data as unknown as HealthSnapshot;
    },
    refetchInterval: 60_000,
  });

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load health data: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Platform Health</h2>
        <p className="text-sm text-muted-foreground">Real-time operational overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Pending Emails */}
        <HealthCard>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Emails
              </CardTitle>
              <span className="text-[10px] text-muted-foreground/60">System metric</span>
            </div>
            <Mail className="h-5 w-5 text-muted-foreground/50" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-3xl font-bold">{data?.emails.pending ?? 0}</div>
                {(data?.emails.oldest_pending_minutes ?? 0) > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Oldest: {Math.round(data!.emails.oldest_pending_minutes)} min
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </HealthCard>

        {/* Failed Emails */}
        <HealthCard>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed Emails
              </CardTitle>
              <span className="text-[10px] text-muted-foreground/60">System metric</span>
            </div>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{data?.emails.failed ?? 0}</span>
                {(data?.emails.failed ?? 0) > 0 && (
                  <Badge variant="destructive" className="text-xs">Needs attention</Badge>
                )}
              </div>
            )}
          </CardContent>
        </HealthCard>

        {/* Jobs Posted Today */}
        <HealthCard onClick={() => navigate("/dashboard/admin/insights/jobs_posted")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jobs Posted Today
            </CardTitle>
            <div className="flex items-center gap-1">
              <Briefcase className="h-5 w-5 text-primary" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{data?.jobs.posted_today ?? 0}</div>
            )}
          </CardContent>
        </HealthCard>

        {/* Active Users 24h */}
        <HealthCard onClick={() => navigate("/dashboard/admin/insights/messages_sent")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users (24h)
              </CardTitle>
              <span className="text-[10px] text-muted-foreground/60">via messages</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-5 w-5 text-primary" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{data?.users.active_24h ?? 0}</div>
            )}
          </CardContent>
        </HealthCard>

        {/* Active Users 7d */}
        <HealthCard onClick={() => navigate("/dashboard/admin/insights/messages_sent")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users (7d)
              </CardTitle>
              <span className="text-[10px] text-muted-foreground/60">via messages</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-5 w-5 text-accent" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{data?.users.active_7d ?? 0}</div>
            )}
          </CardContent>
        </HealthCard>
      </div>
    </div>
  );
}
