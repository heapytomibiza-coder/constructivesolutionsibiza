import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { Unlock, CheckCircle2 } from 'lucide-react';

interface UnlockProgressProps {
  unlockedCount: number;
  minimumRequired?: number;
}

export function UnlockProgress({ unlockedCount, minimumRequired = 5 }: UnlockProgressProps) {
  const { t } = useTranslation('onboarding');
  
  const progress = Math.min((unlockedCount / minimumRequired) * 100, 100);
  const isReady = unlockedCount >= minimumRequired;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        {isReady ? (
          <CheckCircle2 className="h-4 w-4 text-primary" />
        ) : (
          <Unlock className="h-4 w-4 text-primary" />
        )}
        <span className="text-sm font-medium">
          {t('progress.unlocked', { count: unlockedCount, min: minimumRequired })}
        </span>
      </div>
      
      <Progress value={progress} className="h-2 mb-2" />
      
      <p className="text-xs text-muted-foreground">
        {isReady 
          ? t('progress.ready')
          : t('progress.hint', { min: minimumRequired })
        }
      </p>
    </div>
  );
}
