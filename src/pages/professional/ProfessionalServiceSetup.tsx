import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CategorySelector from '@/components/wizard/db-powered/CategorySelector';
import SubcategorySelector from '@/components/wizard/db-powered/SubcategorySelector';
import { 
  ArrowLeft, Check, Plus, X, Loader2, Shield, Heart, 
  ThumbsUp, Minus, Ban, CheckCircle2, Zap 
} from 'lucide-react';
import { PLATFORM } from '@/domain/scope';

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
  love: { icon: <Heart className="h-4 w-4" />, label: 'Love it', color: 'text-red-500' },
  like: { icon: <ThumbsUp className="h-4 w-4" />, label: 'Like', color: 'text-green-500' },
  neutral: { icon: <Minus className="h-4 w-4" />, label: 'Neutral', color: 'text-muted-foreground' },
  avoid: { icon: <Ban className="h-4 w-4" />, label: 'Avoid', color: 'text-orange-500' },
};

/**
 * PROFESSIONAL SERVICE SETUP V2
 * 
 * Multi-click capability builder with preferences.
 * Steps 1-4 for professionals to declare what they do and how much they like it.
 */
const ProfessionalServiceSetup = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, refresh } = useSession();

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
      toast.success(`Added ${pendingMicroIds.length} service(s)`);
      resetWizard();
    },
    onError: (error) => {
      console.error('Error adding services:', error);
      toast.error('Failed to add services');
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
      toast.success('Service removed');
    },
    onError: () => {
      toast.error('Failed to remove service');
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
      toast.error('Please select at least one service');
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
      toast.error('Please add at least one service before completing');
      return;
    }

    try {
      const { error } = await supabase
        .from('professional_profiles')
        .update({ onboarding_phase: 'complete' })
        .eq('user_id', user?.id);

      if (error) throw error;

      await refresh();
      toast.success('Service setup complete!');
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
            Back to Onboarding
          </Button>
        </div>
      </nav>

      <div className="container py-8">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Set Up Your Services
            </h1>
            <p className="text-muted-foreground mb-4">
              Select services you offer and tell us how much you enjoy them.
              This helps us match you with the jobs you love.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Better matching = more quality leads you actually want</span>
            </div>
          </div>

          {/* Current Services */}
          <Card className="mb-6 card-grounded">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">Your Services</CardTitle>
                  <CardDescription>
                    {servicesCount === 0 
                      ? 'No services added yet' 
                      : `${servicesCount} service${servicesCount !== 1 ? 's' : ''} configured`}
                  </CardDescription>
                </div>
                {step === 'browse' && (
                  <Button onClick={() => setStep('category')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Services
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
                  <p>Add your first service to get started.</p>
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
                            <span className={PREFERENCE_CONFIG[service.preference].color}>
                              {PREFERENCE_CONFIG[service.preference].icon}
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
                                ? `${PREFERENCE_CONFIG[pref].color} bg-muted` 
                                : 'text-muted-foreground/50 hover:text-muted-foreground'
                            }`}
                            title={PREFERENCE_CONFIG[pref].label}
                          >
                            {PREFERENCE_CONFIG[pref].icon}
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

          {/* Add Services Wizard */}
          {step !== 'browse' && (
            <Card className="mb-6 card-grounded">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="font-display">
                      {step === 'category' && 'Select Category'}
                      {step === 'subcategory' && selectedCategoryName}
                      {step === 'micro' && `${selectedSubcategoryName} — Select Tasks`}
                      {step === 'preferences' && 'Set Your Preferences'}
                    </CardTitle>
                    <CardDescription>
                      {step === 'category' && 'Choose a category to browse services'}
                      {step === 'subcategory' && 'Select a service type'}
                      {step === 'micro' && 'Check all services you offer'}
                      {step === 'preferences' && 'Tell us which jobs you love vs prefer to avoid'}
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
                    {/* Bulk actions */}
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                      <Button variant="outline" size="sm" onClick={handleSelectAll}>
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearAll}>
                        Clear
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
                            <label
                              key={micro.id}
                              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                                isExisting
                                  ? 'border-primary/30 bg-primary/5 cursor-not-allowed'
                                  : isSelected
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-card hover:border-primary/50'
                              }`}
                            >
                              <Checkbox
                                checked={isSelected || isExisting}
                                disabled={isExisting}
                                onCheckedChange={(checked) => handleMicroToggle(micro, !!checked)}
                              />
                              <span className={isExisting ? 'text-muted-foreground' : 'text-foreground'}>
                                {micro.name}
                              </span>
                              {isExisting && (
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Added
                                </Badge>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {pendingMicroIds.length > 0 && (
                      <div className="mt-6 flex justify-end">
                        <Button onClick={handleContinueToPreferences} className="gap-2">
                          Continue to Preferences
                          <Zap className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {step === 'preferences' && (
                  <>
                    {/* Bulk preference actions */}
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border flex-wrap">
                      <span className="text-sm text-muted-foreground mr-2">Set all to:</span>
                      {(['love', 'like', 'neutral', 'avoid'] as Preference[]).map((pref) => (
                        <Button
                          key={pref}
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkPreference(pref)}
                          className={`gap-1 ${PREFERENCE_CONFIG[pref].color}`}
                        >
                          {PREFERENCE_CONFIG[pref].icon}
                          {PREFERENCE_CONFIG[pref].label}
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
                                      ? `${PREFERENCE_CONFIG[pref].color} bg-muted` 
                                      : 'text-muted-foreground/50 hover:text-muted-foreground'
                                  }`}
                                  title={PREFERENCE_CONFIG[pref].label}
                                >
                                  {PREFERENCE_CONFIG[pref].icon}
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
                          <Check className="h-4 w-4" />
                        )}
                        Add {pendingMicroIds.length} Service{pendingMicroIds.length !== 1 ? 's' : ''}
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
                Complete Setup
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalServiceSetup;
