/**
 * CategoryAccordion - Collapsible category card with micro-service tiles
 * Builder-friendly: Larger headers, clearer states, simpler layout
 * Supports Edit Mode with preference selection via showPreferences prop
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MicroToggleTile } from './MicroToggleTile';
import { MicroToggleTileWithPreference } from './MicroToggleTileWithPreference';
import type { Preference } from '../types/preferences';

interface Micro {
  id: string;
  name: string;
  slug: string;
}

interface Subcategory {
  id: string;
  name: string;
  micros: Micro[];
}

interface Category {
  id: string;
  name: string;
  icon_emoji: string | null;
  subcategories: Subcategory[];
}

interface CategoryAccordionProps {
  category: Category;
  selectedMicroIds: Set<string>;
  isExpanded: boolean;
  onToggle: () => void;
  onMicroToggle: (microId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  searchQuery?: string;
  isFirstSelection?: boolean;
  // Edit mode preference props
  showPreferences?: boolean;
  preferences?: Map<string, Preference>;
  onPreferenceChange?: (microId: string, preference: Preference) => void;
}

export function CategoryAccordion({
  category,
  selectedMicroIds,
  isExpanded,
  onToggle,
  onMicroToggle,
  onSelectAll,
  onClearAll,
  searchQuery = '',
  isFirstSelection = false,
  showPreferences = false,
  preferences,
  onPreferenceChange,
}: CategoryAccordionProps) {
  // Filter micros by search query
  const filteredSubcategories = useMemo(() => {
    if (!searchQuery) return category.subcategories;
    
    const lowerQuery = searchQuery.toLowerCase();
    return category.subcategories
      .map(sub => ({
        ...sub,
        micros: sub.micros.filter(m => 
          m.name.toLowerCase().includes(lowerQuery) ||
          m.slug.toLowerCase().includes(lowerQuery)
        )
      }))
      .filter(sub => sub.micros.length > 0);
  }, [category.subcategories, searchQuery]);

  // Count totals
  const totalMicros = category.subcategories.reduce((acc, sub) => acc + sub.micros.length, 0);
  const allMicroIds = category.subcategories.flatMap(sub => sub.micros.map(m => m.id));
  const selectedCount = allMicroIds.filter(id => selectedMicroIds.has(id)).length;
  const hasFiltered = filteredSubcategories.length > 0;
  const completionPercent = totalMicros > 0 ? (selectedCount / totalMicros) * 100 : 0;

  // Don't render if search has no results
  if (searchQuery && !hasFiltered) {
    return null;
  }

  return (
    <div className={cn(
      'border-2 border-border rounded-xl bg-card overflow-hidden transition-all duration-200',
      isExpanded && 'border-primary/50 shadow-lg'
    )}>
      {/* Header - Larger, clearer */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex flex-col gap-2 p-5',
          'hover:bg-muted/40 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset'
        )}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{category.icon_emoji || '📦'}</span>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
              <p className="text-base text-muted-foreground">
                {totalMicros} jobs available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {selectedCount > 0 && (
              <Badge variant="secondary" className="bg-primary/15 text-primary text-sm px-3 py-1">
                <Check className="h-4 w-4 mr-1" />
                {selectedCount}
              </Badge>
            )}
            <ChevronRight className={cn(
              'h-6 w-6 text-muted-foreground transition-transform duration-200',
              isExpanded && 'rotate-90'
            )} />
          </div>
        </div>
        {/* Completion bar */}
        {selectedCount > 0 && (
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden ml-12">
            <div 
              className="h-full bg-primary/60 transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t-2 border-border">
          {/* Bulk actions */}
          <div className="flex items-center gap-3 px-5 py-4 bg-muted/30 border-b border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelectAll();
              }}
              className="text-sm"
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
              className="text-sm text-muted-foreground"
            >
              Clear
            </Button>
            <span className="ml-auto text-sm text-muted-foreground">
              Tap any job you're happy to do
            </span>
          </div>

          {/* Subcategories with micros */}
          <div className="p-5 space-y-7">
            {filteredSubcategories.map((subcategory) => (
              <div key={subcategory.id}>
                {/* Subcategory header */}
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  {subcategory.name}
                </h4>
                
                {/* Micro tiles grid - single column on mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subcategory.micros.map((micro) => (
                    showPreferences ? (
                      <MicroToggleTileWithPreference
                        key={micro.id}
                        micro={micro}
                        isSelected={selectedMicroIds.has(micro.id)}
                        onToggle={() => onMicroToggle(micro.id)}
                        showPreference={showPreferences}
                        preference={preferences?.get(micro.id) ?? 'neutral'}
                        onPreferenceChange={(pref) => onPreferenceChange?.(micro.id, pref)}
                      />
                    ) : (
                      <MicroToggleTile
                        key={micro.id}
                        micro={micro}
                        isSelected={selectedMicroIds.has(micro.id)}
                        onToggle={() => onMicroToggle(micro.id)}
                        isFirstSelection={isFirstSelection}
                      />
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
