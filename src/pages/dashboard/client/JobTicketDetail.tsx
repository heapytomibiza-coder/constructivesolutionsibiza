/**
 * Job Ticket Detail Page — Full lifecycle control centre for a job.
 * Shows: summary → status timeline → quotes → conversations →
 *        distribution → invites → completion → review
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  Globe,
  UserPlus,
  Loader2,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  Eye,
  XCircle,
  Pencil,
  RotateCw,
} from 'lucide-react';
import { useRebook } from '@/hooks/useRebook';
import { StatusTimeline } from '@/components/quotes/StatusTimeline';
import { JobTicketQuotes } from './components/JobTicketQuotes';
import { JobTicketConversations } from './components/JobTicketConversations';
import { JobTicketCompletion } from './components/JobTicketCompletion';
import { JobTicketReview } from './components/JobTicketReview';
import { JobActivityPanel } from './components/JobActivityPanel';

export default function JobTicketDetail() {
  const { t } = useTranslation('dashboard');
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [isPublishing, setIsPublishing] = useState(false);
  const rebook = useRebook();

  const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    ready: { label: t('jobTicket.notSharedYet'), variant: 'secondary' },
    open: { label: t('jobTicket.liveOnBoard'), variant: 'default' },
    in_progress: { label: t('jobTicket.inProgress'), variant: 'outline' },
    completed: { label: t('jobTicket.completed'), variant: 'default' },
    cancelled: { label: t('jobTicket.closed'), variant: 'destructive' },
  };

  const { data: job, isLoading } = useQuery({
    queryKey: ['job_ticket', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId && !!user,
  });

  const { data: invites = [] } = useQuery({
    queryKey: ['job_invites', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_invites')
        .select('*')
        .eq('job_id', jobId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!jobId && !!user,
  });

  const { data: inviteProfiles = [] } = useQuery({
    queryKey: ['invite_profiles', invites.map(i => i.professional_id)],
    queryFn: async () => {
      const proIds = invites.map(i => i.professional_id);
      if (!proIds.length) return [];
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('user_id, display_name')
        .in('user_id', proIds);
      if (error) throw error;
      return data || [];
    },
    enabled: invites.length > 0,
  });

  const proNameMap = new Map(inviteProfiles.map(p => [p.user_id, p.display_name || t('client.professionalFallback')]));

  const handlePostToBoard = async () => {
    if (!jobId) return;
    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'open', is_publicly_listed: true })
        .eq('id', jobId);
      if (error) throw error;
      toast.success(t('jobTicket.jobPosted'));
      queryClient.invalidateQueries({ queryKey: ['job_ticket', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs_board'] });
    } catch {
      toast.error(t('jobTicket.postFailed'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = async () => {
    if (!jobId || !confirm(t('jobTicket.closeConfirm'))) return;
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId);
      if (error) throw error;
      toast.success(t('jobTicket.jobClosed'));
      navigate('/dashboard/client');
    } catch {
      toast.error(t('jobTicket.closeFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('jobTicket.jobNotFound')}</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.ready;
  const answers = job.answers as Record<string, unknown> | null;
  const selected = (answers?.selected as Record<string, unknown>) || {};
  const microNames = (selected.microNames as string[]) || [];
  const locationData = job.location as Record<string, unknown> | null;
  const area = locationData?.area as string || job.area || 'Ibiza';

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/client')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-display font-semibold text-foreground truncate">
            {job.title}
          </span>
        </div>
      </nav>

      <div className="container max-w-3xl py-6 space-y-6">
        {/* Job Activity Panel */}
        <JobActivityPanel jobId={jobId!} jobStatus={job.status} />

        {/* Status + Timeline + Actions Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Badge variant={statusConfig.variant} className="text-sm px-3 py-1">
              {statusConfig.label}
            </Badge>
            <div className="flex items-center gap-2">
              {['in_progress', 'completed'].includes(job.status) && job.assigned_professional_id && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => rebook.mutate(job.id)}
                    disabled={rebook.isPending}
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    {t('jobTicket.hireAgain', 'Hire Again')}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" asChild title="Having an issue with this job? Start a structured resolution.">
                    <Link to={`/disputes/raise?job=${jobId}`}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t('jobTicket.raiseIssue', 'Raise Issue')}
                    </Link>
                  </Button>
                </>
              )}
              {['ready', 'open', 'posted'].includes(job.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => navigate(`/post?edit=${jobId}`)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t('jobTicket.editJob', 'Edit Job')}
                </Button>
              )}
              <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={handleClose}>
                <XCircle className="h-3.5 w-3.5" />
                {t('jobTicket.closeJob')}
              </Button>
            </div>
          </div>
          {/* Status Timeline */}
          <StatusTimeline currentStatus={job.status} />
        </div>

        {/* Job Summary Card */}
        <Card className="overflow-hidden">
          <div className="bg-primary/5 px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="font-medium">
                {job.category || t('client.uncategorized')}
              </Badge>
              {job.subcategory && (
                <span className="text-sm text-muted-foreground">→ {job.subcategory}</span>
              )}
            </div>
          </div>

          <CardContent className="p-5 space-y-4">
            <section>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('jobTicket.whatYouNeed')}</h4>
              {microNames.length > 0 ? (
                <ul className="space-y-1">
                  {microNames.map((name, i) => (
                    <li key={i} className="font-medium flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-foreground font-medium">{job.title}</p>
              )}
            </section>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-xs text-muted-foreground block">{t('jobTicket.where')}</span>
                  <p className="text-sm font-medium">{area}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-xs text-muted-foreground block">{t('jobTicket.when')}</span>
                  <p className="text-sm font-medium capitalize">
                    {job.start_timing
                      ? (t(`client.timing.${job.start_timing}`) !== `client.timing.${job.start_timing}`
                          ? t(`client.timing.${job.start_timing}`)
                          : job.start_timing.replace(/_/g, ' '))
                      : t('jobTicket.flexible')}
                  </p>
                </div>
              </div>
              {(job.budget_min || job.budget_max) && (
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-xs text-muted-foreground block">{t('jobTicket.budget')}</span>
                    <p className="text-sm font-medium text-primary">
                      {job.budget_min && job.budget_max
                        ? `€${job.budget_min}–€${job.budget_max}`
                        : job.budget_min
                          ? t('jobTicket.budgetFrom', { amount: `€${job.budget_min}` })
                          : t('jobTicket.budgetUpTo', { amount: `€${job.budget_max}` })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {job.status === 'ready' && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium">{t('jobTicket.savedBanner')}</p>
          </div>
        )}

        {/* Completion CTA (only when in_progress) */}
        <JobTicketCompletion jobId={job.id} jobStatus={job.status} />

        {/* Review section (only when completed) */}
        <JobTicketReview
          jobId={job.id}
          jobStatus={job.status}
          assignedProfessionalId={job.assigned_professional_id}
        />

        {/* Quotes Received */}
        <JobTicketQuotes jobId={job.id} jobStatus={job.status} />

        {/* Conversations */}
        <JobTicketConversations jobId={job.id} />

        {/* Distribution Actions */}
        {['ready', 'open'].includes(job.status) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-display">{t('jobTicket.shareTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={handlePostToBoard}
                disabled={isPublishing || job.status === 'open'}
                className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/40 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{t('jobTicket.postToBoard')}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {job.status === 'open'
                      ? t('jobTicket.alreadyPosted')
                      : t('jobTicket.postToBoardDesc')}
                  </p>
                </div>
                {job.status === 'open' && (
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                )}
              </button>

              <Link
                to={`/dashboard/jobs/${jobId}/invite`}
                className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/40 transition-all text-left block"
              >
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{t('jobTicket.inviteSpecific')}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t('jobTicket.inviteSpecificDesc')}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}

        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-display">{t('jobTicket.invitesSent', { count: invites.length })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invites.map((invite) => {
                const name = proNameMap.get(invite.professional_id) || t('client.professionalFallback');
                const statusIcon = {
                  sent: <Clock className="h-4 w-4 text-muted-foreground" />,
                  viewed: <Eye className="h-4 w-4 text-accent" />,
                  accepted: <CheckCircle2 className="h-4 w-4 text-primary" />,
                  declined: <XCircle className="h-4 w-4 text-destructive" />,
                }[invite.status] || <Clock className="h-4 w-4 text-muted-foreground" />;

                return (
                  <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      {statusIcon}
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {t(`jobTicket.inviteStatus.${String(invite.status).toLowerCase()}`, { defaultValue: invite.status })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
