/**
 * ZoneTile - Touch-friendly zone selection tile
 * Builder-friendly: Larger, clearer, higher contrast
 * 56px min touch target for accessibility
 */

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ZoneTileProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

export function ZoneTile({
  label,
  selected,
  onClick,
  className,
}: ZoneTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between rounded-xl border px-4 py-4 text-left transition',
        selected ? 'border-primary bg-primary/5' : 'hover:bg-muted',
        className
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={cn(
          'h-7 w-7 rounded-lg flex items-center justify-center border',
          selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'bg-background text-muted-foreground'
        )}
      >
        {selected ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="text-lg leading-none">+</span>
        )}
      </span>
    </button>
  );
}
