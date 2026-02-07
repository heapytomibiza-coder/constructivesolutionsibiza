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
      <span className={cn(
        'ml-3 inline-flex h-6 w-6 items-center justify-center rounded-full transition shrink-0',
        isSelected 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground'
      )}>
        {isSelected ? <Check className="h-4 w-4" /> : <span className="text-xs">+</span>}
      </span>
      {/* Subtle ring on first selection */}
      {isSelected && isFirstSelection && (
        <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-primary/40" />
      )}
    </button>
  );
}

