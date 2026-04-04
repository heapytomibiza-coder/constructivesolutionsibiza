import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/trackEvent';
import { Loader2, User, Phone, ArrowRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nextPhase } from '@/pages/onboarding/lib/phaseProgression';
import { useTranslation } from 'react-i18next';
import {
  ZoneTile,
  IslandWideTile,
  IBIZA_ZONES,
  allZoneIds,
} from '@/shared/components/professional';

interface BasicInfoStepProps {
  onComplete: () => void;
}

interface BasicInfoData {
  display_name: string;
  phone: string;
}

export function BasicInfoStep({ onComplete }: BasicInfoStepProps) {
  const { t } = useTranslation('onboarding');
  const { user, refresh, professionalProfile } = useSession();
  const currentPhase = professionalProfile?.onboardingPhase ?? 'not_started';
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<BasicInfoData>({
    display_name: '',
    phone: '',
  });

  // Zone state
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [islandWide, setIslandWide] = useState(false);

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
        .select('display_name, service_zones')
        .eq('user_id', user!.id)
        .maybeSingle();

      return {
        display_name: proProfile?.display_name || profile?.display_name || '',
        phone: profile?.phone || '',
        service_zones: (proProfile as { service_zones?: string[] })?.service_zones || [],
      };
    },
  });

  useEffect(() => {
    if (existingData) {
      setFormData({
        display_name: existingData.display_name,
        phone: existingData.phone,
      });
      // Hydrate zones
      const zones = existingData.service_zones || [];
      const allIds = allZoneIds();
      if (zones.includes('island-wide') || zones.length === allIds.length) {
        setIslandWide(true);
        setSelectedZones(allIds);
      } else {
        setSelectedZones(zones);
      }
    }
  }, [existingData]);

  const saveMutation = useMutation({
    mutationFn: async (data: BasicInfoData & { zones: string[] }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: data.display_name, phone: data.phone })
        .eq('user_id', user.id);
      if (profileError) throw profileError;

      // Upsert professional_profiles — covers both identity and zones in one save
      const { error: proProfileError } = await supabase
        .from('professional_profiles')
        .upsert({
          user_id: user.id,
          display_name: data.display_name,
          service_zones: data.zones,
          service_area_type: 'zones',
          onboarding_phase: nextPhase(currentPhase, 'service_area'),
        }, { onConflict: 'user_id' });
      if (proProfileError) throw proProfileError;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['professional-basic-info'] });
      queryClient.invalidateQueries({ queryKey: ['professional-service-area'] });
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

  // Zone handlers
  const handleZoneToggle = (zoneId: string) => {
    setSelectedZones(prev => prev.includes(zoneId) ? prev.filter(id => id !== zoneId) : [...prev, zoneId]);
    setIslandWide(false);
  };

  const handleIslandWide = () => {
    if (islandWide) { setIslandWide(false); setSelectedZones([]); }
    else { setIslandWide(true); setSelectedZones(allZoneIds()); }
  };

  const handleSelectGroup = (groupZones: { id: string }[]) => {
    const groupIds = groupZones.map(z => z.id);
    const allSelected = groupIds.every(id => selectedZones.includes(id));
    if (allSelected) { setSelectedZones(prev => prev.filter(id => !groupIds.includes(id))); }
    else { setSelectedZones(prev => [...new Set([...prev, ...groupIds])]); }
    setIslandWide(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.display_name.trim()) {
      toast.error(t('basicInfo.enterName'));
      return;
    }
    if (selectedZones.length === 0) {
      toast.error(t('basicInfo.selectZone'));
      return;
    }
    saveMutation.mutate({ ...formData, zones: selectedZones });
  };

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
          {/* Name */}
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

          {/* Phone */}
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
            {!formData.phone.trim() && (
              <p className="text-sm text-accent font-medium">{t('basicInfo.phoneRequired')}</p>
            )}
          </div>

          {/* Zone Picker */}
          <div className="space-y-4 animate-fade-in">
            <Label className="text-base font-medium flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              {t('serviceArea.title')}
            </Label>
            <p className="text-sm text-muted-foreground">{t('serviceArea.description')}</p>

            <IslandWideTile selected={islandWide} onClick={handleIslandWide} />

            <div className="space-y-5">
              {IBIZA_ZONES.map((group) => (
                <div key={group.group} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-foreground">{t(`serviceArea.${group.group}`)}</h4>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleSelectGroup(group.zones)} className="text-sm text-primary hover:text-primary/80">
                      {group.zones.every(z => selectedZones.includes(z.id)) ? t('serviceArea.deselectAll') : t('serviceArea.selectAll')}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.zones.map((zone) => (
                      <ZoneTile key={zone.id} selected={selectedZones.includes(zone.id)} onClick={() => handleZoneToggle(zone.id)} label={zone.label} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selectedZones.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 text-base text-foreground animate-fade-in">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>
                  {islandWide
                    ? t('serviceArea.islandWide')
                    : t('serviceArea.areasSelected', { count: selectedZones.length })}
                </span>
              </div>
            )}
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