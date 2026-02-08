/**
 * ZoneTile - Touch-friendly zone selection tile
 * Builder-friendly: Larger, clearer, higher contrast
 * 56px min touch target for accessibility
 */

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ZoneTileProps {
  id: string;
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
        // Base styles - 56px min touch target
        'relative flex items-center justify-between',
        'min-h-[56px] px-4 py-3.5 rounded-xl',
        'text-left text-base font-medium',
        'border-2 transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        // Unselected state
        !selected && 'border-border bg-card hover:border-primary/50 hover:bg-primary/5',
        // Selected state - high contrast
        selected && 'border-primary bg-primary/15 shadow-md',
        className
      )}
    >
      <span className="flex-1">{label}</span>
      <span
        className={cn(
          'ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full transition shrink-0',
          selected
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {selected ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="text-sm">+</span>
        )}
      </span>
    </button>
  );
}

// Export zone data for reuse
export const IBIZA_ZONES = [
  {
    group: 'Central',
    zones: [
      { id: 'ibiza-town', label: 'Ibiza Town (Eivissa)' },
      { id: 'jesus', label: 'Jesús' },
      { id: 'talamanca', label: 'Talamanca' },
      { id: 'figueretas', label: 'Figueretas' },
    ],
  },
  {
    group: 'West',
    zones: [
      { id: 'san-antonio', label: 'San Antonio' },
      { id: 'san-jose', label: 'San José' },
      { id: 'sant-jordi', label: 'Sant Jordi' },
      { id: 'cala-vadella', label: 'Cala Vadella' },
      { id: 'cala-tarida', label: 'Cala Tarida' },
      { id: 'cala-conta', label: 'Cala Conta' },
    ],
  },
  {
    group: 'North',
    zones: [
      { id: 'san-juan', label: 'San Juan' },
      { id: 'portinatx', label: 'Portinatx' },
      { id: 'san-miguel', label: 'San Miguel' },
      { id: 'san-mateo', label: 'San Mateo' },
      { id: 'cala-san-vicente', label: 'Cala San Vicente' },
    ],
  },
  {
    group: 'East',
    zones: [
      { id: 'santa-eulalia', label: 'Santa Eulalia' },
      { id: 'es-cana', label: 'Es Caná' },
      { id: 'san-carlos', label: 'San Carlos' },
      { id: 'cala-llonga', label: 'Cala Llonga' },
    ],
  },
  {
    group: 'South',
    zones: [
      { id: 'playa-den-bossa', label: "Playa d'en Bossa" },
      { id: 'salinas', label: 'Salinas' },
      { id: 'es-cubells', label: 'Es Cubells' },
    ],
  },
];
