/**
 * GradientIconHeader - Reusable gradient icon container with title/description
 * Matches the onboarding visual language for consistent "inspiring" UI
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GradientIconHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function GradientIconHeader({
  icon,
  title,
  description,
  className,
}: GradientIconHeaderProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-steel shadow-md shrink-0">
        <span className="text-white">{icon}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
