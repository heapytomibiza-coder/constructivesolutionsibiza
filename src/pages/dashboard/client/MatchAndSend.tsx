/**
 * Match & Send Page - Browse matching professionals and send job invites
 * Ticket-aware: shows job summary + matched pros with profile drawer
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  Send,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { getRankedProfessionals, getMicroIdsForFilter } from '@/pages/public/queries/rankedProfessionals.query';
import ProProfileDrawer from './components/ProProfileDrawer';

export default function MatchAndSend() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [selectedProId, setSelectedProId] = useState<string | null>(null);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  // Fetch job
  const { data: job, isLoading: jobLoading } = useQuery({
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

  // Get micro IDs from job for matching
  const answers = job?.answers as Record<string, unknown> | null;
  const selected = (answers?.selected as Record<string, unknown>) || {};
  const microIds = (selected.microIds as string[]) || [];
  const microNames = (selected.microNames as string[]) || [];

  // Fetch matched professionals
  const { data: matchedPros = [], isLoading: prosLoading } = useQuery({
    queryKey: ['matched_pros', microIds],
    queryFn: () => getRankedProfessionals(microIds),
    enabled: microIds.length > 0,
  });

  // Fetch already-invited pro IDs
  const { data: existingInvites = [] } = useQuery({
    queryKey: ['job_invites', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_invites')
        .select('professional_id')
        .eq('job_id', jobId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!jobId,
  });

  const invitedIds = new Set(existingInvites.map(i => i.professional_id));

  const handleInvite = async (proUserId: string) => {
    if (!jobId || !user) return;
    setSendingTo(proUserId);
    try {
      const { error } = await supabase
        .from('job_invites')
        .insert({
          job_id: jobId,
          professional_id: proUserId,
          status: 'sent',
        });
      if (error) {
        if (error.code === '23505') {
          toast.info(t('matchAndSend.alreadyInvited'));
          return;
        }
        throw error;
      }
      toast.success(t('matchAndSend.inviteSent'));
      queryClient.invalidateQueries({ queryKey: ['job_invites', jobId] });
    } catch {
      toast.error(t('matchAndSend.inviteFailed'));
    } finally {
      setSendingTo(null);
    }
  };

  const locationData = job?.location as Record<string, unknown> | null;
  const area = (locationData?.area as string) || job?.area || 'Ibiza';

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('matchAndSend.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Ticket Summary Bar */}
      <div className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container max-w-4xl flex items-center gap-3 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/jobs/${jobId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {t('matchAndSend.sending', { category: job.category, subcategory: job.subcategory || job.title })}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {area}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {job.start_timing || t('matchAndSend.flexible')}
              </span>
              {(job.budget_min || job.budget_max) && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {job.budget_min && job.budget_max
                    ? `€${job.budget_min}–€${job.budget_max}`
                    : `€${job.budget_min || job.budget_max}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl py-6">
        <h2 className="font-display text-xl font-bold mb-1">{t('matchAndSend.matchingTitle')}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {t('matchAndSend.found', { count: matchedPros.length })}
          {microNames.length > 0 && ` ${t('matchAndSend.forServices', { services: microNames.join(', ') })}`}
        </p>

        {prosLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : matchedPros.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {t('matchAndSend.noMatch')}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate(`/dashboard/jobs/${jobId}`)}
              >
                {t('matchAndSend.backToJob')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {matchedPros.map((pro) => {
              const isInvited = invitedIds.has(pro.user_id);
              const isSending = sendingTo === pro.user_id;

              return (
                <Card key={pro.user_id} className="border-border/70 hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground truncate">
                            {pro.display_name || t('proProfile.professional')}
                          </p>
                          {pro.verification_status === 'verified' && (
                            <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {pro.match_score > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-amber-500" />
                              {(pro.match_score / 10).toFixed(1)}
                            </span>
                          )}
                          {pro.services_count && (
                            <span>{pro.services_count} services</span>
                          )}
                          {pro.coverage > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(pro.coverage * 100)}% match
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProId(pro.user_id)}
                        >
                          View Profile
                        </Button>
                        
                        {isInvited ? (
                          <Button size="sm" variant="secondary" disabled className="gap-1.5">
                            <UserCheck className="h-3.5 w-3.5" />
                            Invited
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleInvite(pro.user_id)}
                            disabled={isSending}
                          >
                            {isSending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Invite
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile Drawer */}
      <ProProfileDrawer
        proUserId={selectedProId}
        open={!!selectedProId}
        onClose={() => setSelectedProId(null)}
        onInvite={
          selectedProId && !invitedIds.has(selectedProId)
            ? () => {
                handleInvite(selectedProId);
                setSelectedProId(null);
              }
            : undefined
        }
        isInvited={selectedProId ? invitedIds.has(selectedProId) : false}
      />
    </div>
  );
}