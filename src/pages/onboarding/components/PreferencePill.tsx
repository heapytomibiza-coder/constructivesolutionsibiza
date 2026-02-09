/**
 * PreferencePill - Dropdown pill for selecting Love/Like/Neutral preference
 * Used in Edit Mode to rank job preferences for matching
 */

import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type Preference = 'love' | 'like' | 'neutral';

interface PreferenceOption {
  icon: string;
  label: string;
  description: string;
  colorClass: string;
  bgClass: string;
}

const PREFERENCE_OPTIONS: Record<Preference, PreferenceOption> = {
  love: {
    icon: '❤️',
    label: 'Love',
    description: 'Push these to me first',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
  },
  like: {
    icon: '👍',
    label: 'Like',
    description: 'Happy to receive',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
  },
  neutral: {
    icon: '◻',
    label: 'Neutral',
    description: "I'll do it if available",
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
  },
};

interface PreferencePillProps {
  value: Preference;
  onChange: (preference: Preference) => void;
  disabled?: boolean;
}

export function PreferencePill({ value, onChange, disabled }: PreferencePillProps) {
  const current = PREFERENCE_OPTIONS[value];

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
            'border border-border transition-all duration-150',
            'hover:border-primary/50 hover:shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
            current.bgClass,
            current.colorClass,
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <span>{current.icon}</span>
          <span className="hidden sm:inline">{current.label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-1.5" 
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-0.5">
          {(Object.entries(PREFERENCE_OPTIONS) as [Preference, PreferenceOption][]).map(
            ([key, option]) => (
              <button
                key={key}
                type="button"
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                  'transition-colors hover:bg-muted/80',
                  value === key && 'bg-muted'
                )}
                onClick={() => onChange(key)}
              >
                <span className="text-lg">{option.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', option.colorClass)}>
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {option.description}
                  </p>
                </div>
                {value === key && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
