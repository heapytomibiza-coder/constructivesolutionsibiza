import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Pencil, Copy, X } from 'lucide-react';
import { CompletionModal, RatingModal } from '@/pages/jobs/components';
import { completeJob } from '@/pages/jobs/actions/completeJob.action';
import { submitReview } from '@/pages/jobs/actions/submitReview.action';
import { toast } from 'sonner';
import { AssignProSelector } from '@/pages/dashboard/shared/components/AssignProSelector';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
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

interface Job {
  id: string;
  title: string;
  status: string;
  category: string | null;
  subcategory: string | null;
  created_at: string;
  is_publicly_listed: boolean;
  assigned_professional_id: string | null;
  answers?: unknown;
}

interface ClientJobCardProps {
  job: Job;
  onJobUpdated: () => void;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'open':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'ready':
      return 'secondary';
    case 'in_progress':
      return 'outline';
    case 'completed':
      return 'success' as const;
    case 'cancelled':
      return 'destructive' as const;
    default:
      return 'secondary';
  }
};

const getStatusLabel = (status: string, t: (key: string) => string) => {
  const key = `client.status.${status}`;
  const translated = t(key);
  return translated !== key ? translated : status;
};

/** Which actions are available per status */
function getActions(status: string) {
  const canEdit = ['draft', 'ready', 'open'].includes(status);
  const canDuplicate = ['draft', 'ready', 'open', 'in_progress', 'completed'].includes(status);
  const canClose = ['draft', 'ready', 'open', 'in_progress'].includes(status);
  return { canEdit, canDuplicate, canClose };
}

export const ClientJobCard = ({ job, onJobUpdated }: ClientJobCardProps) => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const canComplete = job.status === 'in_progress' && job.assigned_professional_id;
  const { canEdit, canDuplicate, canClose } = getActions(job.status);

  const handleEdit = () => {
    navigate(`/post?edit=${job.id}`);
  };

  const handleDuplicate = () => {
    // Store the job's answers in sessionStorage so wizard picks it up as a draft
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
        mainCategoryId: '', // Will need lookup — wizard handles empty gracefully
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
      sessionStorage.setItem('wizardDraftChecked', '1'); // Skip draft prompt
    }

    toast.success(t('client.duplicateCreated', 'Draft created from copy'));
    navigate('/post?resume=true');
  };

  const handleClose = async () => {
    setIsClosing(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', job.id);

      if (error) throw error;
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
        if (job.assigned_professional_id) {
          setShowRatingModal(true);
        }
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
      <div className="p-4 rounded-lg border border-border/70 bg-card hover:bg-muted/50 hover:border-accent/30 transition-all group">
        {/* Header row: Badge + timestamp */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant={getStatusBadgeVariant(job.status)}>
            {getStatusLabel(job.status, t)}
          </Badge>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </span>
        </div>
        
        {/* Title */}
        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors mb-1">
          {job.title}
        </h3>
        
        {/* Category */}
        <p className="text-sm text-muted-foreground mb-3">
          {job.category && job.subcategory 
            ? `${job.category} → ${job.subcategory}` 
            : t('client.uncategorized')}
        </p>
        
        {/* Status message for saved jobs */}
        {job.status === 'ready' && (
          <p className="text-xs text-muted-foreground mb-3">
            Saved — choose how to share from the job page
          </p>
        )}
        
        {/* Status message for open jobs */}
        {job.status === 'open' && !job.assigned_professional_id && (
          <p className="text-xs text-muted-foreground mb-3">
            No professionals have messaged yet
          </p>
        )}
        
        {/* Actions row */}
        <div className="flex items-center gap-2 flex-wrap">
          {job.status === 'ready' && (
            <Button variant="default" size="sm" className="gap-1" asChild>
              <Link to={`/dashboard/jobs/${job.id}`}>
                Share Job
              </Link>
            </Button>
          )}
          {job.status === 'open' && !job.assigned_professional_id && (
            <AssignProSelector jobId={job.id} onAssigned={onJobUpdated} />
          )}
          {canComplete && (
            <Button 
              variant="outline" 
              size="sm"
              className="gap-1"
              onClick={() => setShowCompletionModal(true)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to={job.status === 'ready' ? `/dashboard/jobs/${job.id}` : `/jobs/${job.id}`}>View</Link>
          </Button>

          {/* Edit */}
          {canEdit && (
            <Button variant="ghost" size="sm" className="gap-1" onClick={handleEdit}>
              <Pencil className="h-3.5 w-3.5" />
              {t('client.editJob')}
            </Button>
          )}

          {/* Duplicate */}
          {canDuplicate && (
            <Button variant="ghost" size="sm" className="gap-1" onClick={handleDuplicate}>
              <Copy className="h-3.5 w-3.5" />
              {t('client.duplicateJob')}
            </Button>
          )}

          {/* Close */}
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
                  <AlertDialogDescription>
                    {t('client.closeConfirm')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClose}
                    disabled={isClosing}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isClosing ? 'Closing...' : t('client.closeJob')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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
