/**
 * MicroToggleTile - Binary toggle tile for micro-service selection
 * Builder-friendly: Larger, higher contrast, clearer states
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { txMicro } from '@/i18n/taxonomyTranslations';

export interface MicroToggleTileProps {
  micro: {
    id: string;
    name: string;
    slug: string;
  };
  isSelected: boolean;
  onToggle: () => void;
  animationDelay?: number;
  isFirstSelection?: boolean;
  /**
   * Optional element rendered on the right side (before the check/+)
   * Used in edit mode to show preference pill without changing tile behaviour.
   */
  rightAccessory?: React.ReactNode;
}

export function MicroToggleTile({ 
  micro, 
  isSelected, 
  onToggle, 
  isFirstSelection = false,
  rightAccessory,
}: MicroToggleTileProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        // Base styles - 56px min height for comfortable tapping
        'relative flex items-center justify-between',
        'min-h-[56px] px-4 py-3.5 rounded-xl',
        'text-left text-base font-medium',
        'border-2 transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        // Unselected state
        !isSelected && 'border-border bg-card hover:border-primary/50 hover:bg-primary/5',
        // Selected state - high contrast, obvious
        isSelected && 'border-primary bg-primary/15 shadow-md'
      )}
    >
      <span className="flex-1 truncate pr-3">{micro.name}</span>
      
      {/* Slot for edit-mode preference pill etc */}
      {rightAccessory ? (
        <span
          className="mr-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {rightAccessory}
        </span>
      ) : null}
      
      <span className={cn(
        'ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full transition shrink-0',
        isSelected 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground'
      )}>
        {isSelected ? <Check className="h-5 w-5" /> : <span className="text-base font-medium">+</span>}
      </span>
    </button>
  );
}
