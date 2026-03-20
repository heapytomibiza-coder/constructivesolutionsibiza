import { cn } from '@/lib/utils';
import heroAuth from '@/assets/heroes/hero-auth.webp';

interface AuthHeroVisualProps {
  className?: string;
}

/**
 * AuthHeroVisual - Compact hero banner for the auth intent selector
 * 
 * Creates an emotional "welcome" moment with Mediterranean warmth
 * before users choose their path (Asker vs Tasker).
 */
export function AuthHeroVisual({ className }: AuthHeroVisualProps) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg',
        'h-[100px] sm:h-[120px] md:h-[140px]',
        'animate-fade-in',
        className
      )}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroAuth})` }}
        role="img"
        aria-label="Professional consultation in Mediterranean light"
      />
      
      {/* Warm gradient overlay (steel → clay blend) */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/20 to-accent/30" />
      
      {/* Subtle vignette for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
    </div>
  );
}
