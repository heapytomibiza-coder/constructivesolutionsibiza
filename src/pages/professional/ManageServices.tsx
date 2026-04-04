/**
 * ManageServices — Standalone service selection management page
 * 
 * Dashboard-owned, NOT onboarding-owned.
 * Reuses the same taxonomy hooks and components as onboarding,
 * but without phase progression or "continue to review" flow.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Briefcase, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CategoryAccordion } from '@/pages/onboarding/components/CategoryAccordion';
import { ServiceSearchBar } from '@/pages/onboarding/components/ServiceSearchBar';
import { useServiceTaxonomy } from '@/pages/onboarding/hooks/useServiceTaxonomy';
import { useProfessionalServices } from '@/pages/onboarding/hooks/useProfessionalServices';
import { useMicroPreferences } from '@/pages/onboarding/hooks/useMicroPreferences';
import { expandQuery } from '@/features/search/lib/searchSynonyms';
import type { Preference } from '@/pages/onboarding/types/preferences';

const RECOMMENDED_MIN = 5;
const RECOMMENDED_MAX = 15;

export default function ManageServices() {
  const { t } = useTranslation('onboarding');
  const { t: tDash } = useTranslation('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [userExpandedDuringSearch, setUserExpandedDuringSearch] = useState(false);
  const savedTimerRef = useRef<number | null>(null);

  const { data: categories = [], isLoading: isLoadingTaxonomy } = useServiceTaxonomy();
  const { selectedMicroIds, isLoading: isLoadingServices, toggleService, bulkAddServices, bulkRemoveServices, isUpdating } = useProfessionalServices();
  const { preferences, updatePreference, isUpdating: isUpdatingPreference } = useMicroPreferences();

  const selectedCount = selectedMicroIds.size;

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

  const isLoading = isLoadingTaxonomy || isLoadingServices;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link to="/dashboard/pro"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="font-display text-lg font-semibold">
            {tDash('pro.manageServices', 'Choose Your Services')}
          </h1>
        </div>
      </nav>

      <div className="container py-5 sm:py-8 max-w-2xl">
        <Card className="card-grounded">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-steel shadow-md">
                  <Briefcase className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">{t('serviceUnlock.title')}</CardTitle>
                  <p className="text-base text-muted-foreground">
                    {tDash('pro.manageServicesHint', 'Select the types of work you do. We use these to match you with relevant client requests.')}
                  </p>
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

        <p className="text-center text-base text-muted-foreground px-4 mt-6 mb-4">
          {t('serviceUnlock.recommendedHint', { min: RECOMMENDED_MIN, max: RECOMMENDED_MAX })}
        </p>

        <ServiceSearchBar value={searchQuery} onChange={setSearchQuery} placeholder={t('serviceUnlock.searchPlaceholder')} />

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          </div>
        ) : (
          <div className="space-y-4 mt-4">
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
                  isFirstSelection={false}
                  showPreferences={true}
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

        {isUpdating && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('serviceUnlock.saving')}
          </div>
        )}
      </div>
    </div>
  );
}
