/**
 * ServiceUnlockStep - Binary micro-service selection wizard
 * Builder-friendly: Larger tiles, clearer states, friendly copy.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Briefcase, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { nextPhase } from '@/pages/onboarding/lib/phaseProgression';
import { trackEvent } from '@/lib/trackEvent';
import { useTranslation } from 'react-i18next';

import { CategoryAccordion } from '../components/CategoryAccordion';
import { ServiceSearchBar } from '../components/ServiceSearchBar';
import { useServiceTaxonomy } from '../hooks/useServiceTaxonomy';
import { useProfessionalServices } from '../hooks/useProfessionalServices';
import { useMicroPreferences } from '../hooks/useMicroPreferences';
import { expandQuery } from '@/features/search/lib/searchSynonyms';
import type { Preference } from '../types/preferences';

interface ServiceUnlockStepProps {
  onComplete: () => void;
  onBack: () => void;
  editMode?: boolean;
}

const MIN_SERVICES = 1;
const RECOMMENDED_MIN = 5;
const RECOMMENDED_MAX = 15;

export function ServiceUnlockStep({ onComplete, onBack, editMode = false }: ServiceUnlockStepProps) {
  const { t } = useTranslation('onboarding');
  const { user, professionalProfile, refresh } = useSession();
  const currentPhase = professionalProfile?.onboardingPhase ?? 'not_started';
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [isFirstSelection, setIsFirstSelection] = useState(true);
  const [userExpandedDuringSearch, setUserExpandedDuringSearch] = useState(false);
  const savedTimerRef = useRef<number | null>(null);

  const { data: categories = [], isLoading: isLoadingTaxonomy } = useServiceTaxonomy();
  const { selectedMicroIds, isLoading: isLoadingServices, toggleService, bulkAddServices, bulkRemoveServices, isUpdating } = useProfessionalServices();
  const { preferences, updatePreference, isUpdating: isUpdatingPreference } = useMicroPreferences();

  const selectedCount = selectedMicroIds.size;
  const canContinue = selectedCount >= MIN_SERVICES;

  useEffect(() => { if (selectedCount > 0 && isFirstSelection) setIsFirstSelection(false); }, [selectedCount, isFirstSelection]);
  useEffect(() => { return () => { if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current); }; }, []);

  const firstMatchingCategoryId = useMemo(() => {
    if (!searchQuery) return null;
    const terms = expandQuery(searchQuery);
    const match = categories.find((c) => c.subcategories.some((s) => s.micros.some((m) => {
      const name = m.name.toLowerCase();
      const slug = m.slug.toLowerCase();
      return terms.some(term => name.includes(term) || slug.includes(term));
    })));
    return match?.id ?? null;
  }, [categories, searchQuery]);

  useEffect(() => {
    if (!searchQuery) { setExpandedCategoryId(null); setUserExpandedDuringSearch(false); return; }
    if (!userExpandedDuringSearch && firstMatchingCategoryId) setExpandedCategoryId(firstMatchingCategoryId);
  }, [searchQuery, firstMatchingCategoryId, userExpandedDuringSearch]);

  const progress = useMemo(() => selectedCount >= RECOMMENDED_MIN ? 100 : (selectedCount / RECOMMENDED_MIN) * 100, [selectedCount]);

  const flashSaved = useCallback(() => {
    setShowSaved(true);
    if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
    savedTimerRef.current = window.setTimeout(() => { setShowSaved(false); savedTimerRef.current = null; }, 1200);
  }, []);

  const handleMicroToggle = useCallback((microId: string) => {
    toggleService({ microId, isSelected: !selectedMicroIds.has(microId) });
    flashSaved();
  }, [selectedMicroIds, toggleService, flashSaved]);

  const handlePreferenceChange = useCallback((microId: string, preference: Preference) => {
    updatePreference(microId, preference);
    flashSaved();
  }, [updatePreference, flashSaved]);

  const handleSelectAllCategory = useCallback((categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    const allMicroIds = category.subcategories.flatMap(sub => sub.micros.map(m => m.id));
    const newMicroIds = allMicroIds.filter(id => !selectedMicroIds.has(id));
    if (newMicroIds.length > 0) { bulkAddServices(newMicroIds); flashSaved(); }
  }, [categories, selectedMicroIds, bulkAddServices, flashSaved]);

  const handleClearCategory = useCallback((categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    const allMicroIds = category.subcategories.flatMap(sub => sub.micros.map(m => m.id));
    const selectedInCategory = allMicroIds.filter(id => selectedMicroIds.has(id));
    if (selectedInCategory.length > 0) { bulkRemoveServices(selectedInCategory); flashSaved(); }
  }, [categories, selectedMicroIds, bulkRemoveServices, flashSaved]);

  const hasAnySearchResults = useMemo(() => {
    if (!searchQuery) return true;
    const terms = expandQuery(searchQuery);
    return categories.some((c) => c.subcategories.some((s) => s.micros.some((m) => {
      const name = m.name.toLowerCase();
      const slug = m.slug.toLowerCase();
      return terms.some(term => name.includes(term) || slug.includes(term));
    })));
  }, [categories, searchQuery]);

  const handleContinue = async () => {
    if (!canContinue || !user?.id) return;
    const newPhase = nextPhase(currentPhase, 'service_setup');
    if (newPhase !== currentPhase) {
      let phaseUpdated = false;
      try {
        const { error } = await supabase.from('professional_profiles').update({ onboarding_phase: newPhase }).eq('user_id', user.id);
        if (error) throw error;
        phaseUpdated = true;
      } catch (err) {
        console.error('Error advancing phase:', err);
        const msg = err instanceof Error ? err.message : String(err);
        trackEvent('onboarding_step_failed', 'professional', { step: 'service_unlock', error_message: msg });
      }
      if (phaseUpdated) { try { await refresh(); } catch (e) { console.warn('Session refresh failed after phase advance:', e); } }
    }
    onComplete();
  };

  const isLoading = isLoadingTaxonomy || isLoadingServices;

  return (
    <div className="space-y-6">
      <Card className="card-grounded">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-steel shadow-md">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">{t('serviceUnlock.title')}</CardTitle>
                <p className="text-base text-muted-foreground">{t('serviceUnlock.description')}</p>
              </div>
            </div>
            {showSaved && (
              <Badge variant="secondary" className="bg-primary/15 text-primary animate-fade-in text-sm">
                <Check className="h-4 w-4 mr-1" />
                {t('serviceUnlock.saved')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold tabular-nums">
                {selectedCount === 0 
                  ? t('serviceUnlock.noJobsSelected')
                  : t('serviceUnlock.jobsPicked', { count: selectedCount })}
              </span>
              {selectedCount >= RECOMMENDED_MIN && (
                <span className="text-primary font-medium">{t('serviceUnlock.greatSelection')}</span>
              )}
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        {t('serviceUnlock.whyThisMatters')}
      </div>

      <p className="text-center text-base text-muted-foreground px-4">
        {t('serviceUnlock.recommendedHint', { min: RECOMMENDED_MIN, max: RECOMMENDED_MAX })}
        <span className="block text-sm mt-1 opacity-80">{t('serviceUnlock.noNeedAll')}</span>
      </p>

      <ServiceSearchBar value={searchQuery} onChange={setSearchQuery} placeholder={t('serviceUnlock.searchPlaceholder')} />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="animate-fade-in">
              <CategoryAccordion
                category={category}
                selectedMicroIds={selectedMicroIds}
                isExpanded={expandedCategoryId === category.id}
                onToggle={() => {
                  const next = expandedCategoryId === category.id ? null : category.id;
                  setExpandedCategoryId(next);
                  if (searchQuery) setUserExpandedDuringSearch(true);
                }}
                onMicroToggle={handleMicroToggle}
                onSelectAll={() => handleSelectAllCategory(category.id)}
                onClearAll={() => handleClearCategory(category.id)}
                searchQuery={searchQuery}
                isFirstSelection={isFirstSelection}
                showPreferences={editMode}
                preferences={preferences}
                onPreferenceChange={handlePreferenceChange}
                isPreferenceUpdating={isUpdatingPreference}
              />
            </div>
          ))}

          {!hasAnySearchResults && (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-lg">{t('serviceUnlock.noResults', { query: searchQuery })}</p>
              <Button variant="link" onClick={() => setSearchQuery('')} className="mt-3 text-base">
                {t('serviceUnlock.clearSearch')}
              </Button>
            </div>
          )}
        </div>
      )}

      {selectedCount > 0 && selectedCount < RECOMMENDED_MIN && (
        <p className="text-center text-sm text-muted-foreground">{t('serviceUnlock.addMoreLater')}</p>
      )}

      <div className="flex gap-4 pt-4 border-t border-border sticky bottom-0 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack} className="flex-1 h-12 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 mr-2 shrink-0" />
          {t('serviceUnlock.goBack')}
        </Button>
        <div className="flex flex-col items-center gap-2 flex-1">
          <Button type="button" size="lg" onClick={handleContinue} disabled={!canContinue || isUpdating} className="w-full h-12 flex items-center justify-center">
            {isUpdating ? <Loader2 className="h-5 w-5 animate-spin mr-2 shrink-0" /> : <ArrowRight className="h-5 w-5 mr-2 shrink-0" />}
            {isUpdating ? t('serviceUnlock.saving') : t('serviceUnlock.continue')}
          </Button>
          {!canContinue && (
            <span className="text-sm text-muted-foreground">{t('serviceUnlock.selectMinimum')}</span>
          )}
        </div>
      </div>
    </div>
  );
}