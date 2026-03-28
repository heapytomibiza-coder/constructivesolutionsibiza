import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Star, Shield, TrendingUp } from 'lucide-react';

const LABEL_META: Record<string, { icon: React.ReactNode; labelKey: string; className: string }> = {
  top_rated: {
    icon: <Star className="h-3 w-3" />,
    labelKey: 'ranking.topRated',
    className: 'border-amber-500/30 text-amber-600 dark:text-amber-400',
  },
  highly_reliable: {
    icon: <Shield className="h-3 w-3" />,
    labelKey: 'ranking.highlyReliable',
    className: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  },
  in_demand: {
    icon: <TrendingUp className="h-3 w-3" />,
    labelKey: 'ranking.inDemand',
    className: 'border-blue-500/30 text-blue-600 dark:text-blue-400',
  },
};

interface ProRankingLabelsProps {
  labels: string[];
}

/**
 * Renders ranking labels (Top Rated, Highly Reliable, In Demand) for a professional.
 * Does NOT expose numeric ranking score.
 */
export function ProRankingLabels({ labels }: ProRankingLabelsProps) {
  const { t } = useTranslation('dashboard');

  if (!labels?.length) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => {
        const meta = LABEL_META[label];
        if (!meta) return null;
        return (
          <Badge
            key={label}
            variant="outline"
            className={`gap-1 text-xs font-normal ${meta.className}`}
          >
            {meta.icon}
            {t(meta.labelKey, label.replace(/_/g, ' '))}
          </Badge>
        );
      })}
    </div>
  );
}
