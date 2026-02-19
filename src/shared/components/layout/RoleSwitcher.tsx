import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { getDashboardPath } from '@/app/routes';
import type { UserRole } from '@/hooks/useSessionSnapshot';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Briefcase } from 'lucide-react';

const roleIcons: Record<UserRole, React.ReactNode> = {
  client: <User className="h-4 w-4" />,
  professional: <Briefcase className="h-4 w-4" />,
  admin: <User className="h-4 w-4" />,
};

interface RoleSwitcherProps {
  className?: string;
}

export function RoleSwitcher({ className }: RoleSwitcherProps) {
  const { t } = useTranslation();
  const { roles, activeRole, switchRole } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Only show if user has multiple roles
  if (roles.length <= 1) {
    return null;
  }

  // i18n labels for roles
  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'client':
        return t('roles.client');
      case 'professional':
        return t('roles.professional');
      case 'admin':
        return t('roles.admin');
      default:
        return role;
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (newRole === activeRole) return;

    await switchRole(newRole as UserRole);

    // Invalidate all role-dependent queries
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['jobs_board'] });
    queryClient.invalidateQueries({ queryKey: ['matched_jobs'] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['client_stats'] });
    queryClient.invalidateQueries({ queryKey: ['client_jobs'] });
    queryClient.invalidateQueries({ queryKey: ['pro_unread_messages'] });
    queryClient.invalidateQueries({ queryKey: ['professional_services'] });

    const target = getDashboardPath(newRole as UserRole);
    if (location.pathname.startsWith('/dashboard') && location.pathname !== target) {
      navigate(target, { replace: true });
    }
  };

  return (
    <Select value={activeRole} onValueChange={handleRoleChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          {roleIcons[activeRole]}
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
  );
}
