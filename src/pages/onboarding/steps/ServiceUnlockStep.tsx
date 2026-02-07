/**
 * ServiceUnlockStep - Binary micro-service selection wizard
 * 
 * Progressive disclosure with category accordions.
 * Each micro is a simple toggle: IN or OUT.
 */

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Unlock, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const [showSavedToast, setShowSavedToast] = useState(false);

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

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (selectedCount >= RECOMMENDED_MIN) return 100;
    return (selectedCount / RECOMMENDED_MIN) * 100;
  }, [selectedCount]);

  // Handle micro toggle with autosave feedback
  const handleMicroToggle = useCallback((microId: string) => {
    const isCurrentlySelected = selectedMicroIds.has(microId);
    toggleService({ microId, isSelected: !isCurrentlySelected });
    
    // Show brief "Saved" feedback
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 1500);
  }, [selectedMicroIds, toggleService]);

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
    }
  }, [categories, selectedMicroIds, bulkAddServices]);

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
    }
  }, [categories, selectedMicroIds, bulkRemoveServices]);

  // Handle continue
  const handleContinue = () => {
    if (!canContinue) {
      toast.error('Select at least 1 service to continue');
      return;
    }
    onComplete();
  };

  const isLoading = isLoadingTaxonomy || isLoadingServices;

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <Card className="card-grounded">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-steel shadow-md">
              <Unlock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="font-display">What work do you want?</CardTitle>
              <p className="text-sm text-muted-foreground">
                Pick the jobs you're happy to take. We'll only send you matches for these.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {selectedCount} service{selectedCount !== 1 ? 's' : ''} selected
              </span>
              {showSavedToast && (
                <Badge variant="secondary" className="bg-success/10 text-success animate-fade-in">
                  <Check className="h-3 w-3 mr-1" />
                  Saved
                </Badge>
              )}
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {selectedCount < RECOMMENDED_MIN 
                ? `Most professionals select ${RECOMMENDED_MIN}-${RECOMMENDED_MAX}`
                : 'Great selection!'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search bar */}
      <ServiceSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search services..."
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
              />
            </div>
          ))}

          {/* Empty search results */}
          {searchQuery && categories.every(c => 
            c.subcategories.every(s => 
              !s.micros.some(m => 
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.slug.toLowerCase().includes(searchQuery.toLowerCase())
              )
            )
          ) && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No services found for "{searchQuery}"</p>
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

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border sticky bottom-0 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

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
      </div>

      {/* Helper text for disabled state */}
      {!canContinue && (
        <p className="text-center text-sm text-muted-foreground">
          Select at least 1 service to continue
        </p>
      )}
    </div>
  );
}
