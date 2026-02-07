/**
 * MicroToggleTile - Binary toggle tile for micro-service selection
 * Touch-friendly, animated, with checkmark on selection
 * 
 * "No descriptions by default. One clear action. Fast scanning."
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
  animationDelay = 0,
  isFirstSelection = false,
}: MicroToggleTileProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={cn(
        // Base styles - 48px min height for touch
        'relative flex items-center justify-between',
        'min-h-[48px] px-4 py-3 rounded-lg',
        'text-left text-sm font-medium',
        'border-2 transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        // Animation - stagger in
        'animate-slide-up opacity-0 [animation-fill-mode:forwards]',
        // Unselected state
        !isSelected && 'border-border bg-card hover:border-primary/50 hover:bg-accent/50',
        // Selected state with glow - stronger animation on first selection
        isSelected && [
          'border-primary bg-primary/5',
          isFirstSelection ? 'scale-[1.04] shadow-glow' : 'scale-[1.02]'
        ]
      )}
    >
      <span className="flex-1 truncate">{micro.name}</span>
      {isSelected && (
        <div className={cn(
          'flex h-5 w-5 items-center justify-center rounded-full bg-primary shrink-0 ml-2',
          'transition-transform duration-150',
          isFirstSelection && 'animate-scale-in'
        )}>
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

