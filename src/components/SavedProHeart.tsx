import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToggleSavedPro, useIsProSaved } from '@/hooks/useSavedPros';
import { useSession } from '@/contexts/SessionContext';
import { cn } from '@/lib/utils';

interface SavedProHeartProps {
  professionalId: string;
  className?: string;
  size?: 'sm' | 'default';
}

export function SavedProHeart({ professionalId, className, size = 'default' }: SavedProHeartProps) {
  const { user } = useSession();
  const isSaved = useIsProSaved(professionalId);
  const toggle = useToggleSavedPro();

  if (!user) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle.mutate(professionalId);
  };

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'shrink-0 rounded-full',
        size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
        className
      )}
      onClick={handleClick}
      disabled={toggle.isPending}
      aria-label={isSaved ? 'Remove from saved' : 'Save professional'}
    >
      <Heart
        className={cn(
          iconSize,
          'transition-colors',
          isSaved ? 'fill-destructive text-destructive' : 'text-muted-foreground'
        )}
      />
    </Button>
  );
}
