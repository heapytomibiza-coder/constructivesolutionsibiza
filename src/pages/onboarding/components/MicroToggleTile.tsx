/**
 * MicroToggleTile - Binary toggle tile for micro-service selection
 * Touch-friendly, animated, with checkmark on selection
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
}

export function MicroToggleTile({ 
  micro, 
  isSelected, 
  onToggle, 
  animationDelay = 0 
}: MicroToggleTileProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={cn(
        // Base styles
        'relative flex items-center justify-between',
        'min-h-[48px] px-4 py-3 rounded-lg',
        'text-left text-sm font-medium',
        'border-2 transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        // Animation
        'animate-slide-up opacity-0 [animation-fill-mode:forwards]',
        // Unselected state
        !isSelected && 'border-border bg-card hover:border-primary/50 hover:bg-accent/50',
        // Selected state with glow
        isSelected && 'border-primary bg-primary/5 shadow-glow scale-[1.02]'
      )}
    >
      <span className="flex-1 truncate">{micro.name}</span>
      {isSelected && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary shrink-0 ml-2">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}
