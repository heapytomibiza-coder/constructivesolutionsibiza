 import { Card, CardContent } from '@/components/ui/card';
 import { HelpCircle, Briefcase, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UserIntent = 'client' | 'professional' | 'both';

interface IntentOption {
  value: UserIntent;
  icon: typeof Home;
  title: string;
  description: string;
}

 const intentOptions: IntentOption[] = [
   {
     value: 'client',
     icon: HelpCircle,
     title: "I'm an Asker",
     description: 'I need help with a project — post jobs, get quotes, hire professionals',
   },
   {
     value: 'professional',
     icon: Briefcase,
     title: "I'm a Tasker",
     description: 'I offer my services — find work, apply for jobs, grow my business',
   },
   {
     value: 'both',
     icon: ArrowLeftRight,
     title: 'Both',
     description: 'I hire professionals AND offer my own services',
   },
 ];

interface IntentSelectorProps {
  value: UserIntent | null;
  onChange: (intent: UserIntent) => void;
}

export function IntentSelector({ value, onChange }: IntentSelectorProps) {
  return (
    <div className="space-y-4">
       <div className="text-center">
         <h3 className="font-display text-lg font-semibold text-foreground">
           Are you asking or tasking?
         </h3>
         <p className="mt-1 text-sm text-muted-foreground">
           Choose how you'll use CS Ibiza — you can switch anytime
         </p>
       </div>

      <div className="grid gap-3">
        {intentOptions.map((option) => {
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
                'cursor-pointer transition-all hover:border-accent/50 hover:shadow-sm',
                isSelected && 'border-accent bg-accent/5 ring-1 ring-accent/30'
              )}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted transition-colors',
                    isSelected && 'bg-accent/20 text-accent'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <p
                    className={cn(
                      'font-medium text-foreground',
                      isSelected && 'text-accent'
                    )}
                  >
                    {option.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
