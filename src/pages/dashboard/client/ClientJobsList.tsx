import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Briefcase, AlertTriangle, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { ClientJobCard } from './components/ClientJobCard';
import type { ClientJob } from './hooks/useClientStats';
import { useCallback } from 'react';

/**
 * Classify a query error into a user-actionable bucket.
 * - 'permission' → RLS / auth-shaped failure (e.g. PostgREST 42501)
 * - 'network'    → fetch / offline / 5xx
 * - 'unknown'    → anything else
 */
type JobsErrorKind = 'permission' | 'network' | 'unknown';

function classifyJobsError(err: unknown): JobsErrorKind {
  if (!err) return 'unknown';
  const e = err as { code?: string; message?: string; status?: number };
  const code = e.code ?? '';
  const msg = (e.message ?? '').toLowerCase();
  const status = e.status ?? 0;

  if (code === '42501' || msg.includes('permission denied') || msg.includes('rls') || msg.includes('row-level security') || status === 401 || status === 403) {
    return 'permission';
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch') || (status >= 500 && status < 600)) {
    return 'network';
  }
  return 'unknown';
}

/**
 * CLIENT JOBS LIST
 * 
 * Simple list of all the client's jobs, grouped by status.
 */
export default function ClientJobsList() {
  const { t } = useTranslation('dashboard');
  const { user } = useSession();
  const qc = useQueryClient();
  const queryKey = ['client_jobs_list', user?.id];
  const handleJobUpdated = useCallback(() => qc.invalidateQueries({ queryKey }), [qc, queryKey]);

  const {
    data: jobs = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['client_jobs_list', user?.id],
    queryFn: async (): Promise<ClientJob[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, status, category, subcategory, created_at, is_publicly_listed, assigned_professional_id, area, budget_type, budget_value, budget_min, budget_max, start_timing, answers, completion_requested_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(j => ({ ...j, conversation_count: 0 }));
    },
    enabled: !!user?.id,
    retry: 1,
  });

  const errorKind: JobsErrorKind | null = isError ? classifyJobsError(error) : null;

  const activeJobs = jobs.filter(j => ['open', 'in_progress'].includes(j.status));
  const draftJobs = jobs.filter(j => ['draft', 'ready'].includes(j.status));
  const completedJobs = jobs.filter(j => ['completed', 'cancelled'].includes(j.status));

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/90 sticky top-0 z-40">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link to="/dashboard/client">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="font-display text-lg font-bold text-foreground">{t('client.yourJobs')}</h1>
        </div>
      </div>

      <div className="container py-5 max-w-2xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">{t('client.loading')}</p>
          </div>
        ) : errorKind === 'permission' ? (
          <div className="text-center py-12 px-4 rounded-xl border border-destructive/20 bg-destructive/5">
            <ShieldAlert className="h-10 w-10 text-destructive/70 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">
              {t('client.jobsPermissionTitle', "We couldn't load your jobs")}
            </p>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              {t('client.jobsPermissionBody', 'Your session may have expired. Please sign in again to view your jobs.')}
            </p>
            <Button asChild variant="outline">
              <Link to="/auth">
                {t('client.jobsPermissionAction', 'Sign in again')}
              </Link>
            </Button>
          </div>
        ) : errorKind ? (
          <div className="text-center py-12 px-4 rounded-xl border border-border bg-card">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">
              {errorKind === 'network'
                ? t('client.jobsNetworkTitle', "Couldn't reach the server")
                : t('client.jobsErrorTitle', "Something went wrong")}
            </p>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              {errorKind === 'network'
                ? t('client.jobsNetworkBody', 'Check your connection and try again.')
                : t('client.jobsErrorBody', "We couldn't load your jobs right now. Please try again.")}
            </p>
            <Button onClick={() => refetch()} disabled={isFetching} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              {t('client.retry', 'Retry')}
            </Button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">{t('client.noJobs')}</p>
            <Button asChild>
              <Link to="/post">
                <Plus className="h-4 w-4 mr-2" />
                {t('client.postFirst')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {activeJobs.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('client.activeJobs')} ({activeJobs.length})
                </h2>
                <div className="space-y-2">
                  {activeJobs.map(job => (
                    <ClientJobCard key={job.id} job={job} onJobUpdated={handleJobUpdated} />
                  ))}
                </div>
              </section>
            )}

            {draftJobs.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('client.draftJobs')} ({draftJobs.length})
                </h2>
                <div className="space-y-2">
                  {draftJobs.map(job => (
                    <ClientJobCard key={job.id} job={job} onJobUpdated={handleJobUpdated} />
                  ))}
                </div>
              </section>
            )}

            {completedJobs.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('client.completedJobs')} ({completedJobs.length})
                </h2>
                <div className="space-y-2">
                  {completedJobs.map(job => (
                    <ClientJobCard key={job.id} job={job} onJobUpdated={handleJobUpdated} />
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
