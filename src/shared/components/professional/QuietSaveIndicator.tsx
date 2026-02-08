/**
 * QuietSaveIndicator - Subtle "Saved" badge that flashes on autosave
 * Non-intrusive feedback pattern from onboarding flow
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

interface QuietSaveIndicatorProps {
  isSaving: boolean;
  lastSaved?: Date | null;
  className?: string;
}

export function QuietSaveIndicator({
  isSaving,
  lastSaved,
  className,
}: QuietSaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);

  // Flash "Saved" indicator when save completes
  useEffect(() => {
    if (lastSaved && !isSaving) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [lastSaved, isSaving]);

  if (isSaving) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-muted text-muted-foreground text-sm font-medium',
          'animate-pulse',
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (showSaved) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-primary/15 text-primary text-sm font-medium',
          'animate-fade-in',
          className
        )}
      >
        <Check className="h-4 w-4" />
        <span>Saved</span>
      </div>
    );
  }

  return null;
}
