import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { getDashboardPath } from '@/app/routes';
import type { UserRole } from '@/hooks/useSessionSnapshot';
import { User, Briefcase, ChevronDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const roleIcons: Record<UserRole, React.ReactNode> = {
  client: <User className="h-3.5 w-3.5" />,
  professional: <Briefcase className="h-3.5 w-3.5" />,
  admin: <User className="h-3.5 w-3.5" />,
};

/**
 * Compact role pill for mobile header.
 * Shows current role with a tap-to-switch bottom sheet.
 * Only renders for multi-role users.
 */
export function MobileRolePill() {
  const { t } = useTranslation();
  const { roles, activeRole, switchRole } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (roles.length <= 1) return null;

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'client': return t('roles.client', 'Client');
      case 'professional': return t('roles.professional', 'Professional');
      case 'admin': return t('roles.admin', 'Admin');
      default: return role;
    }
  };

  const handleSwitch = async (newRole: UserRole) => {
    if (newRole === activeRole) {
      setOpen(false);
      return;
    }
    await switchRole(newRole);
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['jobs_board'] });
    queryClient.invalidateQueries({ queryKey: ['matched_jobs'] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['client_stats'] });
    queryClient.invalidateQueries({ queryKey: ['client_jobs'] });
    queryClient.invalidateQueries({ queryKey: ['pro_unread_messages'] });
    queryClient.invalidateQueries({ queryKey: ['professional_services'] });

    const target = getDashboardPath(newRole);
    if (location.pathname.startsWith('/dashboard') && location.pathname !== target) {
      navigate(target, { replace: true });
    }
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {roleIcons[activeRole]}
          <span className="max-w-[4.5rem] truncate uppercase tracking-wide">
            {getRoleLabel(activeRole)}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-base">
            {t('lanes.switchMode', 'Switch mode')}
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 pb-4">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => handleSwitch(role)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors',
                role === activeRole
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-muted/40 text-foreground hover:bg-muted'
              )}
            >
              {roleIcons[role]}
              <span className="text-sm font-medium">{getRoleLabel(role)}</span>
              {role === activeRole && (
                <span className="ml-auto text-xs text-primary">
                  {t('common.active', 'Active')}
                </span>
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
