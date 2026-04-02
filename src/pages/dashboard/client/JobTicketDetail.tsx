/**
 * Job Ticket Detail Page — Guided workflow layout.
 * Desktop: 2-column (progress rail + stage content). Mobile: single column.
 * Role-aware: clients see management tools, professionals see their project view.
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useState, useRef, useCallback } from 'react';
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
  User,
  ChevronDown,
} from 'lucide-react';
import { useRebook } from '@/hooks/useRebook';
import { JobProgressRail } from './components/JobProgressRail';
import { StageHero } from './components/StageHero';
import { ProgressUpdates } from './components/ProgressUpdates';
import { JobTicketQuotes } from './components/JobTicketQuotes';
import { JobTicketConversations } from './components/JobTicketConversations';
import { JobTicketCompletion } from './components/JobTicketCompletion';
import { JobTicketReview } from './components/JobTicketReview';
import { JobActivityPanel } from './components/JobActivityPanel';
import { ProQuoteSummary } from './components/ProQuoteSummary';
import { useMyQuoteForJob } from '@/pages/jobs/queries/quotes.query';

export default function JobTicketDetail() {
  const { t } = useTranslation('dashboard');
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user, activeRole } = useSession();
  const queryClient = useQueryClient();
  const [isPublishing, setIsPublishing] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const rebook = useRebook();
  const updatesRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);

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

  // Fetch client profile for pro view
  const { data: clientProfile } = useQuery({
    queryKey: ['client_profile', job?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', job!.user_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!job && job.user_id !== user?.id,
  });

  // Check if quotes exist for progress rail
  const isClient = job?.user_id === user?.id;
  const { data: myQuote } = useMyQuoteForJob(
    jobId ?? null,
    user?.id ?? null,
    !!user?.id && !!job && !isClient,
  );

  const { data: quotesForJob = [] } = useQuery({
    queryKey: ['quotes_exist', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('id, status')
        .eq('job_id', jobId!)
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!jobId && !!user,
  });

  // Check if review exists
  const { data: existingReview } = useQuery({
    queryKey: ['job_review_exists', jobId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_reviews')
        .select('id')
        .eq('job_id', jobId!)
        .eq('reviewer_user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId && !!user && job?.status === 'completed',
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
    enabled: !!jobId && !!user && !!isClient,
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

  const scrollToUpdates = useCallback(() => {
    updatesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToReview = useCallback(() => {
    reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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

  const backPath = isClient ? '/dashboard/client' : '/dashboard/professional/jobs';
  const answers = job.answers as Record<string, unknown> | null;
  const selected = (answers?.selected as Record<string, unknown>) || {};
  const microNames = (selected.microNames as string[]) || [];
  const locationData = job.location as Record<string, unknown> | null;
  const area = locationData?.area as string || job.area || 'Ibiza';

  const hasQuote = isClient ? quotesForJob.length > 0 : !!myQuote;
  const hasAcceptedQuote = isClient
    ? quotesForJob.some(q => q.status === 'accepted')
    : myQuote?.status === 'accepted';
  const hasReview = !!existingReview;
  const isPastOpen = ['in_progress', 'completed'].includes(job.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-display font-semibold text-foreground truncate flex-1">
            {job.title}
          </span>
          {/* Compact actions in nav */}
          <div className="flex items-center gap-1.5">
            {['in_progress', 'completed'].includes(job.status) && job.assigned_professional_id && (
              <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive text-xs" asChild>
                <Link to={`/disputes/raise?job=${jobId}`}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('jobTicket.raiseIssue', 'Raise Issue')}</span>
                </Link>
              </Button>
            )}
            {isClient && ['ready', 'open'].includes(job.status) && (
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate(`/post?edit=${jobId}`)}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('jobTicket.editJob', 'Edit')}</span>
              </Button>
            )}
            {isClient && isPastOpen && job.assigned_professional_id && (
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => rebook.mutate(job.id)} disabled={rebook.isPending}>
                <RotateCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('jobTicket.hireAgain', 'Hire Again')}</span>
              </Button>
            )}
            {isClient && (
              <Button variant="ghost" size="sm" className="gap-1 text-destructive text-xs" onClick={handleClose}>
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main layout */}
      <div className="container py-6">
        <div className="flex gap-8">
          {/* Left: Progress Rail (desktop only) */}
          <div className="hidden lg:block w-56 shrink-0">
            <JobProgressRail
              jobId={jobId!}
              jobStatus={job.status}
              hasQuote={hasQuote}
              hasAcceptedQuote={hasAcceptedQuote}
              hasReview={hasReview}
            />
          </div>

          {/* Right: Stage content */}
          <div className="flex-1 max-w-2xl space-y-5">
            {/* Mobile progress rail */}
            <div className="lg:hidden">
              <JobProgressRail
                jobId={jobId!}
                jobStatus={job.status}
                hasQuote={hasQuote}
                hasAcceptedQuote={hasAcceptedQuote}
                hasReview={hasReview}
              />
            </div>

            {/* 1. Stage Hero */}
            <StageHero
              jobStatus={job.status}
              isClient={isClient}
              hasReview={hasReview}
              onMarkComplete={() => {
                // Scroll to completion section
                document.getElementById('completion-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onScrollToUpdates={scrollToUpdates}
              onScrollToReview={scrollToReview}
            />

            {/* Client activity panel */}
            {isClient && <JobActivityPanel jobId={jobId!} jobStatus={job.status} />}

            {/* 2. Progress Updates (in_progress / completed) */}
            {['in_progress', 'completed'].includes(job.status) && (
              <div ref={updatesRef}>
                <ProgressUpdates
                  jobId={job.id}
                  jobStatus={job.status}
                  isClient={isClient}
                  assignedProId={job.assigned_professional_id}
                />
              </div>
            )}

            {/* 3. Completion CTA (client + in_progress) */}
            {isClient && (
              <div id="completion-section">
                <JobTicketCompletion jobId={job.id} jobStatus={job.status} />
              </div>
            )}

            {/* 4. Review (completed) */}
            <div ref={reviewRef}>
              <JobTicketReview
                jobId={job.id}
                jobStatus={job.status}
                assignedProfessionalId={job.assigned_professional_id}
                viewerRole={isClient ? 'client' : 'professional'}
                clientId={job.user_id}
              />
            </div>

            {/* 5. Quote summary */}
            {!isClient && <ProQuoteSummary jobId={job.id} jobStatus={job.status} />}
            {isClient && <JobTicketQuotes jobId={job.id} jobStatus={job.status} />}

            {/* 6. Job Summary (collapsible once past open) */}
            {!isClient && clientProfile?.display_name && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('jobTicket.client', 'Client')}</p>
                    <p className="text-sm font-medium text-foreground">{clientProfile.display_name}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden">
              {isPastOpen ? (
                <>
                  <button
                    onClick={() => setSummaryExpanded(!summaryExpanded)}
                    className="w-full flex items-center justify-between px-5 py-3 bg-primary/5 border-b border-border text-left"
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {t('jobTicket.jobDetails', 'Job Details')}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${summaryExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {summaryExpanded && <JobSummaryContent job={job} microNames={microNames} area={area} t={t} />}
                </>
              ) : (
                <>
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
                  <JobSummaryContent job={job} microNames={microNames} area={area} t={t} />
                </>
              )}
            </Card>

            {job.status === 'ready' && isClient && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium">{t('jobTicket.savedBanner')}</p>
              </div>
            )}

            {/* 7. Conversations */}
            <JobTicketConversations jobId={job.id} viewerRole={isClient ? 'client' : 'professional'} />

            {/* 8. Distribution — client + ready/open only */}
            {isClient && ['ready', 'open'].includes(job.status) && (
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

            {isClient && invites.length > 0 && (
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
      </div>
    </div>
  );
}

/** Extracted job summary content to avoid duplication */
function JobSummaryContent({
  job,
  microNames,
  area,
  t,
}: {
  job: { title: string; start_timing: string | null; budget_min: number | null; budget_max: number | null; category: string | null; subcategory: string | null };
  microNames: string[];
  area: string;
  t: ReturnType<typeof import('react-i18next').useTranslation>['t'];
}) {
  return (
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
  );
}
