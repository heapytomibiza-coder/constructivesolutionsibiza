import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Zap, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import type { JobTypeStat } from '../hooks/useJobTypeStats';

interface MicroCategory {
  id: string;
  name: string;
  slug: string;
}

interface JobTypeCardProps {
  micro: MicroCategory;
  stats?: JobTypeStat;
  clientProvides?: string[];
  isSelected: boolean;
  isExisting: boolean;
  onToggle: (checked: boolean) => void;
}

export function JobTypeCard({ 
  micro, 
  stats, 
  clientProvides, 
  isSelected, 
  isExisting, 
  onToggle 
}: JobTypeCardProps) {
  const { t } = useTranslation('onboarding');

  const formatTiming = (timing: 'asap' | 'flexible' | 'scheduled' | null) => {
    if (!timing) return null;
    
    const config = {
      asap: { icon: Zap, label: t('micro.timingAsap') },
      flexible: { icon: Calendar, label: t('micro.timingFlexible') },
      scheduled: { icon: Clock, label: t('micro.timingScheduled') },
    };
    
    const { icon: Icon, label } = config[timing];
    
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  return (
    <label
      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
        isExisting
          ? 'border-primary/30 bg-primary/5 cursor-not-allowed'
          : isSelected
            ? 'border-primary bg-primary/10 shadow-sm'
            : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
      }`}
    >
      <Checkbox
        checked={isSelected || isExisting}
        disabled={isExisting}
        onCheckedChange={(checked) => onToggle(!!checked)}
        className="mt-0.5"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-medium ${isExisting ? 'text-muted-foreground' : 'text-foreground'}`}>
            {micro.name}
          </span>
        </div>
        
        {/* Client provides preview */}
        {clientProvides && clientProvides.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {t('micro.clientProvides')} {clientProvides.join(', ').toLowerCase()}
          </p>
        )}
        
        {/* Job stats */}
        <div className="flex items-center gap-3 mt-2 text-xs">
          {stats && stats.openJobs > 0 ? (
            <>
              <span className="flex items-center gap-1 text-primary font-medium">
                <Briefcase className="h-3 w-3" />
                {t('micro.openJobs', { count: stats.openJobs })}
              </span>
              {formatTiming(stats.commonTiming)}
            </>
          ) : (
            <span className="text-muted-foreground">
              {t('micro.noJobs')}
            </span>
          )}
        </div>
      </div>
      
      {isExisting && (
        <Badge variant="secondary" className="shrink-0 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {t('micro.unlocked')}
        </Badge>
      )}
    </label>
  );
}
