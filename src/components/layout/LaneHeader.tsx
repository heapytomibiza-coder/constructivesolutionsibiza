import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';

/**
 * LaneHeader - Mode indicator showing which pathway the user is in
 * 
 * Shows "Hiring Mode" or "Working Mode" with a role switcher for dual-role users.
 * Used on key pages like dashboards and messages to reinforce current context.
 */
export function LaneHeader() {
  const { t } = useTranslation();
  const { activeRole, roles, isAuthenticated } = useSession();

  // Don't show for unauthenticated users
  if (!isAuthenticated) {
    return null;
  }

  const isHiring = activeRole === 'client';
  const label = isHiring ? t('lanes.hiring') : t('lanes.working');

  return (
    <div className="bg-muted/50 py-1.5 border-b border-border/50">
      <div className="container flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        {roles.length > 1 && (
          <RoleSwitcher className="h-7 text-xs" />
        )}
      </div>
    </div>
  );
}
