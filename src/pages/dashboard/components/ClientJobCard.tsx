import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
import { CompletionModal, RatingModal } from '@/pages/jobs/components';
import { completeJob } from '@/pages/jobs/actions/completeJob.action';
import { submitReview } from '@/pages/jobs/actions/submitReview.action';
import { toast } from 'sonner';
import { AssignProSelector } from './AssignProSelector';

interface Job {
  id: string;
  title: string;
  status: string;
  category: string | null;
  subcategory: string | null;
  created_at: string;
  is_publicly_listed: boolean;
  assigned_professional_id: string | null;
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
    case 'in_progress':
      return 'outline';
    case 'completed':
      return 'success' as const;
    default:
      return 'secondary';
  }
};

export const ClientJobCard = ({ job, onJobUpdated }: ClientJobCardProps) => {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const canComplete = job.status === 'in_progress' && job.assigned_professional_id;

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const result = await completeJob(job.id);
      if (result.success) {
        toast.success('Job marked as completed!');
        setShowCompletionModal(false);
        // Show rating modal if there's an assigned pro
        if (job.assigned_professional_id) {
          setShowRatingModal(true);
        }
        onJobUpdated();
      } else {
        toast.error(result.error || 'Failed to complete job');
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
      toast.success('Thanks for your rating!');
      setShowRatingModal(false);
    } else {
      toast.error(result.error || 'Failed to submit rating');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 rounded-lg border border-border/70 bg-card hover:bg-muted/50 hover:border-accent/30 transition-all group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium truncate group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <Badge variant={getStatusBadgeVariant(job.status)}>
              {job.status === 'in_progress' ? 'In Progress' : job.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {job.category && job.subcategory 
              ? `${job.category} → ${job.subcategory}` 
              : 'Uncategorized'}
            {' · '}
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Show assignment selector for open jobs without assigned pro */}
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
            <Link to={`/jobs/${job.id}`}>View</Link>
          </Button>
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
