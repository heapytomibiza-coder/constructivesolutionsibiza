/**
 * Job Ticket Detail Page — Premium guided workflow layout.
 * Desktop: 2-column (280px progress rail + stage content). Mobile: single column.
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  Globe,
  UserPlus,
  Loader2,
  MapPin,
  Calendar,
  Euro,
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
import { ConversationPreviewCard } from './components/ConversationPreviewCard';
import { JobTicketQuotes } from './components/JobTicketQuotes';
import { AgreementCard } from './components/AgreementCard';
import { JobTicketCompletion } from './components/JobTicketCompletion';
import { JobTicketReview } from './components/JobTicketReview';
import { ProQuoteSummary } from './components/ProQuoteSummary';
import { CancellationRequestCard } from './components/CancellationRequestCard';
import { BudgetIncreaseCard } from './components/BudgetIncreaseCard';
import { ProjectGallery } from './components/ProjectGallery';
import { PortfolioPrompt } from './components/PortfolioPrompt';
import { useMyQuoteForJob, useAcceptedQuoteForJob } from '@/pages/jobs/queries/quotes.query';
import { completeJob } from '@/pages/jobs/actions/completeJob.action';
import { useJobTicketRealtime } from './hooks/useJobTicketRealtime';
import { canCancelJob, canPostJob, canWithdrawQuote } from '@/pages/jobs/utils/jobActions';

export default function JobTicketDetail() {
  const { t } = useTranslation('dashboard');
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user, activeRole } = useSession();
  const queryClient = useQueryClient();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const rebook = useRebook();
  const updatesRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const quotesRef = useRef<HTMLDivElement>(null);

  // Realtime subscription — refetches on quote/status/progress/review changes
  useJobTicketRealtime(jobId);

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

  // Accepted quote with line items for AgreementCard (both roles)
  const hasAcceptedQuoteInList = quotesForJob.some(q => q.status === 'accepted');
  const { data: acceptedQuote = null } = useAcceptedQuoteForJob(
    jobId ?? null,
    hasAcceptedQuoteInList,
  );

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

  // Fetch assigned professional name for rail footer
  const { data: assignedProProfile } = useQuery({
    queryKey: ['assigned_pro_profile', job?.assigned_professional_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('display_name')
        .eq('user_id', job!.assigned_professional_id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!job?.assigned_professional_id,
  });

  // Latest progress update timestamp for rail
  const { data: latestUpdate } = useQuery({
    queryKey: ['latest_progress_update', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_progress_updates')
        .select('created_at')
        .eq('job_id', jobId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId && !!user,
  });

  const proNameMap = new Map(inviteProfiles.map(p => [p.user_id, p.display_name || t('client.professionalFallback')]));

  const handlePostToBoard = async () => {
    if (!jobId) return;
    setIsPublishing(true);
    try {
      const { error } = await supabase.rpc('post_job', { p_job_id: jobId });
      if (error) {
        const msg = error.message || '';
        if (msg.includes('not_authorized')) {
          toast.error(t('jobTicket.postNotAllowed', 'You are not authorized to post this job.'));
        } else if (msg.includes('job_not_postable')) {
          toast.error(t('jobTicket.postNotAllowed', 'Only draft jobs can be posted to the board.'));
        } else {
          throw error;
        }
        return;
      }
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
    if (!jobId) return;
    setCloseDialogOpen(false);
    try {
      const { error } = await supabase.rpc('cancel_job', { p_job_id: jobId });
      if (error) {
        const msg = error.message || '';
        if (msg.includes('not_authorized')) {
          toast.error(t('jobTicket.closeNotAllowed', 'You are not authorized to cancel this job.'));
        } else if (msg.includes('job_not_cancellable')) {
          toast.error(t('jobTicket.closeNotAllowed', 'This job can no longer be closed directly. Use the cancellation request flow instead.'));
        } else {
          throw error;
        }
        return;
      }
      toast.success(t('jobTicket.jobClosed'));
      navigate('/dashboard/client');
    } catch {
      toast.error(t('jobTicket.closeFailed'));
    }
  };

  const handleWithdraw = async () => {
    if (!jobId) return;
    setWithdrawDialogOpen(false);
    try {
      const { error } = await supabase.rpc('withdraw_from_job', { p_job_id: jobId });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t('jobTicket.withdrawnSuccess', 'You have withdrawn from this job.'));
      queryClient.invalidateQueries({ queryKey: ['job_ticket', jobId] });
    } catch {
      toast.error(t('jobTicket.withdrawFailed', 'Failed to withdraw'));
    }
  };

  const handleMarkComplete = async () => {
    if (!jobId || !job || isCompleting) return;
    setIsCompleting(true);
    try {
      const result = await completeJob(jobId, {
        caller: 'hero',
        userId: user?.id,
        jobOwnerId: job.user_id,
        assignedProId: job.assigned_professional_id ?? undefined,
        jobStatus: job.status,
        completionRequestedAt: job.completion_requested_at,
      });

      if (!result.success) {
        toast.error(result.error ?? t('client.completeFailed', 'Failed to complete job'));
        return;
      }

      sessionStorage.setItem(`review_auto_open_${jobId}`, '1');
      toast.success(t('client.completedSuccess', 'Job marked as completed!'));
      queryClient.invalidateQueries({ queryKey: ['job_ticket', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job_review_exists', jobId] });
    } catch {
      toast.error(t('client.completeFailed', 'Failed to complete job'));
    } finally {
      setIsCompleting(false);
    }
  };

  const scrollToUpdates = useCallback(() => {
    updatesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Focus the update textarea after scroll
    setTimeout(() => {
      const textarea = updatesRef.current?.querySelector('textarea');
      textarea?.focus();
    }, 500);
  }, []);

  const scrollToReview = useCallback(() => {
    reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToQuotes = useCallback(() => {
    quotesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const backPath = isClient ? '/dashboard/client' : '/dashboard/pro/jobs';
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
  const quotesCount = isClient ? quotesForJob.length : (myQuote ? 1 : 0);
  const completionRequested = !!job.completion_requested_at;
  const cancellationRequested = !!job.cancellation_requested_at;

  const railProps = {
    jobId: jobId!,
    jobStatus: job.status,
    hasQuote,
    hasAcceptedQuote,
    hasReview,
    jobTitle: job.title,
    proName: assignedProProfile?.display_name || null,
    lastUpdateAt: latestUpdate?.created_at || null,
  };

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
            <div className="flex items-center gap-1.5">
            {/* Edit (client, pre-assignment) */}
            {isClient && ['ready', 'open'].includes(job.status) && (
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate(`/post?edit=${jobId}`)}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('jobTicket.editJob', 'Edit')}</span>
              </Button>
            )}
            {/* Hire Again (client, post-completion) */}
            {isClient && isPastOpen && job.assigned_professional_id && (
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => rebook.mutate(job.id)} disabled={rebook.isPending}>
                <RotateCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('jobTicket.hireAgain', 'Hire Again')}</span>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main layout */}
      <div className="container py-6 px-4 sm:px-6">
        <div className="flex gap-6">
          {/* Left: Progress Rail (desktop — 280px sticky) */}
          <div className="hidden lg:block w-[280px] shrink-0">
            <JobProgressRail {...railProps} />
          </div>

          {/* Right: Stage content */}
          <div className="flex-1 min-w-0 max-w-[820px] space-y-5">
            {/* Mobile progress rail */}
            <div className="lg:hidden">
              <JobProgressRail {...railProps} />
            </div>

            {/* 1. Stage Hero */}
            <StageHero
              jobStatus={job.status}
              isClient={isClient}
              hasReview={hasReview}
              quotesCount={quotesCount}
              hasAcceptedQuote={hasAcceptedQuote}
              completionRequested={completionRequested}
              cancellationRequested={cancellationRequested}
              isCompleting={isCompleting}
              onMarkComplete={handleMarkComplete}
              onRequestCompletion={() => {
                document.getElementById('completion-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onWithdraw={handleWithdraw}
              onScrollToUpdates={scrollToUpdates}
              onScrollToReview={scrollToReview}
              onScrollToQuotes={scrollToQuotes}
            />

            {/* 2. Cancellation request card (in_progress + cancellation requested) */}
            <CancellationRequestCard
              jobId={job.id}
              jobStatus={job.status}
              isClient={isClient}
              cancellationRequested={cancellationRequested}
              cancellationReason={job.cancellation_reason}
            />

            {/* 3. Agreement Card — dominant reference (both roles, post-acceptance) */}
            {acceptedQuote && (
              <AgreementCard quote={acceptedQuote} />
            )}

            {/* 4. Progress Updates — tightly coupled to hero as "the proof" */}
            {['in_progress', 'completed'].includes(job.status) && (
              <div ref={updatesRef} className="-mt-1">
                <ProgressUpdates
                  jobId={job.id}
                  jobStatus={job.status}
                  isClient={isClient}
                  assignedProId={job.assigned_professional_id}
                />
                {/* Pro completion prompt — subtle, under updates */}
                {!isClient && job.status === 'in_progress' && (
                  <JobTicketCompletion
                    jobId={job.id}
                    jobStatus={job.status}
                    isClient={isClient}
                    completionRequested={completionRequested}
                    assignedProfessionalId={job.assigned_professional_id}
                    clientId={job.user_id}
                    viewerId={user?.id}
                    externalDisabled={isCompleting}
                  />
                )}
              </div>
            )}

            {/* 4. Client completion CTA (separate card) */}
            {isClient && job.status === 'in_progress' && (
              <div id="completion-section">
                <JobTicketCompletion
                  jobId={job.id}
                  jobStatus={job.status}
                  isClient={isClient}
                  completionRequested={completionRequested}
                  assignedProfessionalId={job.assigned_professional_id}
                  clientId={job.user_id}
                  viewerId={user?.id}
                  externalDisabled={isCompleting}
                />
              </div>
            )}

            {/* 4. Project Gallery (in_progress / completed) */}
            <ProjectGallery jobId={job.id} jobStatus={job.status} />

            {/* 4b. Portfolio prompt (pro, completed) */}
            <PortfolioPrompt
              jobId={job.id}
              jobStatus={job.status}
              isClient={isClient}
              jobTitle={job.title}
            />

            {/* 5. Review (completed) */}
            <div ref={reviewRef}>
              <JobTicketReview
                jobId={job.id}
                jobStatus={job.status}
                assignedProfessionalId={job.assigned_professional_id}
                assignedProfessionalName={assignedProProfile?.display_name ?? undefined}
                viewerRole={isClient ? 'client' : 'professional'}
                clientId={job.user_id}
                clientName={clientProfile?.display_name ?? undefined}
              />
            </div>

            {/* 5. Quotes section — secondary reference tier */}
            <div ref={quotesRef} className="space-y-3">
              {!isClient && <ProQuoteSummary jobId={job.id} jobStatus={job.status} />}
              {isClient && <JobTicketQuotes jobId={job.id} jobStatus={job.status} />}
              {/* Budget increase — financial action, lives with quotes */}
              <BudgetIncreaseCard
                jobId={job.id}
                jobStatus={job.status}
                isClient={isClient}
                budgetType={job.budget_type}
                budgetMin={job.budget_min}
                budgetMax={job.budget_max}
                budgetValue={job.budget_value}
              />
            </div>

            {/* 6. Conversation preview */}
            <ConversationPreviewCard jobId={job.id} viewerRole={isClient ? 'client' : 'professional'} />

            {/* 7. Client profile card (pro view) */}
            {!isClient && clientProfile?.display_name && (
              <div className="rounded-[18px] border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[12px] text-muted-foreground">{t('jobTicket.client', 'Client')}</p>
                    <p className="text-sm font-medium text-foreground">{clientProfile.display_name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 8. Job Summary (collapsible once past open) */}
            <div className="rounded-[18px] border border-border/40 bg-muted/20 overflow-hidden">
              {isPastOpen ? (
                <>
                  <button
                    onClick={() => setSummaryExpanded(!summaryExpanded)}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/20 border-b border-border/40 text-left"
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {t('jobTicket.jobDetails', 'Job Details')}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${summaryExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {summaryExpanded && <JobSummaryContent job={job} microNames={microNames} area={area} t={t} />}
                </>
              ) : (
                <>
                  <div className="bg-muted/30 px-5 py-3 border-b border-border">
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
            </div>

            {/* Draft banner */}
            {job.status === 'ready' && isClient && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium">{t('jobTicket.savedBanner')}</p>
              </div>
            )}

            {/* 9. Distribution — client + ready/open only */}
            {isClient && ['ready', 'open'].includes(job.status) && (
              <div className="rounded-[18px] border border-border/70 bg-card overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-base font-semibold font-display">{t('jobTicket.shareTitle')}</h3>
                </div>
                <div className="p-5 space-y-3">
                  <button
                    onClick={handlePostToBoard}
                    disabled={isPublishing || job.status === 'open'}
                    className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/40 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{t('jobTicket.postToBoard')}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {job.status === 'open' ? t('jobTicket.alreadyPosted') : t('jobTicket.postToBoardDesc')}
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
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <UserPlus className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{t('jobTicket.inviteSpecific')}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {t('jobTicket.inviteSpecificDesc')}
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* Invites list */}
            {isClient && invites.length > 0 && (
              <div className="rounded-[18px] border border-border/70 bg-card overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-base font-semibold font-display">{t('jobTicket.invitesSent', { count: invites.length })}</h3>
                </div>
                <div className="p-5 space-y-3">
                  {invites.map((invite) => {
                    const name = proNameMap.get(invite.professional_id) || t('client.professionalFallback');
                    const statusIcon = {
                      sent: <Clock className="h-4 w-4 text-muted-foreground" />,
                      viewed: <Eye className="h-4 w-4 text-accent" />,
                      accepted: <CheckCircle2 className="h-4 w-4 text-primary" />,
                      declined: <XCircle className="h-4 w-4 text-destructive" />,
                    }[invite.status] || <Clock className="h-4 w-4 text-muted-foreground" />;

                    return (
                      <div key={invite.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
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
                </div>
              </div>
            )}

            {/* ─── Footer actions (destructive / secondary) ─── */}
            {!['cancelled'].includes(job.status) && (
              <div className="mt-6 pt-5 border-t border-border/50">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Raise Issue */}
                  {['in_progress', 'completed'].includes(job.status) && job.assigned_professional_id && (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive text-xs" asChild>
                      <Link to={`/contact?subject=issue&job=${jobId}`}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {t('jobTicket.raiseIssue', 'Raise Issue')}
                      </Link>
                    </Button>
                  )}
                  {/* Pro: Withdraw */}
                  {!isClient && canWithdrawQuote(job.status) && (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive text-xs" onClick={() => setWithdrawDialogOpen(true)}>
                      <XCircle className="h-3.5 w-3.5" />
                      {t('jobTicket.withdraw', 'Withdraw')}
                    </Button>
                  )}
                  {/* Pro: Request Cancellation */}
                  {!isClient && job.status === 'in_progress' && job.assigned_professional_id === user?.id && !cancellationRequested && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground hover:text-destructive text-xs"
                      onClick={async () => {
                        const reason = prompt(t('jobTicket.cancellationReasonPrompt', 'Why do you want to cancel? (optional)'));
                        if (reason === null) return;
                        try {
                          const { error } = await supabase.rpc('request_job_cancellation', {
                            p_job_id: jobId!,
                            p_reason: reason || undefined,
                          });
                          if (error) {
                            toast.error(error.message);
                            return;
                          }
                          toast.success(t('jobTicket.cancellationRequested', 'Cancellation requested'));
                          queryClient.invalidateQueries({ queryKey: ['job_ticket', jobId] });
                        } catch {
                          toast.error(t('jobTicket.cancellationFailed', 'Failed to request cancellation'));
                        }
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {t('jobTicket.requestCancellation', 'Cancel Job')}
                    </Button>
                  )}
                  {/* Client: Close/Cancel (draft/ready/open only) */}
                  {canCancelJob(job.status, isClient) && (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive text-xs" onClick={() => setCloseDialogOpen(true)}>
                      <XCircle className="h-3.5 w-3.5" />
                      {t('jobTicket.cancelJob', 'Cancel Job')}
                    </Button>
                  )}
                  {/* Client: In-progress cancel guidance */}
                  {isClient && job.status === 'in_progress' && (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs" asChild>
                      <Link to={`/contact?subject=issue&job=${jobId}`}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {t('jobTicket.needToCancel', 'Need to cancel? Raise an issue')}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Close/Cancel confirmation dialog */}
      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('jobTicket.cancelJob', 'Cancel Job')}</AlertDialogTitle>
            <AlertDialogDescription>{t('jobTicket.closeConfirm', 'Are you sure you want to cancel this job?')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('jobTicket.cancelJob', 'Cancel Job')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Withdraw confirmation dialog */}
      <AlertDialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('jobTicket.withdraw', 'Withdraw')}</AlertDialogTitle>
            <AlertDialogDescription>{t('jobTicket.withdrawConfirm', 'Withdraw from this job? The client will be able to choose another professional.')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdraw} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('jobTicket.withdraw', 'Withdraw')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Extracted job summary content */
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
    <div className="p-5 space-y-4">
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
            <Euro className="h-4 w-4 text-muted-foreground mt-0.5" />
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
    </div>
  );
}
