import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Briefcase } from 'lucide-react';
import type { RecommendedJobType } from '../hooks/useRecommendedJobTypes';

interface RecommendedJobTypesProps {
  recommendations: RecommendedJobType[];
  tradeName: string;
  existingMicroIds: Set<string>;
  onSelect: (microId: string, microSlug: string, microName: string) => void;
}

export function RecommendedJobTypes({ 
  recommendations, 
  tradeName, 
  existingMicroIds,
  onSelect 
}: RecommendedJobTypesProps) {
  const { t } = useTranslation('onboarding');

  // Filter out already unlocked and show only if we have recommendations
  const availableRecs = recommendations.filter(r => !existingMicroIds.has(r.microId));
  
  if (availableRecs.length === 0) return null;

  return (
    <Card className="mb-4 border-primary/30 bg-primary/5">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-primary fill-primary" />
          <span className="font-medium text-sm">
            {t('recommended.title', { trade: tradeName })}
          </span>
        </div>
        
        <p className="text-xs text-muted-foreground mb-3">
          {t('recommended.subtitle')}
        </p>
        
        <div className="space-y-2">
          {availableRecs.slice(0, 3).map((rec) => (
            <button
              key={rec.microId}
              onClick={() => onSelect(rec.microId, rec.microSlug, rec.microName)}
              className="w-full flex items-center justify-between p-2 rounded-md bg-background/50 hover:bg-background transition-colors text-left"
            >
              <span className="text-sm font-medium">{rec.microName}</span>
              <span className="flex items-center gap-1 text-xs text-primary">
                <Briefcase className="h-3 w-3" />
                {t('recommended.jobsWaiting', { count: rec.jobCount })}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
