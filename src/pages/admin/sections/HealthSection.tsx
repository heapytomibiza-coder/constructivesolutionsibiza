import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Mail, AlertTriangle, Briefcase, Users, Clock } from 'lucide-react';

interface HealthSnapshot {
  emails: { pending: number; failed: number; oldest_pending_minutes: number };
  jobs: { posted_today: number };
  users: { active_24h: number; active_7d: number };
}

export function HealthSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin_health_snapshot'],
    queryFn: async (): Promise<HealthSnapshot> => {
      const { data, error } = await supabase.rpc('admin_health_snapshot');
      if (error) throw error;
      return data as unknown as HealthSnapshot;
    },
    refetchInterval: 60_000, // auto-refresh every minute
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Emails
            </CardTitle>
            <Mail className="h-5 w-5 text-primary" />
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
        </Card>

        {/* Failed Emails */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed Emails
            </CardTitle>
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
        </Card>

        {/* Jobs Posted Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jobs Posted Today
            </CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{data?.jobs.posted_today ?? 0}</div>
            )}
          </CardContent>
        </Card>

        {/* Active Users 24h */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users (24h)
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{data?.users.active_24h ?? 0}</div>
            )}
          </CardContent>
        </Card>

        {/* Active Users 7d */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users (7d)
            </CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{data?.users.active_7d ?? 0}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
