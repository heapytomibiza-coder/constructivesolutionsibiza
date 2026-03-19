/**
 * IslandWideTile - Featured "cover entire island" toggle tile
 * Distinctive styling to stand out from regular zone tiles
 */

import { cn } from '@/lib/utils';
import { Check, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface IslandWideTileProps {
  selected: boolean;
  onClick: () => void;
  className?: string;
}

export function IslandWideTile({
  selected,
  onClick,
  className,
}: IslandWideTileProps) {
  const { t } = useTranslation('onboarding');

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between',
        'min-h-[64px] px-5 py-4 rounded-xl',
        'text-left',
        'border-2 transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        !selected &&
          'border-accent/50 bg-accent/10 hover:border-accent hover:bg-accent/15',
        selected && 'border-accent bg-accent/20 shadow-lg',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Globe
          className={cn(
            'h-6 w-6 transition-colors',
            selected ? 'text-accent' : 'text-accent/70'
          )}
        />
        <div>
          <span className="block text-base font-medium">{t('serviceArea.islandWideTileTitle')}</span>
          <p className="text-sm text-muted-foreground">
            {t('serviceArea.islandWideTileDesc')}
          </p>
        </div>
      </div>
      <span
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-full transition shrink-0',
          selected
            ? 'bg-accent text-accent-foreground'
            : 'bg-accent/20 text-accent/70'
        )}
      >
        {selected ? (
          <Check className="h-5 w-5" />
        ) : (
          <span className="text-base">+</span>
        )}
      </span>
    </button>
  );
}
