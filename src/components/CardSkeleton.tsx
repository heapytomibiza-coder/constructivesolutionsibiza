/**
 * CARD SKELETON
 * 
 * Skeleton loading card matching the universal card layout.
 * Shows placeholder for: image area, title, metadata lines.
 */
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CardSkeletonProps {
  className?: string;
  /** Number of skeleton cards to render */
  count?: number;
}

function SingleCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border/70 bg-card overflow-hidden', className)}>
      {/* Image area */}
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category tag */}
        <Skeleton className="h-5 w-20 rounded-full" />
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        {/* Meta line 1 */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Meta line 2 */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton({ className, count = 1 }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SingleCardSkeleton key={i} className={className} />
      ))}
    </>
  );
}
