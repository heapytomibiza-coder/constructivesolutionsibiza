/**
 * Match & Send Page - Browse matching professionals and send job invites
 * Shows a success interstitial when arriving from a fresh post (?posted=1)
 * Falls back to category-level matching when microIds are empty
 */

import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar,
  Euro,
  Star,
  Send,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  ArrowDown,
} from 'lucide-react';
import { getRankedProfessionals, getMicroIdsForFilter } from '@/pages/public/queries/rankedProfessionals.query';
import ProProfileDrawer from './components/ProProfileDrawer';

/** Resolve category/subcategory slugs to micro IDs for fallback matching */
async function resolveMicroIdsFromSlugs(
  categorySlug: string | null,
  subcategorySlug: string | null
): Promise<string[]> {
  if (!categorySlug) return [];

  // Try subcategory first for tighter match
  if (subcategorySlug) {
    const { data: sub } = await supabase
      .from('service_subcategories')
      .select('id')
      .eq('slug', subcategorySlug)
      .maybeSingle();

    if (sub?.id) {
      const ids = await getMicroIdsForFilter(null, sub.id);
      if (ids.length > 0) return ids;
    }
  }

  // Fall back to category-level
  const { data: cat } = await supabase
    .from('service_categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle();

  if (cat?.id) {
    return getMicroIdsForFilter(cat.id, null);
  }

  return [];
}

export default function MatchAndSend() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromPost = searchParams.get('posted') === '1';
  const { t } = useTranslation('dashboard');
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [selectedProId, setSelectedProId] = useState<string | null>(null);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [showInterstitial, setShowInterstitial] = useState(fromPost);
  const prosListRef = useRef<HTMLDivElement>(null);

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
  const directMicroIds = (selected.microIds as string[]) || [];
  const microNames = (selected.microNames as string[]) || [];

  // Resolve micro IDs: direct from answers, or fallback from category/subcategory slugs
  const { data: resolvedMicroIds = [], isLoading: resolvingMicros } = useQuery({
    queryKey: ['resolve_micros', job?.category, job?.subcategory, directMicroIds],
    queryFn: async () => {
      if (directMicroIds.length > 0) return directMicroIds;
      return resolveMicroIdsFromSlugs(job?.category ?? null, job?.subcategory ?? null);
    },
    enabled: !!job,
  });

  const isFallbackMatch = directMicroIds.length === 0 && resolvedMicroIds.length > 0;

  // Fetch matched professionals
  const { data: matchedPros = [], isLoading: prosLoading } = useQuery({
    queryKey: ['matched_pros', resolvedMicroIds],
    queryFn: () => getRankedProfessionals(resolvedMicroIds),
    enabled: resolvedMicroIds.length > 0,
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

  const handleScrollToPros = () => {
    setShowInterstitial(false);
    setTimeout(() => {
      prosListRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

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

  const isLoading = prosLoading || resolvingMicros;

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
            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {area}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {job.start_timing || t('matchAndSend.flexible')}
              </span>
              {(job.budget_min || job.budget_max) && (
                <span className="flex items-center gap-1">
                  <Euro className="h-3 w-3" />
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
        {/* Success Interstitial — shown only on fresh post */}
        {showInterstitial && (
          <Card className="border-primary/30 bg-primary/5 mb-8">
            <CardContent className="py-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {t('matchAndSend.successTitle')}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                {t('matchAndSend.successDesc')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button onClick={handleScrollToPros} className="gap-2">
                  <ArrowDown className="h-4 w-4" />
                  {t('matchAndSend.viewPros')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  {t('matchAndSend.goToJobs')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pro List Section */}
        <div ref={prosListRef}>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display text-xl font-bold">{t('matchAndSend.matchingTitle')}</h2>
            {isFallbackMatch && (
              <Badge variant="secondary" className="text-xs">
                {t('matchAndSend.categoryMatch')}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {t('matchAndSend.found', { count: matchedPros.length })}
            {microNames.length > 0 && ` ${t('matchAndSend.forServices', { services: microNames.join(', ') })}`}
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : matchedPros.length === 0 ? (
            /* Improved empty state — reassure user the job is live */
            <Card className="border-border/70">
              <CardContent className="py-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Briefcase className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {t('matchAndSend.emptyTitle')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  {t('matchAndSend.emptyDesc')}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button onClick={() => navigate(`/dashboard/jobs/${jobId}`)}>
                    {t('matchAndSend.emptyViewJob')}
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    {t('matchAndSend.goToJobs')}
                  </Button>
                </div>
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
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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
                              <span>{t('matchAndSend.services', { count: pro.services_count })}</span>
                            )}
                            {pro.coverage > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {t('matchAndSend.match', { percent: Math.round(pro.coverage * 100) })}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProId(pro.user_id)}
                          >
                            {t('matchAndSend.viewProfile')}
                          </Button>
                          
                          {isInvited ? (
                            <Button size="sm" variant="secondary" disabled className="gap-1.5">
                              <UserCheck className="h-3.5 w-3.5" />
                              {t('matchAndSend.invited')}
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
                              {t('matchAndSend.invite')}
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
