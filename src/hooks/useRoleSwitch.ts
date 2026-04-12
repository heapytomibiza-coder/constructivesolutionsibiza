/**
 * useRoleSwitch — shared hook for role switching logic.
 *
 * Consolidates the RPC call, query invalidation, navigation,
 * loading state, and success toast that were previously duplicated
 * across RoleSwitcher, RoleSwitchPanel, and MobileRolePill.
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { getDashboardPath } from '@/app/routes';
import type { UserRole } from '@/hooks/useSessionSnapshot';

const INVALIDATED_QUERIES = [
  'jobs',
  'jobs_board',
  'matched_jobs',
  'conversations',
  'client_stats',
  'client_jobs',
  'pro_unread_messages',
  'professional_services',
] as const;

interface UseRoleSwitchReturn {
  isSwitching: boolean;
  handleSwitch: (newRole: UserRole) => Promise<void>;
}

export function useRoleSwitch(): UseRoleSwitchReturn {
  const { activeRole, switchRole } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('settings');
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = useCallback(async (newRole: UserRole) => {
    if (newRole === activeRole || isSwitching) return;

    setIsSwitching(true);
    try {
      await switchRole(newRole);

      for (const key of INVALIDATED_QUERIES) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }

      const roleLabel = t(`account.${newRole === 'professional' ? 'tasker' : newRole === 'client' ? 'asker' : 'admin'}`, newRole);
      toast.success(t('account.switchedTo', { label: roleLabel }));

      const target = getDashboardPath(newRole);
      if (location.pathname.startsWith('/dashboard') && location.pathname !== target) {
        navigate(target, { replace: true });
      }
    } catch (err) {
      console.error('[useRoleSwitch] Failed:', err);
      toast.error(t('account.switchError', 'Failed to switch mode. Please try again.'));
    } finally {
      setIsSwitching(false);
    }
  }, [activeRole, isSwitching, switchRole, queryClient, navigate, location.pathname, t]);

  return { isSwitching, handleSwitch };
}
