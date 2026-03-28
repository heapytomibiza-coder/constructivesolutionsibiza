import { useClientReputation, BADGE_LABELS } from '@/hooks/useClientReputation';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface ClientBadgesProps {
  clientId: string | null;
}

/**
 * Displays client trust badges (Reliable Client, Fast Responder, etc.)
 * Only shown to professionals — not public-facing.
 */
export function ClientBadges({ clientId }: ClientBadgesProps) {
  const { t } = useTranslation('dashboard');
  const { data } = useClientReputation(clientId);

  if (!data || data.badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {data.badges.map((badge) => {
        const meta = BADGE_LABELS[badge];
        if (!meta) return null;
        return (
          <Badge key={badge} variant="outline" className="gap-1 text-xs font-normal border-primary/20 text-primary">
            <span>{meta.icon}</span>
            {t(meta.labelKey, badge.replace(/_/g, ' '))}
          </Badge>
        );
      })}
    </div>
  );
}
