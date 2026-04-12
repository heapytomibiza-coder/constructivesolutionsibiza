import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { useRoleSwitch } from '@/hooks/useRoleSwitch';
import type { UserRole } from '@/hooks/useSessionSnapshot';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Briefcase, Loader2 } from 'lucide-react';

const roleIcons: Record<UserRole, React.ReactNode> = {
  client: <User className="h-4 w-4" />,
  professional: <Briefcase className="h-4 w-4" />,
  admin: <User className="h-4 w-4" />,
};

interface RoleSwitcherProps {
  className?: string;
}

export const RoleSwitcher = React.forwardRef<HTMLDivElement, RoleSwitcherProps>(
  function RoleSwitcher({ className }, ref) {
  const { t } = useTranslation();
  const { roles, activeRole } = useSession();
  const { isSwitching, handleSwitch } = useRoleSwitch();

  if (roles.length <= 1) return null;

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'client': return t('roles.client');
      case 'professional': return t('roles.professional');
      case 'admin': return t('roles.admin');
      default: return role;
    }
  };

  return (
    <div ref={ref}>
      <Select
        value={activeRole}
        onValueChange={(val) => handleSwitch(val as UserRole)}
        disabled={isSwitching}
      >
        <SelectTrigger className={className}>
          <div className="flex items-center gap-2">
            {isSwitching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              roleIcons[activeRole]
            )}
            <SelectValue placeholder={t('lanes.selectMode')} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role} value={role}>
              <div className="flex items-center gap-2">
                {roleIcons[role]}
                {getRoleLabel(role)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});
