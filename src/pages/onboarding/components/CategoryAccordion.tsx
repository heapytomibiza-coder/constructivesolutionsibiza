/**
 * CategoryAccordion - Collapsible category card with micro-service tiles
 * Shows selection count badge and completion bar when collapsed
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MicroToggleTile } from './MicroToggleTile';

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
      'border border-border rounded-lg bg-card overflow-hidden transition-all duration-200',
      isExpanded && 'border-primary/50 shadow-md'
    )}>
      {/* Header with completion bar */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex flex-col gap-2 p-4',
          'hover:bg-muted/50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset'
        )}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{category.icon_emoji || '📦'}</span>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">{category.name}</h3>
              <p className="text-sm text-muted-foreground">
                {totalMicros} jobs available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Check className="h-3 w-3 mr-1" />
                {selectedCount}
              </Badge>
            )}
            <ChevronRight className={cn(
              'h-5 w-5 text-muted-foreground transition-transform duration-200',
              isExpanded && 'rotate-90'
            )} />
          </div>
        </div>
        {/* Completion bar - visual progress indicator */}
        {selectedCount > 0 && (
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden ml-9">
            <div 
              className="h-full bg-primary/60 transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Bulk actions */}
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelectAll();
              }}
              className="text-xs"
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
              className="text-xs text-muted-foreground"
            >
              Clear
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              Toggle the jobs you take on
            </span>
          </div>

          {/* Subcategories with micros */}
          <div className="p-4 space-y-6">
            {filteredSubcategories.map((subcategory, subIndex) => (
              <div key={subcategory.id}>
                {/* Subcategory header - soft section label */}
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  {subcategory.name}
                </h4>
                
                {/* Micro tiles grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {subcategory.micros.map((micro, microIndex) => (
                    <MicroToggleTile
                      key={micro.id}
                      micro={micro}
                      isSelected={selectedMicroIds.has(micro.id)}
                      onToggle={() => onMicroToggle(micro.id)}
                      animationDelay={(subIndex * 50) + (microIndex * 30)}
                      isFirstSelection={isFirstSelection}
                    />
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
