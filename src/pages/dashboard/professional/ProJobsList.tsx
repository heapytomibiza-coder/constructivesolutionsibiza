/**
 * PRO JOBS LIST
 *
 * Lists jobs assigned to the professional, grouped by status.
 * Links each job to the shared JobTicketDetail page.
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Briefcase, Hammer, CheckCircle2, ChevronRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProJob {
  id: string;
  title: string;
  status: string;
  category: string | null;
  area: string | null;
  location: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

export default function ProJobsList() {
  const { t, i18n } = useTranslation('dashboard');
  const { user } = useSession();
  const dateFnsLocale = i18n.language?.startsWith('es') ? es : undefined;

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['pro_assigned_jobs', user?.id],
    queryFn: async (): Promise<ProJob[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, status, category, area, location, created_at, completed_at')
        .eq('assigned_professional_id', user.id)
        .in('status', ['in_progress', 'completed'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ProJob[];
    },
    enabled: !!user?.id,
  });

  const activeJobs = jobs.filter(j => j.status === 'in_progress');
  const completedJobs = jobs.filter(j => j.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/90 sticky top-0 z-40">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link to="/dashboard/professional">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="font-display text-lg font-bold text-foreground">
            {t('pro.myJobs', 'My Jobs')}
          </h1>
        </div>
      </div>

      <div className="container py-5 max-w-2xl">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            {t('client.loading')}
          </p>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {t('pro.noAssignedJobs', 'No active jobs yet. Once a client accepts your quote, the job will appear here.')}
            </p>
            <Button asChild variant="outline">
              <Link to="/jobs">
                {t('pro.browseMatchingJobs', 'Browse Matching Jobs')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {activeJobs.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('pro.inProgressJobs', 'In Progress')} ({activeJobs.length})
                </h2>
                <div className="space-y-2">
                  {activeJobs.map(job => (
                    <ProJobCard key={job.id} job={job} locale={dateFnsLocale} />
                  ))}
                </div>
              </section>
            )}

            {completedJobs.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('client.completedJobs', 'Completed')} ({completedJobs.length})
                </h2>
                <div className="space-y-2">
                  {completedJobs.map(job => (
                    <ProJobCard key={job.id} job={job} locale={dateFnsLocale} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProJobCard({ job, locale }: { job: ProJob; locale?: Locale }) {
  const { t } = useTranslation('dashboard');
  const locationData = job.location as Record<string, unknown> | null;
  const area = (locationData?.area as string) || job.area || 'Ibiza';
  const isActive = job.status === 'in_progress';

  return (
    <Link
      to={`/dashboard/jobs/${job.id}`}
      className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/20 hover:bg-muted/30 transition-all active:scale-[0.99]"
    >
      <div className={cn(
        'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
        isActive ? 'bg-primary/10' : 'bg-muted'
      )}>
        {isActive
          ? <Hammer className="h-5 w-5 text-primary" />
          : <CheckCircle2 className="h-5 w-5 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {job.category && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {job.category}
            </Badge>
          )}
          <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {area}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale })}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
    </Link>
  );
}
