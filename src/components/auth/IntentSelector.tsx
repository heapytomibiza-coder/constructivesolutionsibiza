import { Card, CardContent } from '@/components/ui/card';
import { Search, Hammer, RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export type UserIntent = 'client' | 'professional' | 'both';

interface IntentOption {
  value: UserIntent;
  icon: typeof Search;
  titleKey: string;
  descriptionKey: string;
  gradient: string;
  accentClass: string;
}

const intentOptions: IntentOption[] = [
  {
    value: 'client',
    icon: Search,
    titleKey: 'intent.client.title',
    descriptionKey: 'intent.client.description',
    gradient: 'bg-gradient-steel',
    accentClass: 'text-primary',
  },
  {
    value: 'professional',
    icon: Hammer,
    titleKey: 'intent.professional.title',
    descriptionKey: 'intent.professional.description',
    gradient: 'bg-gradient-clay',
    accentClass: 'text-accent',
  },
  {
    value: 'both',
    icon: RefreshCw,
    titleKey: 'intent.both.title',
    descriptionKey: 'intent.both.description',
    gradient: 'bg-gradient-steel',
    accentClass: 'text-primary',
  },
];

interface IntentSelectorProps {
  value: UserIntent | null;
  onChange: (intent: UserIntent) => void;
}

export function IntentSelector({ value, onChange }: IntentSelectorProps) {
  const { t } = useTranslation('auth');

  return (
    <div className="space-y-5">
      {/* Expressive header */}
      <div className="text-center space-y-2">
        <h3 className="font-display text-xl font-semibold text-foreground">
          {t('intent.header')}
        </h3>
        <p className="text-muted-foreground">
          {t('intent.subheader')}
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
                  <p
                    className={cn(
                      'font-display text-lg font-semibold transition-colors duration-300',
                      isSelected && option.accentClass
                    )}
                  >
                    {t(option.titleKey)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(option.descriptionKey)}
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
