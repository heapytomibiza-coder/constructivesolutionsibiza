/**
 * TileOption - Touch-friendly selectable tile card
 * Matches the tile-based UX from the Questions step
 */

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface TileOptionProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TileOption({ 
  selected, 
  onClick, 
  children, 
  className,
  disabled = false 
}: TileOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Base styles
        'relative flex items-center justify-between',
        'min-h-[48px] px-4 py-3 rounded-lg',
        'text-left text-sm font-medium',
        'border-2 transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        // Unselected state
        !selected && 'border-border bg-card hover:border-primary/50 hover:bg-accent/50',
        // Selected state
        selected && 'border-primary bg-primary/5',
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span className="flex-1">{children}</span>
      {selected && (
        <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
      )}
    </button>
  );
}
