import { useTranslation } from 'react-i18next';
import { User, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';
import { useRoleSwitch } from '@/hooks/useRoleSwitch';
import type { UserRole } from '@/hooks/useSessionSnapshot';
import { cn } from '@/lib/utils';

const roleIcons: Record<UserRole, React.ReactNode> = {
  client: <User className="h-4 w-4" />,
  professional: <Briefcase className="h-4 w-4" />,
  admin: <User className="h-4 w-4" />,
};

interface RoleSwitchPanelProps {
  className?: string;
}

export function RoleSwitchPanel({ className }: RoleSwitchPanelProps) {
  const { t } = useTranslation();
  const { roles, activeRole } = useSession();
  const { isSwitching, handleSwitch } = useRoleSwitch();

  if (roles.length <= 1) return null;

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'client': return t('roles.client', 'Client');
      case 'professional': return t('roles.professional', 'Professional');
      case 'admin': return t('roles.admin', 'Admin');
      default: return role;
    }
  };

  return (
    <section className={cn('rounded-2xl border border-border bg-card p-3', className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {t('lanes.switchMode', 'Switch mode')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('lanes.switchModeHint', 'Choose the workspace you want to use right now.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {roles.map((role) => {
          const isActive = role === activeRole;

          return (
            <Button
              key={role}
              type="button"
              variant={isActive ? 'default' : 'outline'}
              disabled={isSwitching}
              className={cn(
                'h-auto justify-start gap-3 rounded-xl px-3 py-3 text-left',
                !isActive && 'bg-background'
              )}
              onClick={() => handleSwitch(role)}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted/60">
                {isSwitching && !isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  roleIcons[role]
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start">
                <span className="text-sm font-medium">{getRoleLabel(role)}</span>
                <span className="text-xs opacity-80">
                  {isActive ? t('common.active', 'Active') : t('common.switch', 'Switch')}
                </span>
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
