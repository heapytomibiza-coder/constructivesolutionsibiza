import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/contexts/SessionContext';
import type { UserRole } from '@/hooks/useSessionSnapshot';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Briefcase } from 'lucide-react';

const roleLabels: Record<UserRole, string> = {
  client: 'Client',
  professional: 'Professional',
  admin: 'Admin',
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  client: <User className="h-4 w-4" />,
  professional: <Briefcase className="h-4 w-4" />,
  admin: <User className="h-4 w-4" />,
};

interface RoleSwitcherProps {
  className?: string;
}

export function RoleSwitcher({ className }: RoleSwitcherProps) {
  const { roles, activeRole, switchRole } = useSession();
  const queryClient = useQueryClient();

  // Only show if user has multiple roles
  if (roles.length <= 1) {
    return null;
  }

  const handleRoleChange = async (newRole: string) => {
    if (newRole === activeRole) return;

    await switchRole(newRole as UserRole);

    // Invalidate all role-dependent queries
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['matched_jobs'] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['client_stats'] });
    queryClient.invalidateQueries({ queryKey: ['client_jobs'] });
    queryClient.invalidateQueries({ queryKey: ['pro_unread_messages'] });
    queryClient.invalidateQueries({ queryKey: ['professional_services'] });
  };

  return (
    <Select value={activeRole} onValueChange={handleRoleChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          {roleIcons[activeRole]}
          <SelectValue placeholder="Select role" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role} value={role}>
            <div className="flex items-center gap-2">
              {roleIcons[role]}
              {roleLabels[role]}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
