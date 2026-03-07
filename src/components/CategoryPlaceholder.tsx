/**
 * CATEGORY PLACEHOLDER
 * 
 * Renders a gradient background with category icon.
 * Used when no hero image is available on service/job cards.
 * Creates the "layered category image" effect.
 */
import { getCategoryIcon, getCategoryIconByName } from '@/lib/categoryIcons';
import { getCategoryVisual, getCategoryVisualByName, categoryGradientStyle } from '@/lib/categoryVisuals';
import { cn } from '@/lib/utils';

interface CategoryPlaceholderProps {
  /** Category slug (preferred) */
  categorySlug?: string | null;
  /** Category display name (fallback) */
  categoryName?: string | null;
  /** Additional className for the container */
  className?: string;
  /** Icon size class */
  iconSize?: string;
}

export function CategoryPlaceholder({
  categorySlug,
  categoryName,
  className,
  iconSize = 'h-10 w-10',
}: CategoryPlaceholderProps) {
  const visual = categorySlug
    ? getCategoryVisual(categorySlug)
    : getCategoryVisualByName(categoryName);

  const Icon = categorySlug
    ? getCategoryIcon(categorySlug)
    : getCategoryIconByName(categoryName ?? '');

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={categoryGradientStyle(visual)}
    >
      <div className="flex flex-col items-center gap-2 opacity-80">
        <Icon
          className={iconSize}
          style={{ color: visual.iconColor }}
          strokeWidth={1.5}
        />
        {categoryName && (
          <span
            className="text-xs font-medium tracking-wide uppercase"
            style={{ color: visual.iconColor, opacity: 0.7 }}
          >
            {categoryName}
          </span>
        )}
      </div>
    </div>
  );
}
