/**
 * ServiceUnlockStep - Binary micro-service selection wizard
 * 
 * Builder-friendly: Larger tiles, clearer states, friendly copy.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Briefcase, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { CategoryAccordion } from '../components/CategoryAccordion';
import { ServiceSearchBar } from '../components/ServiceSearchBar';
import { useServiceTaxonomy } from '../hooks/useServiceTaxonomy';
import { useProfessionalServices } from '../hooks/useProfessionalServices';
import { useMicroPreferences } from '../hooks/useMicroPreferences';
import type { Preference } from '../components/PreferencePill';

interface ServiceUnlockStepProps {
  onComplete: () => void;
  onBack: () => void;
  editMode?: boolean;
}

const MIN_SERVICES = 1;
const RECOMMENDED_MIN = 5;
const RECOMMENDED_MAX = 15;

export function ServiceUnlockStep({ onComplete, onBack, editMode = false }: ServiceUnlockStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [isFirstSelection, setIsFirstSelection] = useState(true);
  const [userExpandedDuringSearch, setUserExpandedDuringSearch] = useState(false);
  const savedTimerRef = useRef<number | null>(null);

  // Data hooks
  const { data: categories = [], isLoading: isLoadingTaxonomy } = useServiceTaxonomy();
  const { 
    selectedMicroIds, 
    isLoading: isLoadingServices,
    toggleService,
    bulkAddServices,
    bulkRemoveServices,
    isUpdating 
  } = useProfessionalServices();

  // Preferences hook - only used in edit mode
  const {
    preferences,
    updatePreference,
    isUpdating: isUpdatingPreference,
  } = useMicroPreferences();

  const selectedCount = selectedMicroIds.size;
  const canContinue = selectedCount >= MIN_SERVICES;

  // Track first selection for enhanced animation
  useEffect(() => {
    if (selectedCount > 0 && isFirstSelection) {
      setIsFirstSelection(false);
    }
  }, [selectedCount, isFirstSelection]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
    };
  }, []);

  // Find first category with search matches for auto-expand
  const firstMatchingCategoryId = useMemo(() => {
    if (!searchQuery) return null;
    const q = searchQuery.toLowerCase();
    
    const match = categories.find((c) =>
      c.subcategories.some((s) =>
        s.micros.some((m) => 
          m.name.toLowerCase().includes(q) || 
          m.slug.toLowerCase().includes(q)
        )
      )
    );
    
    return match?.id ?? null;
  }, [categories, searchQuery]);

  // Auto-expand first matching category when searching (respects manual override)
  useEffect(() => {
    if (!searchQuery) {
      setExpandedCategoryId(null);
      setUserExpandedDuringSearch(false);
      return;
    }

    if (!userExpandedDuringSearch && firstMatchingCategoryId) {
      setExpandedCategoryId(firstMatchingCategoryId);
    }
  }, [searchQuery, firstMatchingCategoryId, userExpandedDuringSearch]);

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (selectedCount >= RECOMMENDED_MIN) return 100;
    return (selectedCount / RECOMMENDED_MIN) * 100;
  }, [selectedCount]);

  // Quiet "Saved" badge
  const flashSaved = useCallback(() => {
    setShowSaved(true);

    if (savedTimerRef.current) {
      window.clearTimeout(savedTimerRef.current);
    }

    savedTimerRef.current = window.setTimeout(() => {
      setShowSaved(false);
      savedTimerRef.current = null;
    }, 1200);
  }, []);

  // Handle micro toggle with quiet autosave feedback
  const handleMicroToggle = useCallback((microId: string) => {
    const isCurrentlySelected = selectedMicroIds.has(microId);
    toggleService({ microId, isSelected: !isCurrentlySelected });
    flashSaved();
  }, [selectedMicroIds, toggleService, flashSaved]);

  // Handle preference change (edit mode only)
  const handlePreferenceChange = useCallback((microId: string, preference: Preference) => {
    updatePreference(microId, preference);
    flashSaved();
  }, [updatePreference, flashSaved]);

  // Handle select all for a category
  const handleSelectAllCategory = useCallback((categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const allMicroIds = category.subcategories.flatMap(sub => 
      sub.micros.map(m => m.id)
    );
    const newMicroIds = allMicroIds.filter(id => !selectedMicroIds.has(id));
    
    if (newMicroIds.length > 0) {
      bulkAddServices(newMicroIds);
      flashSaved();
    }
  }, [categories, selectedMicroIds, bulkAddServices, flashSaved]);

  // Handle clear all for a category
  const handleClearCategory = useCallback((categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const allMicroIds = category.subcategories.flatMap(sub => 
      sub.micros.map(m => m.id)
    );
    const selectedInCategory = allMicroIds.filter(id => selectedMicroIds.has(id));
    
    if (selectedInCategory.length > 0) {
      bulkRemoveServices(selectedInCategory);
      flashSaved();
    }
  }, [categories, selectedMicroIds, bulkRemoveServices, flashSaved]);

  // Memoize search results check
  const hasAnySearchResults = useMemo(() => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return categories.some((c) =>
      c.subcategories.some((s) =>
        s.micros.some((m) => 
          m.name.toLowerCase().includes(q) || 
          m.slug.toLowerCase().includes(q)
        )
      )
    );
  }, [categories, searchQuery]);

  // Handle continue
  const handleContinue = () => {
    if (!canContinue) return;
    onComplete();
  };

  const isLoading = isLoadingTaxonomy || isLoadingServices;

  return (
    <div className="space-y-6">
      {/* Header - Friendly language */}
      <Card className="card-grounded">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-steel shadow-md">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Which jobs do you want?</CardTitle>
                <p className="text-base text-muted-foreground">
                  Tap any job you're happy to do. We'll only send you these.
                </p>
              </div>
            </div>
            {/* Quiet autosave indicator */}
            {showSaved && (
              <Badge 
                variant="secondary" 
                className="bg-primary/15 text-primary animate-fade-in text-sm"
              >
                <Check className="h-4 w-4 mr-1" />
                Saved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress with count */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold tabular-nums">
                {selectedCount === 0 
                  ? "No jobs selected yet" 
                  : `You've picked ${selectedCount} job${selectedCount !== 1 ? 's' : ''}`}
              </span>
              {selectedCount >= RECOMMENDED_MIN && (
                <span className="text-primary font-medium">Great selection!</span>
              )}
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Permission to stop */}
      <p className="text-center text-base text-muted-foreground px-4">
        Most professionals pick {RECOMMENDED_MIN}–{RECOMMENDED_MAX} jobs.
        <span className="block text-sm mt-1 opacity-80">You don't need to select everything.</span>
      </p>

      {/* Search bar */}
      <ServiceSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search jobs..."
      />

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
        </div>
      ) : (
        /* Category accordions */
        <div className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="animate-fade-in"
            >
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
              />
            </div>
          ))}

          {/* Empty search results */}
          {!hasAnySearchResults && (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-lg">No jobs found for "{searchQuery}"</p>
              <Button
                variant="link"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-base"
              >
                Clear search
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Permission to stop - bottom reminder */}
      {selectedCount > 0 && selectedCount < RECOMMENDED_MIN && (
        <p className="text-center text-sm text-muted-foreground">
          You can always add more jobs later from your dashboard.
        </p>
      )}

      {/* Navigation buttons - sticky footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border sticky bottom-0 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Go Back
        </Button>

        <div className="flex flex-col items-end gap-2">
          <Button
            type="button"
            size="lg"
            onClick={handleContinue}
            disabled={!canContinue || isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
          {!canContinue && (
            <span className="text-sm text-muted-foreground">
              Select at least 1 job to continue
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
