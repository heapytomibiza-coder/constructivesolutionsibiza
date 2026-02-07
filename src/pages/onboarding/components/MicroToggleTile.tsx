/**
 * MicroToggleTile - Binary toggle tile for micro-service selection
 * Builder-friendly: Larger, higher contrast, clearer states
 */

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface MicroToggleTileProps {
  micro: {
    id: string;
    name: string;
    slug: string;
  };
  isSelected: boolean;
  onToggle: () => void;
  animationDelay?: number;
  isFirstSelection?: boolean;
}

export function MicroToggleTile({ 
  micro, 
  isSelected, 
  onToggle, 
  isFirstSelection = false,
}: MicroToggleTileProps) {
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
