import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Pencil, Copy, X, Clock, MessageSquare, Euro, AlertTriangle, RotateCw } from 'lucide-react';
import { useRebook } from '@/hooks/useRebook';
import { CategoryPlaceholder } from '@/components/CategoryPlaceholder';
import { getCategoryIconByName } from '@/lib/categoryIcons';
import { CompletionModal, RatingModal } from '@/pages/jobs/components';
import { completeJob } from '@/pages/jobs/actions/completeJob.action';
import { submitReview } from '@/pages/jobs/actions/submitReview.action';
import { toast } from 'sonner';
import { AssignProSelector } from '@/pages/dashboard/shared/components/AssignProSelector';
import { useTranslation } from 'react-i18next';
import { txCategory, txSubcategory } from '@/i18n/taxonomyTranslations';
import { supabase } from '@/integrations/supabase/client';
import { getDateLocale } from '@/lib/dateLocale';
import type { ClientJob } from '../hooks/useClientStats';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ClientJobCardProps {
  job: ClientJob;
  onJobUpdated: () => void;
}

/* ─── helpers ─── */

const STATUS_VARIANTS: Record<string, string> = {
  open: 'default',
  draft: 'secondary',
  ready: 'secondary',
  in_progress: 'outline',
  completed: 'success',
  cancelled: 'destructive',
};

function getStatusLabel(status: string, t: (key: string) => string) {
  const key = `client.status.${status}`;
  const translated = t(key);
  return translated !== key ? translated : status;
}

function getActions(status: string) {
  const canEdit = ['draft', 'open'].includes(status);
  const canDuplicate = ['draft', 'open', 'in_progress', 'completed'].includes(status);
  const canClose = ['draft', 'open'].includes(status);
  return { canEdit, canDuplicate, canClose };
}

function formatBudgetLabel(job: ClientJob, t: (key: string, opts?: Record<string, unknown>) => string): string | null {
  if (job.budget_min && job.budget_max) return `€${job.budget_min}–€${job.budget_max}`;
  if (job.budget_value) return `€${job.budget_value}`;
  if (job.budget_type === 'tbd') return t('client.budgetTbd', { defaultValue: 'Quote-based' });
  return null;
}

function formatTimingLabel(timing: string | null, t: (key: string, opts?: Record<string, unknown>) => string): string | null {
  if (!timing) return null;
  const key = `client.timing.${timing}`;
  const translated = t(key);
  return translated !== key ? translated : timing.replace(/_/g, ' ');
}

/* ─── category slug helper ─── */
function categoryToSlug(name: string | null): string | null {
  if (!name) return null;
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/* ─── component ─── */

export const ClientJobCard = ({ job, onJobUpdated }: ClientJobCardProps) => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const rebook = useRebook();
  const canRebook = ['completed', 'in_progress'].includes(job.status) && !!job.assigned_professional_id;

  const canComplete = job.status === 'in_progress' && job.assigned_professional_id && !!job.completion_requested_at;
  const { canEdit, canDuplicate, canClose } = getActions(job.status);
  const budgetLabel = formatBudgetLabel(job, t);
  const timingLabel = formatTimingLabel(job.start_timing, t);
  const dateLocale = getDateLocale();
  const catSlug = categoryToSlug(job.category);
  const CategoryIcon = job.category ? getCategoryIconByName(job.category) : null;

  const handleEdit = () => navigate(`/post?edit=${job.id}`);

  const handleDuplicate = () => {
    if (job.answers) {
      const answers = job.answers as Record<string, unknown>;
      const selected = (answers.selected ?? {}) as Record<string, unknown>;
      const logistics = (answers.logistics ?? {}) as Record<string, unknown>;
      const extras = (answers.extras ?? {}) as Record<string, unknown>;
      const microAnswers =
        (answers.microAnswers && typeof answers.microAnswers === 'object')
          ? (answers.microAnswers as Record<string, Record<string, unknown>>)
          : {};

      const draftState = {
        mainCategory: selected.mainCategory || job.category || '',
        mainCategoryId: '',
        subcategory: selected.subcategory || job.subcategory || '',
        subcategoryId: '',
        microNames: (selected.microNames as string[]) || [],
        microIds: (selected.microIds as string[]) || [],
        microSlugs: (selected.microSlugs as string[]) || [],
        answers: {
          microAnswers,
          ...(answers._pack_source ? { _pack_source: answers._pack_source } : {}),
          ...(answers._pack_slug ? { _pack_slug: answers._pack_slug } : {}),
          ...(typeof answers._pack_missing === 'boolean' ? { _pack_missing: answers._pack_missing } : {}),
        },
        logistics: {
          location: (logistics.location as string) || '',
          customLocation: (logistics.customLocation as string) || undefined,
          startDatePreset: (logistics.startDatePreset as string) || undefined,
          budgetRange: (logistics.budgetRange as string) || undefined,
          accessDetails: (logistics.accessDetails as string[]) || [],
        },
        extras: {
          photos: (extras.photos as string[]) || [],
          notes: (extras.notes as string) || undefined,
          permitsConcern: (extras.permitsConcern as boolean) || undefined,
        },
        dispatchMode: 'broadcast',
      };

      sessionStorage.setItem('wizardState', JSON.stringify(draftState));
      sessionStorage.setItem('wizardDraftChecked', '1');
    }

    toast.success(t('client.duplicateCreated', 'Draft created from copy'));
    navigate('/post?resume=true');
  };

  const handleClose = async () => {
    setIsClosing(true);
    try {
      const { error } = await supabase.rpc('cancel_job' as any, { p_job_id: job.id });
      if (error) {
        const msg = error.message || '';
        if (msg.includes('not_authorized')) {
          toast.error(t('client.closeNotAllowed', 'You are not authorized to cancel this job.'));
        } else if (msg.includes('job_not_cancellable')) {
          toast.error(t('client.closeNotAllowed', 'This job can no longer be closed directly. Use the cancellation request flow instead.'));
        } else {
          throw error;
        }
        return;
      }
      toast.success(t('client.jobClosed'));
      onJobUpdated();
    } catch {
      toast.error(t('client.closeFailed'));
    } finally {
      setIsClosing(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const result = await completeJob(job.id);
      if (result.success) {
        toast.success(t('client.completedSuccess'));
        setShowCompletionModal(false);
        if (job.assigned_professional_id) setShowRatingModal(true);
        onJobUpdated();
      } else {
        toast.error(result.error || t('client.completeFailed'));
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!job.assigned_professional_id) return;
    const result = await submitReview({
      jobId: job.id,
      revieweeId: job.assigned_professional_id,
      reviewerRole: 'client',
      rating,
      comment,
    });
    if (result.success) {
      toast.success(t('client.ratingSuccess'));
      setShowRatingModal(false);
    } else {
      toast.error(result.error || t('client.ratingFailed'));
    }
  };

  return (
    <>
      <div className="rounded-lg border border-border/70 bg-card hover:border-accent/30 transition-all group overflow-hidden flex flex-col sm:flex-row">
        {/* Category visual strip — left on desktop, top on mobile */}
        <div className="sm:w-32 sm:min-h-full aspect-[4/3] sm:aspect-auto shrink-0">
          <CategoryPlaceholder
            categorySlug={catSlug}
            categoryName={job.category}
            className="w-full h-full"
            iconSize="h-8 w-8"
          />
        </div>

        {/* Content */}
        <div className="p-4 flex-1 min-w-0 space-y-2">
          {/* Header: badge + timestamp */}
          <div className="flex items-center justify-between gap-2">
            <Badge variant={(STATUS_VARIANTS[job.status] ?? 'secondary') as any}>
              {getStatusLabel(job.status, t)}
            </Badge>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: dateLocale })}
            </span>
          </div>

          {/* Title — clamped to 2 lines */}
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {job.title}
          </h3>

          {/* Category context */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {job.category && (
              <Badge variant="secondary" className="text-xs font-normal gap-1 px-2">
                {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
                {txCategory(job.category, t) ?? job.category}
              </Badge>
            )}
            {job.subcategory && (
              <span className="text-xs text-muted-foreground">
                {txSubcategory(job.subcategory, t) ?? job.subcategory}
              </span>
            )}
          </div>

          {/* Meta icons row */}
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            {budgetLabel && (
              <span className="flex items-center gap-1">
                <Euro className="h-3.5 w-3.5" />
                {budgetLabel}
              </span>
            )}
            {timingLabel && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {timingLabel}
              </span>
            )}
            {job.conversation_count > 0 && (
              <span className="flex items-center gap-1 text-primary font-medium">
                <MessageSquare className="h-3.5 w-3.5" />
                {t('client.replies', { count: job.conversation_count })}
              </span>
            )}
          </div>

          {/* Status hints */}
          {job.status === 'ready' && (
            <p className="text-xs text-muted-foreground">{t('client.savedHint')}</p>
          )}
          {job.status === 'open' && !job.assigned_professional_id && job.conversation_count === 0 && (
            <p className="text-xs text-muted-foreground">{t('client.noProMessaged')}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {job.status === 'ready' && (
              <Button variant="default" size="sm" className="gap-1" asChild>
                <Link to={`/dashboard/jobs/${job.id}`}>{t('client.shareJob')}</Link>
              </Button>
            )}
            {job.status === 'open' && !job.assigned_professional_id && (
              <AssignProSelector jobId={job.id} onAssigned={onJobUpdated} />
            )}
            {['in_progress', 'completed'].includes(job.status) && job.assigned_professional_id && (
              <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" asChild title="Having an issue with this job? Start a structured resolution.">
                <Link to={`/contact?subject=issue&job=${job.id}`}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t('client.raiseIssue', 'Raise Issue')}
                </Link>
              </Button>
            )}
            {canComplete && (
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowCompletionModal(true)}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('client.complete')}
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to={job.status === 'ready' ? `/dashboard/jobs/${job.id}` : `/jobs/${job.id}`}>
                {t('client.view')}
              </Link>
            </Button>
            {canEdit && (
              <Button variant="ghost" size="sm" className="gap-1" onClick={handleEdit}>
                <Pencil className="h-3.5 w-3.5" />
                {t('client.editJob')}
              </Button>
            )}
            {canRebook && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => rebook.mutate(job.id)}
                disabled={rebook.isPending}
              >
                <RotateCw className="h-3.5 w-3.5" />
                {t('client.hireAgain', 'Hire Again')}
              </Button>
            )}
            {canDuplicate && (
              <Button variant="ghost" size="sm" className="gap-1" onClick={handleDuplicate}>
                <Copy className="h-3.5 w-3.5" />
                {t('client.duplicateJob')}
              </Button>
            )}
            {canClose && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                    {t('client.closeJob')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('client.closeJob')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('client.closeConfirm')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('client.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClose}
                      disabled={isClosing}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isClosing ? t('client.closing') : t('client.closeJob')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      <CompletionModal
        open={showCompletionModal}
        onOpenChange={setShowCompletionModal}
        jobTitle={job.title}
        onConfirm={handleComplete}
        isLoading={isCompleting}
      />
      <RatingModal
        open={showRatingModal}
        onOpenChange={setShowRatingModal}
        reviewerRole="client"
        onSubmit={handleRatingSubmit}
        onSkip={() => setShowRatingModal(false)}
      />
    </>
  );
};
