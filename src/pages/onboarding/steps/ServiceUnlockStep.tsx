/**
 * ServiceUnlockStep - Binary micro-service selection wizard
 * 
 * "This is not a form. This is a catalogue."
 * Progressive disclosure with category accordions.
 * Each micro is a simple toggle: IN or OUT.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Unlock, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { CategoryAccordion } from '../components/CategoryAccordion';
import { ServiceSearchBar } from '../components/ServiceSearchBar';
import { useServiceTaxonomy } from '../hooks/useServiceTaxonomy';
import { useProfessionalServices } from '../hooks/useProfessionalServices';

interface ServiceUnlockStepProps {
  onComplete: () => void;
  onBack: () => void;
}

const MIN_SERVICES = 1;
const RECOMMENDED_MIN = 5;
const RECOMMENDED_MAX = 15;

export function ServiceUnlockStep({ onComplete, onBack }: ServiceUnlockStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [isFirstSelection, setIsFirstSelection] = useState(true);
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

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (selectedCount >= RECOMMENDED_MIN) return 100;
    return (selectedCount / RECOMMENDED_MIN) * 100;
  }, [selectedCount]);

  // Quiet "Saved" badge - no stacking, no leaks
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

  // Memoize search results check for performance
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
      {/* Header - Reframed language */}
      <Card className="card-grounded">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-steel shadow-md">
                <Unlock className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="font-display">Which jobs do you take on?</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pick the work you're happy to receive. We'll only send you matches for these.
                </p>
              </div>
            </div>
            {/* Quiet autosave indicator */}
            {showSaved && (
              <Badge 
                variant="secondary" 
                className="bg-success/10 text-success animate-fade-in text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Saved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress with count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium tabular-nums">
                {selectedCount} service{selectedCount !== 1 ? 's' : ''} selected
              </span>
              {selectedCount >= RECOMMENDED_MIN && (
                <span className="text-success text-xs">Great selection!</span>
              )}
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      {/* Permission to stop - strategic messaging */}
      <p className="text-center text-sm text-muted-foreground px-4">
        Most professionals select {RECOMMENDED_MIN}–{RECOMMENDED_MAX} services.
        <span className="block text-xs mt-0.5 opacity-75">You don't need to select everything.</span>
      </p>

      {/* Search bar */}
      <ServiceSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search jobs..."
      />

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* Category accordions */
        <div className="space-y-3">
          {categories.map((category, index) => (
            <div
              key={category.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-slide-up opacity-0 [animation-fill-mode:forwards]"
            >
              <CategoryAccordion
                category={category}
                selectedMicroIds={selectedMicroIds}
                isExpanded={expandedCategoryId === category.id}
                onToggle={() => setExpandedCategoryId(
                  expandedCategoryId === category.id ? null : category.id
                )}
                onMicroToggle={handleMicroToggle}
                onSelectAll={() => handleSelectAllCategory(category.id)}
                onClearAll={() => handleClearCategory(category.id)}
                searchQuery={searchQuery}
                isFirstSelection={isFirstSelection}
              />
            </div>
          ))}

          {/* Empty search results */}
          {!hasAnySearchResults && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No jobs found for "{searchQuery}"</p>
              <Button
                variant="link"
                onClick={() => setSearchQuery('')}
                className="mt-2"
              >
                Clear search
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Permission to stop - bottom reminder */}
      {selectedCount > 0 && selectedCount < RECOMMENDED_MIN && (
        <p className="text-center text-xs text-muted-foreground">
          You can always add more services later from your dashboard.
        </p>
      )}

      {/* Navigation buttons - sticky footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border sticky bottom-0 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col items-end gap-1">
          <Button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue || isUpdating}
            className={cn(
              'gap-2 transition-all',
              canContinue && 'hover:scale-105'
            )}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
          {!canContinue && (
            <span className="text-xs text-muted-foreground">
              Select at least 1 job to continue
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
