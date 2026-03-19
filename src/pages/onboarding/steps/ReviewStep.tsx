/**
 * ReviewStep - Final review and Go Live step
 * Builder-friendly: Clear checklist, encouraging language
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '@/lib/trackEvent';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Rocket, Loader2, User, MapPin, Briefcase, AlertCircle } from 'lucide-react';
import { getCategoryIconByName } from '@/lib/categoryIcons';
import { txCategory, txMicro } from '@/i18n/taxonomyTranslations';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useServiceTaxonomy } from '../hooks/useServiceTaxonomy';
import { useProfessionalServices } from '../hooks/useProfessionalServices';
import { useTranslation } from 'react-i18next';

interface ReviewStepProps {
  onBack: () => void;
  onNavigate?: (step: string) => void;
}

export function ReviewStep({ onBack, onNavigate }: ReviewStepProps) {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const { user, professionalProfile, refresh } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [freshZones, setFreshZones] = useState<string[] | null>(null);
  const [freshPhone, setFreshPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const [ppRes, profRes] = await Promise.all([
        supabase.from('professional_profiles').select('service_zones').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('phone').eq('user_id', user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setFreshZones(ppRes.data?.service_zones ?? []);
      setFreshPhone(profRes.data?.phone ?? null);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const { data: categories = [] } = useServiceTaxonomy();
  const { selectedMicroIds } = useProfessionalServices();

  const effectiveZones = freshZones ?? professionalProfile?.serviceZones ?? [];
  const effectivePhone = freshPhone ?? professionalProfile?.phone ?? null;

  const hasBasicInfo = !!(professionalProfile?.displayName?.trim() || professionalProfile?.businessName?.trim());
  const hasPhone = !!effectivePhone?.trim();
  const hasServiceArea = effectiveZones.length > 0;
  const hasServices = selectedMicroIds.size > 0;
  const canGoLive = hasBasicInfo && hasPhone && hasServiceArea && hasServices;

  const selectedServicesByCategory = categories.map(category => {
    const selectedMicros = category.subcategories.flatMap(sub => sub.micros).filter(m => selectedMicroIds.has(m.id));
    return { categoryName: category.name, categoryEmoji: category.icon_emoji, services: selectedMicros };
  }).filter(c => c.services.length > 0);

  const handleGoLive = async () => {
    if (!canGoLive || !user?.id) {
      toast.error(t('review.completeFirst'));
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('professional_profiles')
        .update({ profile_status: 'live', onboarding_phase: 'complete', is_publicly_listed: true, submitted_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (error) throw error;
      try { await refresh(); } catch (e) { console.warn('Session refresh failed after go-live:', e); }
      trackEvent('pro_profile_published', 'professional', { onboardingPhase: 'complete' });
      // Don't toast here — the listings page shows a welcome banner instead
      navigate('/professional/listings?welcome=1');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error going live:', error);
      toast.error(msg || t('review.goLiveFailed'));
      trackEvent('onboarding_step_failed', 'professional', { step: 'review', error_message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="card-grounded">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className={cn('flex h-16 w-16 items-center justify-center rounded-xl shadow-md', canGoLive ? 'bg-gradient-steel' : 'bg-muted')}>
              <Rocket className={cn('h-8 w-8', canGoLive ? 'text-white' : 'text-muted-foreground')} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {canGoLive ? t('review.readyTitle') : t('review.almostTitle')}
              </CardTitle>
              <CardDescription className="text-base">
                {canGoLive ? t('review.readyDescription') : t('review.almostDescription')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        {t('review.whyThisMatters')}
      </div>

      <Card className="card-grounded">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{t('review.checklist')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChecklistItem icon={User} label={t('review.aboutYou')} description={t('review.aboutYouDesc')} isComplete={hasBasicInfo && hasPhone} onClick={() => onNavigate?.('basic_info')} />
          <ChecklistItem icon={MapPin} label={t('review.whereYouWork')} description={t('review.whereYouWorkDesc')} isComplete={hasServiceArea} onClick={() => onNavigate?.('service_area')} />
          <ChecklistItem icon={Briefcase} label={t('review.jobsSelected')} description={t('review.jobsSelectedDesc', { count: selectedMicroIds.size })} isComplete={hasServices} onClick={() => onNavigate?.('services')} />
        </CardContent>
      </Card>

      {hasServices && (
        <Card className="card-grounded">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">{t('review.sendJobsFor')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {selectedServicesByCategory.map(category => (
                <div key={category.categoryName}>
                  <div className="flex items-center gap-2 mb-3">
                    {(() => { const CatIcon = getCategoryIconByName(category.categoryName); return <CatIcon className="h-5 w-5 text-primary" />; })()}
                    <span className="font-semibold text-base">{txCategory(category.categoryName, t)}</span>
                    <Badge variant="secondary" className="text-sm">{category.services.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-8">
                    {category.services.map(service => (
                      <span key={service.id} className="text-sm text-foreground bg-muted/60 px-3 py-1.5 rounded-lg">{txMicro(service.slug, t, service.name)}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-6 pt-4 border-t border-border">{t('review.changeAnytime')}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 pt-4 border-t border-border">
        <Button type="button" variant="outline" size="lg" onClick={onBack} className="flex-1 h-12 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 mr-2 shrink-0" />
          {t('review.goBack')}
        </Button>
        <Button type="button" onClick={handleGoLive} disabled={!canGoLive || isSubmitting} size="lg" className={cn('flex-1 h-12 flex items-center justify-center gap-3', canGoLive && 'bg-gradient-steel')}>
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin shrink-0" /> : <><Rocket className="h-5 w-5 shrink-0" />{t('review.goLive')}</>}
        </Button>
      </div>

      {!canGoLive && (
        <p className="text-center text-base text-muted-foreground">{t('review.completeAll')}</p>
      )}
    </div>
  );
}

function ChecklistItem({ icon: Icon, label, description, isComplete, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; description: string; isComplete: boolean; onClick?: () => void; }) {
  const isClickable = !!onClick;
  return (
    <div className={cn('flex items-center gap-4 p-4 rounded-xl border-2 transition-colors', isComplete ? 'bg-primary/10 border-primary/40' : 'bg-muted/30 border-border', isClickable && 'cursor-pointer hover:border-primary/50 hover:bg-muted/50 active:scale-[0.98]')} onClick={onClick} role={isClickable ? 'button' : undefined}>
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-full shrink-0', isComplete ? 'bg-primary/20' : 'bg-muted')}>
        {isComplete ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <AlertCircle className="h-6 w-6 text-muted-foreground" />}
      </div>
      <div className="flex-1">
        <p className={cn('font-semibold text-base', isComplete ? 'text-foreground' : 'text-muted-foreground')}>{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {isComplete && <Icon className="h-5 w-5 text-primary shrink-0" />}
    </div>
  );
}