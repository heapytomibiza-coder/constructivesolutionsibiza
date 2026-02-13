import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle, Briefcase, ArrowLeftRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthHeroVisual } from './AuthHeroVisual';

export type UserIntent = 'client' | 'professional' | 'both';

interface IntentOption {
  value: UserIntent;
  icon: typeof HelpCircle;
  title: string;
  subtitle?: string;
  description: string;
  gradient: string;
  accentClass: string;
}

interface IntentSelectorProps {
  value: UserIntent | null;
  onChange: (intent: UserIntent) => void;
}

export function IntentSelector({ value, onChange }: IntentSelectorProps) {
  const { t } = useTranslation('auth');

  const intentOptions: IntentOption[] = useMemo(
    () => [
      {
        value: 'client',
        icon: HelpCircle,
        title: t('intent.options.client.title'),
        subtitle: t('intent.options.client.subtitle'),
        description: t('intent.options.client.description'),
        gradient: 'bg-gradient-steel',
        accentClass: 'text-primary',
      },
      {
        value: 'professional',
        icon: Briefcase,
        title: t('intent.options.professional.title'),
        subtitle: t('intent.options.professional.subtitle'),
        description: t('intent.options.professional.description'),
        gradient: 'bg-gradient-clay',
        accentClass: 'text-accent',
      },
      {
        value: 'both',
        icon: ArrowLeftRight,
        title: t('intent.options.both.title'),
        description: t('intent.options.both.description'),
        gradient: 'bg-gradient-steel',
        accentClass: 'text-primary',
      },
    ],
    [t]
  );

  return (
    <div className="space-y-5">
      {/* Welcome visual - warm Mediterranean moment */}
      <AuthHeroVisual />

      {/* Expressive header */}
      <div className="text-center space-y-2">
        <h3 className="font-display text-xl font-semibold text-foreground">
          {t('intent.title')}
        </h3>
        <p className="text-muted-foreground">
          {t('intent.subtitle')}
        </p>
      </div>

      {/* Intent cards with staggered animation */}
      <div className="grid gap-3">
        {intentOptions.map((option, index) => {
          const isSelected = value === option.value;
          const Icon = option.icon;

          return (
            <Card
              key={option.value}
              role="button"
              tabIndex={0}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(option.value);
                }
              }}
              className={cn(
                'cursor-pointer transition-all duration-300 opacity-0 animate-slide-up',
                'hover:shadow-md hover:border-accent/40',
                isSelected && 'border-accent ring-2 ring-accent/20 scale-[1.02] shadow-glow'
              )}
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              <CardContent className="flex items-center gap-4 p-5">
                {/* Gradient icon container */}
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-all duration-300',
                    isSelected ? option.gradient : 'bg-muted',
                    isSelected && 'shadow-md'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-6 w-6 transition-colors duration-300',
                      isSelected ? 'text-white' : option.accentClass
                    )}
                  />
                </div>

                {/* Text content */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        'font-display text-lg font-semibold transition-colors duration-300',
                        isSelected && option.accentClass
                      )}
                    >
                      {option.title}
                    </p>
                    {option.subtitle && (
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {option.subtitle}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white animate-scale-in">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
