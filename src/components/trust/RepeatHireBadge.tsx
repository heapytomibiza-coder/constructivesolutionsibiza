import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { useRepeatHirePair } from '@/hooks/useRepeatHirePair';

interface RepeatHireBadgeProps {
  clientId: string | null;
  proId: string | null;
  /** Which side is viewing */
  viewerRole: 'client' | 'pro';
}

/**
 * Shows a "Repeat client" or "Hired X times" badge on quote/conversation screens.
 * Hidden when hire_count < 2 (no repeat yet).
 */
export function RepeatHireBadge({ clientId, proId, viewerRole }: RepeatHireBadgeProps) {
  const { t } = useTranslation('dashboard');
  const { data } = useRepeatHirePair(clientId, proId);

  if (!data || data.hireCount < 2) return null;

  const label = viewerRole === 'pro'
    ? t('trust.repeatClient', { count: data.hireCount, defaultValue: `Repeat client · ${data.hireCount} jobs together` })
    : t('trust.hiredBefore', { count: data.hireCount, defaultValue: `You've hired this pro ${data.hireCount} times` });

  return (
    <Badge variant="secondary" className="gap-1 text-xs font-normal">
      <RefreshCw className="h-3 w-3" />
      {label}
    </Badge>
  );
}
