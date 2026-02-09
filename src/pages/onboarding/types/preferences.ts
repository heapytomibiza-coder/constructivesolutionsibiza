/**
 * Shared preference types for professional micro-service ranking
 * Used in Edit Mode to rank job preferences for matching
 */

export type Preference = 'love' | 'like' | 'neutral';

export const PREFERENCE_OPTIONS: Record<
  Preference,
  { icon: string; label: string; description: string; className: string }
> = {
  love: {
    icon: '❤️',
    label: 'Love',
    description: 'Push these to me first',
    className: 'text-destructive',
  },
  like: {
    icon: '👍',
    label: 'Like',
    description: 'Happy to receive',
    className: 'text-primary',
  },
  neutral: {
    icon: '◻',
    label: 'Neutral',
    description: "I'll do it if available",
    className: 'text-muted-foreground',
  },
};
