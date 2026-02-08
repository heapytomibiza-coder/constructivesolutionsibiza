/**
 * GradientIconHeader - Reusable gradient icon container with title/description
 * Matches the onboarding visual language for consistent "inspiring" UI
 */

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface GradientIconHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GradientIconHeader({
  icon: Icon,
  title,
  description,
  className,
  size = 'md',
}: GradientIconHeaderProps) {
  const sizeClasses = {
    sm: {
      container: 'h-10 w-10 rounded-lg',
      icon: 'h-5 w-5',
      title: 'text-base font-semibold',
      description: 'text-sm',
    },
    md: {
      container: 'h-14 w-14 rounded-xl',
      icon: 'h-7 w-7',
      title: 'text-xl font-semibold',
      description: 'text-base',
    },
    lg: {
      container: 'h-16 w-16 rounded-xl',
      icon: 'h-8 w-8',
      title: 'text-2xl font-semibold',
      description: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-steel shadow-md shrink-0',
          sizes.container
        )}
      >
        <Icon className={cn('text-white', sizes.icon)} />
      </div>
      <div>
        <h3 className={cn('text-foreground', sizes.title)}>{title}</h3>
        {description && (
          <p className={cn('text-muted-foreground', sizes.description)}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
