/**
 * Job Ticket Detail Page - Control centre for a saved job
 * Shows job summary + distribution actions + activity
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
import {
  ArrowLeft,
  Globe,
  UserPlus,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  Clock,
  CheckCircle2,
  Eye,
  XCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  ready: { label: 'Saved — Not shared yet', variant: 'secondary' },
  open: { label: 'Live on Job Board', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'outline' },
  completed: { label: 'Completed', variant: 'default' },
  closed: { label: 'Closed', variant: 'destructive' },
};

export default function JobTicketDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch job details
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

  // Fetch invites for this job
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

  // Fetch professional names for invites
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

  const proNameMap = new Map(inviteProfiles.map(p => [p.user_id, p.display_name || 'Professional']));

  const handlePostToBoard = async () => {
    if (!jobId) return;
    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'open', is_publicly_listed: true })
        .eq('id', jobId);
      if (error) throw error;
      toast.success('Job posted to the job board!');
      queryClient.invalidateQueries({ queryKey: ['job_ticket', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs_board'] });
    } catch {
      toast.error('Failed to post job. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!jobId || !confirm('Are you sure you want to delete this job?')) return;
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);
      if (error) throw error;
      toast.success('Job deleted.');
      navigate('/dashboard/client');
    } catch {
      toast.error('Failed to delete job.');
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
        <p className="text-muted-foreground">Job not found.</p>
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
      {/* Nav */}
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
        {/* Status + Actions Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Badge variant={statusConfig.variant} className="text-sm px-3 py-1">
            {statusConfig.label}
          </Badge>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>

        {/* Job Summary Card */}
        <Card className="overflow-hidden">
          <div className="bg-primary/5 px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="font-medium">
                {job.category || 'Category'}
              </Badge>
              {job.subcategory && (
                <span className="text-sm text-muted-foreground">→ {job.subcategory}</span>
              )}
            </div>
          </div>

          <CardContent className="p-5 space-y-4">
            {/* What you need */}
            <section>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">What you need</h4>
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

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-xs text-muted-foreground block">Where</span>
                  <p className="text-sm font-medium">{area}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-xs text-muted-foreground block">When</span>
                  <p className="text-sm font-medium capitalize">{job.start_timing || 'Flexible'}</p>
                </div>
              </div>
              {(job.budget_min || job.budget_max) && (
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-xs text-muted-foreground block">Budget</span>
                    <p className="text-sm font-medium text-primary">
                      {job.budget_min && job.budget_max
                        ? `€${job.budget_min}–€${job.budget_max}`
                        : job.budget_min
                          ? `€${job.budget_min}+`
                          : `Up to €${job.budget_max}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribution Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display">How would you like to share this job?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Post to Job Board */}
            <button
              onClick={handlePostToBoard}
              disabled={isPublishing || job.status === 'open'}
              className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/40 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Post to Job Board</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {job.status === 'open'
                    ? 'Already posted — professionals can see and respond'
                    : 'All professionals in this category can see and respond'}
                </p>
              </div>
              {job.status === 'open' && (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              )}
            </button>

            {/* Invite Specific Professionals */}
            <Link
              to={`/dashboard/jobs/${jobId}/invite`}
              className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/40 transition-all text-left block"
            >
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <UserPlus className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Invite Specific Professionals</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Browse matching professionals, view profiles, and send this job directly
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Activity / Invites */}
        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-display">Invites Sent ({invites.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invites.map((invite) => {
                const name = proNameMap.get(invite.professional_id) || 'Professional';
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
                        <p className="text-xs text-muted-foreground capitalize">{invite.status}</p>
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