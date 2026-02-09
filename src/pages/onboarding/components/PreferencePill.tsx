/**
 * PreferencePill - Dropdown pill for selecting Love/Like/Neutral preference
 * Used in Edit Mode to rank job preferences for matching
 */

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { type Preference, PREFERENCE_OPTIONS } from '../types/preferences';

// Re-export for convenience
export type { Preference };

interface PreferencePillProps {
  value: Preference;
  onChange: (preference: Preference) => void;
  disabled?: boolean;
  className?: string;
}

export function PreferencePill({ value, onChange, disabled, className }: PreferencePillProps) {
  const current = PREFERENCE_OPTIONS[value];

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
            'border border-border bg-background transition-all duration-150',
            'hover:border-primary/50 hover:shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
            current.className,
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <span>{current.icon}</span>
          <span className="hidden sm:inline">{current.label}</span>
          <span className="text-muted-foreground">▾</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-1.5" 
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-0.5">
          {(['love', 'like', 'neutral'] as Preference[]).map((opt) => {
            const option = PREFERENCE_OPTIONS[opt];
            const isSelected = opt === value;

            return (
              <button
                key={opt}
                type="button"
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                  'transition-colors hover:bg-muted/80',
                  isSelected && 'bg-muted'
                )}
                onClick={() => onChange(opt)}
              >
                <span className="text-lg">{option.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium flex items-center gap-2', option.className)}>
                    {option.label}
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
