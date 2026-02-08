/**
 * LogisticsSection - Visual grouping for logistics form sections
 */

import { cn } from '@/lib/utils';

interface LogisticsSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function LogisticsSection({ title, children, className }: LogisticsSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <h4 className="text-sm font-semibold text-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}
