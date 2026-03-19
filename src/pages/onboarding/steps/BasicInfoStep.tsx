import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/trackEvent';
import { Loader2, User, Phone, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nextPhase } from '@/pages/onboarding/lib/phaseProgression';
import { useTranslation } from 'react-i18next';

interface BasicInfoStepProps {
  onComplete: () => void;
}

interface BasicInfoData {
  display_name: string;
  phone: string;
  bio: string;
  business_name: string;
  tagline: string;
}

export function BasicInfoStep({ onComplete }: BasicInfoStepProps) {
  const { t } = useTranslation('onboarding');
  const { user, refresh, professionalProfile } = useSession();
  const currentPhase = professionalProfile?.onboardingPhase ?? 'not_started';
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<BasicInfoData>({
    display_name: '',
    phone: '',
    bio: '',
    business_name: '',
    tagline: '',
  });

  // Load existing data
  const { data: existingData, isLoading } = useQuery({
    queryKey: ['professional-basic-info', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, phone')
        .eq('user_id', user!.id)
        .maybeSingle();

      const { data: proProfile } = await supabase
        .from('professional_profiles')
        .select('display_name, bio, business_name, tagline')
        .eq('user_id', user!.id)
        .maybeSingle();

      return {
        display_name: proProfile?.display_name || profile?.display_name || '',
        phone: profile?.phone || '',
        bio: proProfile?.bio || '',
        business_name: (proProfile as { business_name?: string })?.business_name || '',
        tagline: (proProfile as { tagline?: string })?.tagline || '',
      };
    },
  });

  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    }
  }, [existingData]);

  const saveMutation = useMutation({
    mutationFn: async (data: BasicInfoData) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: data.display_name, phone: data.phone })
        .eq('user_id', user.id);
      if (profileError) throw profileError;

      const { error: proProfileError } = await supabase
        .from('professional_profiles')
        .update({
          display_name: data.display_name,
          bio: data.bio,
          business_name: data.business_name,
          tagline: data.tagline,
          onboarding_phase: nextPhase(currentPhase, 'basic_info'),
        })
        .eq('user_id', user.id);
      if (proProfileError) throw proProfileError;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['professional-basic-info'] });
      try { await refresh(); } catch (e) { console.warn('Session refresh failed after basic info save:', e); }
      toast.success(t('basicInfo.saved'));
      onComplete();
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Error saving basic info:', error);
      toast.error(msg || t('basicInfo.somethingWrong'));
      trackEvent('onboarding_step_failed', 'professional', { step: 'basic_info', error_message: msg });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.display_name.trim()) {
      toast.error(t('basicInfo.enterName'));
      return;
    }
    saveMutation.mutate(formData);
  };

  const bioNearLimit = formData.bio.length > 400;
  const taglineNearLimit = formData.tagline.length > 80;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <Card className="card-grounded animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-steel shadow-md">
            <User className="h-7 w-7 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">{t('basicInfo.title')}</CardTitle>
            <CardDescription className="text-base">{t('basicInfo.description')}</CardDescription>
          </div>
        </div>
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 mt-4">
          {t('basicInfo.whyThisMatters')}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="display_name" className="text-base font-medium">
              {t('basicInfo.nameLabel')} <span className="text-destructive">{t('basicInfo.nameRequired')}</span>
            </Label>
            <Input
              id="display_name"
              placeholder={t('basicInfo.namePlaceholder')}
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="phone" className="text-base font-medium flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              {t('basicInfo.phoneLabel')}
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t('basicInfo.phonePlaceholder')}
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground">{t('basicInfo.phoneHint')}</p>
          </div>

          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="business_name" className="text-base font-medium">
              {t('basicInfo.businessNameLabel')} <span className="text-muted-foreground text-sm">{t('basicInfo.businessNameOptional')}</span>
            </Label>
            <Input
              id="business_name"
              placeholder={t('basicInfo.businessNamePlaceholder')}
              value={formData.business_name}
              onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="tagline" className="text-base font-medium flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              {t('basicInfo.taglineLabel')}
            </Label>
            <Input
              id="tagline"
              placeholder={t('basicInfo.taglinePlaceholder')}
              value={formData.tagline}
              onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
              maxLength={100}
            />
            <p className={cn('text-sm transition-colors', taglineNearLimit ? 'text-accent' : 'text-muted-foreground')}>
              {t('basicInfo.taglineHint')} • {t('basicInfo.taglineCount', { count: formData.tagline.length })}
            </p>
          </div>

          <div className="space-y-2 animate-fade-in">
            <Label htmlFor="bio" className="text-base font-medium">{t('basicInfo.bioLabel')}</Label>
            <Textarea
              id="bio"
              placeholder={t('basicInfo.bioPlaceholder')}
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
              maxLength={500}
              className="resize-none text-lg"
            />
            <p className={cn('text-sm transition-colors', bioNearLimit ? 'text-accent' : 'text-muted-foreground')}>
              {t('basicInfo.bioCount', { count: formData.bio.length })}
            </p>
          </div>

          <Button type="submit" size="lg" className="w-full animate-fade-in" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-5 w-5 mr-2" />
            )}
            {t('basicInfo.nextStep')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}