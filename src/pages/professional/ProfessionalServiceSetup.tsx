import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CategorySelector from '@/features/wizard/db-powered/CategorySelector';
import SubcategorySelector from '@/features/wizard/db-powered/SubcategorySelector';
import { 
  ArrowLeft, Check, Plus, X, Loader2, Shield, Heart, 
  ThumbsUp, Minus, Ban, Unlock
} from 'lucide-react';
import { nextPhase } from '@/pages/onboarding/lib/phaseProgression';
import { PLATFORM } from '@/domain/scope';
import { JobTypeCard } from './components/JobTypeCard';
import { UnlockProgress } from './components/UnlockProgress';
import { RecommendedJobTypes } from './components/RecommendedJobTypes';
import { useJobTypeStats } from './hooks/useJobTypeStats';
import { useRecommendedJobTypes } from './hooks/useRecommendedJobTypes';
import { useQuestionPackMeta } from './hooks/useQuestionPackMeta';

type SetupStep = 'browse' | 'category' | 'subcategory' | 'micro' | 'preferences';
type Preference = 'love' | 'like' | 'neutral' | 'avoid';

interface MicroCategory {
  id: string;
  name: string;
  slug: string;
}

interface ServiceWithDetails {
  id: string;
  micro_id: string;
  micro_name: string;
  micro_slug: string;
  category_name: string;
  subcategory_name: string;
  status: string;
  preference?: Preference;
}

const PREFERENCE_CONFIG: Record<Preference, { icon: React.ReactNode; label: string; color: string }> = {
  love: { icon: <Heart className="h-4 w-4" />, label: 'Love it', color: 'text-destructive' },
  like: { icon: <ThumbsUp className="h-4 w-4" />, label: 'Like', color: 'text-primary' },
  neutral: { icon: <Minus className="h-4 w-4" />, label: 'Neutral', color: 'text-muted-foreground' },
  avoid: { icon: <Ban className="h-4 w-4" />, label: 'Avoid', color: 'text-accent-foreground' },
};

/**
 * PROFESSIONAL SERVICE SETUP - "Unlock Your Job Types"
 * 
 * Reframed as job unlocking rather than service configuration.
 * Each micro represents a job type the builder can receive.
 */
const ProfessionalServiceSetup = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, refresh } = useSession();
  const { t } = useTranslation('onboarding');
  const { t: tCommon } = useTranslation('common');

  // Wizard state
  const [step, setStep] = useState<SetupStep>('browse');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState('');
  const [pendingMicroIds, setPendingMicroIds] = useState<string[]>([]);
  const [pendingMicroSlugs, setPendingMicroSlugs] = useState<string[]>([]);
  const [pendingPreferences, setPendingPreferences] = useState<Record<string, Preference>>({});

  // Fetch existing services with preferences
  const { data: servicesWithDetails = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['professional-services-with-prefs', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<ServiceWithDetails[]> => {
      // Get services
      const { data: services, error: servicesError } = await supabase
        .from('professional_services')
        .select('id, micro_id, status')
        .eq('user_id', user!.id);

      if (servicesError) throw servicesError;
      if (!services?.length) return [];

      // Get micro details
      const microIds = services.map(s => s.micro_id);
      const { data: micros } = await supabase
        .from('service_micro_categories')
        .select(`
          id, name, slug,
          service_subcategories!inner(
            name,
            service_categories!inner(name)
          )
        `)
        .in('id', microIds);

      // Get preferences
      const { data: prefs } = await supabase
        .from('professional_micro_preferences')
        .select('micro_id, preference')
        .eq('user_id', user!.id);

      const prefsMap = new Map(prefs?.map(p => [p.micro_id, p.preference as Preference]) || []);
      const microsMap = new Map(micros?.map(m => [m.id, m]) || []);

      return services.map(s => {
        const micro = microsMap.get(s.micro_id) as {
          id: string;
          name: string;
          slug: string;
          service_subcategories: { name: string; service_categories: { name: string } };
        } | undefined;
        
        return {
          id: s.id,
          micro_id: s.micro_id,
          micro_name: micro?.name || 'Unknown',
          micro_slug: micro?.slug || '',
          category_name: micro?.service_subcategories?.service_categories?.name || '',
          subcategory_name: micro?.service_subcategories?.name || '',
          status: s.status || 'offered',
          preference: prefsMap.get(s.micro_id),
        };
      });
    },
  });

  // Fetch micros for current subcategory
  const { data: microCategories = [], isLoading: isLoadingMicros } = useQuery({
    queryKey: ['micros-for-subcategory', selectedSubcategoryId],
    enabled: !!selectedSubcategoryId,
    queryFn: async (): Promise<MicroCategory[]> => {
      const { data, error } = await supabase
        .from('service_micro_categories')
        .select('id, name, slug')
        .eq('subcategory_id', selectedSubcategoryId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data || [];
    },
  });

  // Get slugs for stats query
  const microSlugs = useMemo(() => microCategories.map(m => m.slug), [microCategories]);

  // Job intelligence hooks
  const { data: jobStats = {} } = useJobTypeStats(microSlugs);
  const { data: recommendations = [] } = useRecommendedJobTypes(selectedSubcategoryId);
  const { data: packMeta = {} } = useQuestionPackMeta(microSlugs);

  const existingMicroIds = useMemo(() => 
    new Set(servicesWithDetails.map(s => s.micro_id)), 
    [servicesWithDetails]
  );

  // Add services mutation
  const addServicesMutation = useMutation({
    mutationFn: async (data: { microIds: string[]; preferences: Record<string, Preference> }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Insert services
      const serviceInserts = data.microIds.map(micro_id => ({
        user_id: user.id,
        micro_id,
        status: 'offered',
      }));

      const { error: servicesError } = await supabase
        .from('professional_services')
        .upsert(serviceInserts, { onConflict: 'user_id,micro_id' });

      if (servicesError) throw servicesError;

      // Insert preferences
      const prefInserts = Object.entries(data.preferences).map(([micro_id, preference]) => ({
        user_id: user.id,
        micro_id,
        preference,
      }));

      if (prefInserts.length > 0) {
        const { error: prefsError } = await supabase
          .from('professional_micro_preferences')
          .upsert(prefInserts, { onConflict: 'user_id,micro_id' });

        if (prefsError) throw prefsError;
      }

      // Update services count directly
      const { count } = await supabase
        .from('professional_services')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      await supabase
        .from('professional_profiles')
        .update({ services_count: count || 0 })
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-services-with-prefs'] });
      toast.success(t('actions.unlock', { count: pendingMicroIds.length }));
      resetWizard();
    },
    onError: (error) => {
      console.error('Error adding services:', error);
      toast.error('Failed to unlock job types');
    },
  });

  // Remove service mutation
  const removeServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('professional_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-services-with-prefs'] });
      toast.success('Job type removed');
    },
    onError: () => {
      toast.error('Failed to remove job type');
    },
  });

  // Update preference mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ microId, preference }: { microId: string; preference: Preference }) => {
      const { error } = await supabase
        .from('professional_micro_preferences')
        .upsert({
          user_id: user!.id,
          micro_id: microId,
          preference,
        }, { onConflict: 'user_id,micro_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-services-with-prefs'] });
    },
  });

  const resetWizard = () => {
    setStep('browse');
    setSelectedCategoryId('');
    setSelectedCategoryName('');
    setSelectedSubcategoryId('');
    setSelectedSubcategoryName('');
    setPendingMicroIds([]);
    setPendingMicroSlugs([]);
    setPendingPreferences({});
  };

  const handleCategorySelect = (name: string, id: string) => {
    setSelectedCategoryId(id);
    setSelectedCategoryName(name);
    setSelectedSubcategoryId('');
    setSelectedSubcategoryName('');
    setPendingMicroIds([]);
    setPendingMicroSlugs([]);
    setPendingPreferences({});
    setStep('subcategory');
  };

  const handleSubcategorySelect = (name: string, id: string) => {
    setSelectedSubcategoryId(id);
    setSelectedSubcategoryName(name);
    setPendingMicroIds([]);
    setPendingMicroSlugs([]);
    setPendingPreferences({});
    setStep('micro');
  };

  const handleMicroToggle = (micro: MicroCategory, checked: boolean) => {
    if (checked) {
      setPendingMicroIds(prev => [...prev, micro.id]);
      setPendingMicroSlugs(prev => [...prev, micro.slug]);
      // Default to 'like' preference
      setPendingPreferences(prev => ({ ...prev, [micro.id]: 'like' }));
    } else {
      setPendingMicroIds(prev => prev.filter(id => id !== micro.id));
      setPendingMicroSlugs(prev => prev.filter(s => s !== micro.slug));
      setPendingPreferences(prev => {
        const next = { ...prev };
        delete next[micro.id];
        return next;
      });
    }
  };

  const handleRecommendedSelect = (microId: string, microSlug: string, _microName: string) => {
    if (!existingMicroIds.has(microId) && !pendingMicroIds.includes(microId)) {
      setPendingMicroIds(prev => [...prev, microId]);
      setPendingMicroSlugs(prev => [...prev, microSlug]);
      setPendingPreferences(prev => ({ ...prev, [microId]: 'like' }));
    }
  };

  const handleSelectAll = () => {
    const available = microCategories.filter(m => !existingMicroIds.has(m.id));
    setPendingMicroIds(available.map(m => m.id));
    setPendingMicroSlugs(available.map(m => m.slug));
    setPendingPreferences(Object.fromEntries(available.map(m => [m.id, 'like' as Preference])));
  };

  const handleClearAll = () => {
    setPendingMicroIds([]);
    setPendingMicroSlugs([]);
    setPendingPreferences({});
  };

  const handleBulkPreference = (preference: Preference) => {
    setPendingPreferences(prev => {
      const next = { ...prev };
      pendingMicroIds.forEach(id => {
        next[id] = preference;
      });
      return next;
    });
  };

  const handleContinueToPreferences = () => {
    if (pendingMicroIds.length === 0) {
      toast.error('Please select at least one job type');
      return;
    }
    setStep('preferences');
  };

  const handleAddServices = () => {
    addServicesMutation.mutate({
      microIds: pendingMicroIds,
      preferences: pendingPreferences,
    });
  };

  const handleComplete = async () => {
    if (servicesWithDetails.length === 0) {
      toast.error('Please unlock at least one job type before completing');
      return;
    }

    try {
      const { data: currentProfile } = await supabase
        .from('professional_profiles')
        .select('onboarding_phase')
        .eq('user_id', user?.id)
        .single();
      
      const newPhase = nextPhase(currentProfile?.onboarding_phase, 'service_setup');
      const { error } = await supabase
        .from('professional_profiles')
        .update({ onboarding_phase: newPhase })
        .eq('user_id', user?.id);

      if (error) throw error;

      await refresh();
      toast.success('Setup complete! You can now receive matched jobs.');
      navigate('/dashboard/pro');
    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error('Failed to complete setup');
    }
  };

  const handleBack = () => {
    if (step === 'preferences') setStep('micro');
    else if (step === 'micro') setStep('subcategory');
    else if (step === 'subcategory') setStep('category');
    else if (step === 'category') setStep('browse');
  };

  const servicesCount = servicesWithDetails.length;

  // Get translated preference config
  const getPreferenceConfig = (pref: Preference) => ({
    ...PREFERENCE_CONFIG[pref],
    label: t(`preferences.${pref}`),
  });

  return (
    <div className="min-h-screen bg-gradient-hero bg-texture-concrete">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-sm bg-gradient-steel shadow-md flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">
                {PLATFORM.mark}
              </span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              {PLATFORM.shortName}
            </span>
          </Link>
          <Button variant="ghost" onClick={() => navigate('/onboarding/professional')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('actions.backToOnboarding')}
          </Button>
        </div>
      </nav>

      <div className="container py-8">
        <div className="mx-auto max-w-3xl">
          {/* Header - Unlock-focused messaging */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <Unlock className="h-6 w-6 text-primary" />
              <h1 className="font-display text-3xl font-bold text-foreground">
                {t('title')}
              </h1>
            </div>
            <p className="text-muted-foreground mb-4">
              {t('subtitle')}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>{t('trustLine')}</span>
            </div>
          </div>

          {/* Unlock Progress */}
          <div className="mb-6">
            <UnlockProgress unlockedCount={servicesCount} minimumRequired={5} />
          </div>

          {/* Current Job Types */}
          <Card className="mb-6 card-grounded">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">{t('browse.yourTypes')}</CardTitle>
                  <CardDescription>
                    {servicesCount === 0 
                      ? t('browse.empty')
                      : t('browse.configured', { count: servicesCount })}
                  </CardDescription>
                </div>
                {step === 'browse' && (
                  <Button onClick={() => setStep('category')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('browse.unlockMore')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingServices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : servicesWithDetails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('browse.emptyHint')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {servicesWithDetails.map((service) => (
                    <div 
                      key={service.id}
                      className="flex items-center justify-between p-3 rounded-sm bg-muted/50 border border-border/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{service.micro_name}</p>
                          {service.preference && (
                            <span className={getPreferenceConfig(service.preference).color}>
                              {getPreferenceConfig(service.preference).icon}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {service.category_name} → {service.subcategory_name}
                        </p>
                      </div>
                      
                      {/* Quick preference selector */}
                      <div className="flex items-center gap-1 mr-2">
                        {(['love', 'like', 'neutral', 'avoid'] as Preference[]).map((pref) => (
                          <button
                            key={pref}
                            onClick={() => updatePreferenceMutation.mutate({ microId: service.micro_id, preference: pref })}
                            className={`p-1.5 rounded-sm transition-colors ${
                              service.preference === pref 
                                ? `${getPreferenceConfig(pref).color} bg-muted` 
                                : 'text-muted-foreground/50 hover:text-muted-foreground'
                            }`}
                            title={getPreferenceConfig(pref).label}
                          >
                            {getPreferenceConfig(pref).icon}
                          </button>
                        ))}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeServiceMutation.mutate(service.id)}
                        disabled={removeServiceMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unlock Job Types Wizard */}
          {step !== 'browse' && (
            <Card className="mb-6 card-grounded">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="font-display">
                      {step === 'category' && t('steps.browseByTrade')}
                      {step === 'subcategory' && selectedCategoryName}
                      {step === 'micro' && `${selectedSubcategoryName} — ${t('steps.unlockTypes')}`}
                      {step === 'preferences' && t('preferences.title')}
                    </CardTitle>
                    <CardDescription>
                      {step === 'category' && tCommon('nav.services')}
                      {step === 'subcategory' && t('steps.selectType')}
                      {step === 'micro' && t('subtitle')}
                      {step === 'preferences' && t('preferences.subtitle')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {step === 'category' && (
                  <CategorySelector
                    selectedCategory={selectedCategoryName}
                    onSelect={handleCategorySelect}
                  />
                )}

                {step === 'subcategory' && (
                  <SubcategorySelector
                    categoryId={selectedCategoryId}
                    selectedSubcategoryId={selectedSubcategoryId}
                    onSelect={handleSubcategorySelect}
                  />
                )}

                {step === 'micro' && (
                  <>
                    {/* Recommended job types */}
                    {recommendations.length > 0 && (
                      <RecommendedJobTypes
                        recommendations={recommendations}
                        tradeName={selectedSubcategoryName}
                        existingMicroIds={existingMicroIds}
                        onSelect={handleRecommendedSelect}
                      />
                    )}

                    {/* Bulk actions */}
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                      <Button variant="outline" size="sm" onClick={handleSelectAll}>
                        {t('actions.selectAll')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearAll}>
                        {t('actions.clear')}
                      </Button>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {pendingMicroIds.length} selected
                      </span>
                    </div>

                    {isLoadingMicros ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                        {microCategories.map((micro) => {
                          const isExisting = existingMicroIds.has(micro.id);
                          const isSelected = pendingMicroIds.includes(micro.id);
                          
                          return (
                            <JobTypeCard
                              key={micro.id}
                              micro={micro}
                              stats={jobStats[micro.slug]}
                              clientProvides={packMeta[micro.slug]}
                              isSelected={isSelected}
                              isExisting={isExisting}
                              onToggle={(checked) => handleMicroToggle(micro, checked)}
                            />
                          );
                        })}
                      </div>
                    )}

                    {pendingMicroIds.length > 0 && (
                      <div className="mt-6 flex justify-end">
                        <Button onClick={handleContinueToPreferences} className="gap-2">
                          {t('actions.continue')}
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {step === 'preferences' && (
                  <>
                    {/* Bulk preference actions */}
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border flex-wrap">
                      <span className="text-sm text-muted-foreground mr-2">{t('preferences.setAllTo')}</span>
                      {(['love', 'like', 'neutral', 'avoid'] as Preference[]).map((pref) => (
                        <Button
                          key={pref}
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkPreference(pref)}
                          className={`gap-1 ${getPreferenceConfig(pref).color}`}
                        >
                          {getPreferenceConfig(pref).icon}
                          {getPreferenceConfig(pref).label}
                        </Button>
                      ))}
                    </div>

                    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                      {pendingMicroIds.map((microId) => {
                        const micro = microCategories.find(m => m.id === microId);
                        if (!micro) return null;
                        
                        const currentPref = pendingPreferences[microId] || 'like';
                        
                        return (
                          <div
                            key={microId}
                            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                          >
                            <span className="font-medium">{micro.name}</span>
                            <div className="flex items-center gap-1">
                              {(['love', 'like', 'neutral', 'avoid'] as Preference[]).map((pref) => (
                                <button
                                  key={pref}
                                  onClick={() => setPendingPreferences(prev => ({ ...prev, [microId]: pref }))}
                                  className={`p-2 rounded-sm transition-colors ${
                                    currentPref === pref 
                                      ? `${getPreferenceConfig(pref).color} bg-muted` 
                                      : 'text-muted-foreground/50 hover:text-muted-foreground'
                                  }`}
                                  title={getPreferenceConfig(pref).label}
                                >
                                  {getPreferenceConfig(pref).icon}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button 
                        onClick={handleAddServices}
                        disabled={addServicesMutation.isPending}
                        className="gap-2"
                      >
                        {addServicesMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                        {t('actions.unlock', { count: pendingMicroIds.length })}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Complete Button */}
          {step === 'browse' && servicesCount > 0 && (
            <div className="flex justify-end">
              <Button size="lg" onClick={handleComplete} className="gap-2">
                <Check className="h-4 w-4" />
                {t('actions.complete')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalServiceSetup;
