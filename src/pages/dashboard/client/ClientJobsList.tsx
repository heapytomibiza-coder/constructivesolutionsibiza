import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Briefcase } from 'lucide-react';
import { ClientJobCard } from './components/ClientJobCard';
import type { ClientJob } from './hooks/useClientStats';
import { useCallback } from 'react';

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

  const { data: jobs = [], isLoading } = useQuery({
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
  });

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
          <p className="text-sm text-muted-foreground text-center py-12">{t('client.loading')}</p>
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
