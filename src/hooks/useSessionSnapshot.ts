import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isPhaseReady } from '@/pages/onboarding/lib/phaseProgression';
import { bindAttributionOnSignIn } from '@/hooks/useAttribution';
import { logJourneyEvent, touchJourneySession, JOURNEY_EVENTS } from '@/lib/journey';
import type { User, Session } from '@supabase/supabase-js';
import type { Json } from '@/integrations/supabase/types';

/**
 * SESSION SNAPSHOT HOOK
 * 
 * Single source of truth for session state across the app.
 * Loads auth session + user_roles + professional_profiles in one place.
 * 
 * RULES:
 * - Caches results to avoid redundant queries
 * - Defaults active_role to 'client' to prevent null checks
 * - Exposes loading/ready states for proper gate handling
 * 
 * STALENESS GUARDS:
 * - loadVersionRef increments on every identity change / sign-out
 * - loadUserData bails if version drifted or userId mismatches current user
 * - clearAuthState is the single canonical reset path
 */

export type UserRole = 'client' | 'professional' | 'admin';

export type OnboardingPhase = 
  | 'not_started' 
  | 'basic_info' 
  | 'service_area'
  | 'verification'  // legacy — normalized to service_area
  | 'services'      // legacy — normalized to service_setup
  | 'service_setup' 
  | 'complete';

export type VerificationStatus = 
  | 'unverified' 
  | 'pending' 
  | 'verified' 
  | 'rejected';

export interface UserRolesData {
  roles: UserRole[];
  activeRole: UserRole;
}

export interface ProfessionalProfileData {
  onboardingPhase: OnboardingPhase;
  verificationStatus: VerificationStatus;
  servicesCount: number;
  isPubliclyListed: boolean;
  displayName: string | null;
  businessName: string | null;
  phone: string | null;
  serviceZones: string[];
}

export interface SessionSnapshot {
  // Auth state
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;

  // Role state
  roles: UserRole[];
  activeRole: UserRole;
  hasRole: (role: UserRole) => boolean;

  // Professional state (only for professionals)
  professionalProfile: ProfessionalProfileData | null;
  isProReady: boolean;

  // Loading states
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;

  // Actions
  refresh: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  becomeProfessional: () => Promise<boolean>;
}

const DEFAULT_ROLE: UserRole = 'client';

export function useSessionSnapshot(): SessionSnapshot {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([DEFAULT_ROLE]);
  const [activeRole, setActiveRole] = useState<UserRole>(DEFAULT_ROLE);
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Ref to track current user without stale closure issues
  const userRef = useRef<User | null>(null);
  useEffect(() => { userRef.current = user; }, [user]);

  // Monotonic version counter — incremented on every identity change or sign-out.
  // loadUserData checks this before applying results to prevent stale async writes.
  const loadVersionRef = useRef(0);

  // Tracks last authoritative auth event to avoid "ghost authenticated" state
  const authStateRef = useRef<'unknown' | 'signed_in' | 'signed_out'>('unknown');

  // One-shot recovery for cases where auth is ready before role queries settle.
  const hydrationRecoveryRef = useRef<{ userId: string | null; attempted: boolean }>({
    userId: null,
    attempted: false,
  });

  // ── Single canonical reset ──────────────────────────────────────────
  const clearAuthState = useCallback(() => {
    loadVersionRef.current += 1; // invalidate any in-flight loadUserData
    setSession(null);
    setUser(null);
    setRoles([DEFAULT_ROLE]);
    setActiveRole(DEFAULT_ROLE);
    setProfessionalProfile(null);
    hydrationRecoveryRef.current = { userId: null, attempted: false };
  }, []);

  // ── Load user data (roles + profile) ────────────────────────────────
  const loadUserData = useCallback(async (userId: string) => {
    const version = loadVersionRef.current;

    try {
      const [rolesSettled, proSettled, phoneSettled, isAdminSettled] = await Promise.allSettled([
        supabase
          .from('user_roles')
          .select('roles, active_role')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('professional_profiles')
          .select('onboarding_phase, verification_status, services_count, is_publicly_listed, display_name, business_name, service_zones')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('phone')
          .eq('user_id', userId)
          .single(),
        supabase.rpc('is_admin_email'),
      ]);

      const rolesResult = rolesSettled.status === 'fulfilled'
        ? rolesSettled.value
        : { data: null, error: rolesSettled.reason };
      const proResult = proSettled.status === 'fulfilled'
        ? proSettled.value
        : { data: null, error: proSettled.reason };
      const phoneResult = phoneSettled.status === 'fulfilled'
        ? phoneSettled.value
        : { data: null, error: phoneSettled.reason };
      const isAdminResult = isAdminSettled.status === 'fulfilled'
        ? isAdminSettled.value
        : { data: false, error: isAdminSettled.reason };

      // ── Stale-request guard: bail if version drifted or user changed ──
      if (version !== loadVersionRef.current) return;
      if (userRef.current && userRef.current.id !== userId) return;

      if (rolesResult.error && rolesResult.error.code !== 'PGRST116') {
        console.error('Error loading user roles:', rolesResult.error);
      }

      if (proResult.error && proResult.error.code !== 'PGRST116') {
        console.error('Error loading professional profile:', proResult.error);
      }

      if (phoneResult.error && phoneResult.error.code !== 'PGRST116') {
        console.warn('Error loading profile phone:', phoneResult.error);
      }

      if (isAdminResult.error) {
        console.warn('Error checking admin email:', isAdminResult.error);
      }

      const rawRoles: unknown = rolesResult.data?.roles;
      const normalizedRoles = Array.isArray(rawRoles)
        ? rawRoles.filter((role): role is string => typeof role === 'string')
        : typeof rawRoles === 'string'
          ? rawRoles.replace(/[{}]/g, '').split(',').map((role) => role.trim()).filter(Boolean)
          : [];

      const inferredRoles = new Set<UserRole>(
        normalizedRoles.filter((role): role is UserRole => (
          role === 'client' || role === 'professional' || role === 'admin'
        ))
      );

      if (inferredRoles.size === 0) {
        inferredRoles.add(DEFAULT_ROLE);
      }

      const dbRole = rolesResult.data?.active_role as UserRole | undefined;
      if (dbRole && (dbRole === 'client' || dbRole === 'professional' || dbRole === 'admin')) {
        inferredRoles.add(dbRole);
      }

      if (proResult.data) {
        inferredRoles.add('professional');
      }

      if (isAdminResult.data === true) {
        inferredRoles.add('admin');
      }

      // ── Second stale guard after role inference (awaits above can interleave) ──
      if (version !== loadVersionRef.current) return;

      const resolvedRoles = Array.from(inferredRoles);
      setRoles(resolvedRoles);

      // Deterministic active role: prefer DB → DEFAULT → professional → first
      // Never carry previous user's role across identities.
      const nextActiveRole =
        dbRole && resolvedRoles.includes(dbRole)
          ? dbRole
          : resolvedRoles.includes(DEFAULT_ROLE)
            ? DEFAULT_ROLE
            : resolvedRoles.includes('professional')
              ? 'professional'
              : resolvedRoles[0] ?? DEFAULT_ROLE;

      setActiveRole(nextActiveRole);

      if (proResult.data) {
        setProfessionalProfile({
          onboardingPhase: proResult.data.onboarding_phase as OnboardingPhase,
          verificationStatus: proResult.data.verification_status as VerificationStatus,
          servicesCount: proResult.data.services_count,
          isPubliclyListed: proResult.data.is_publicly_listed,
          displayName: proResult.data.display_name,
          businessName: proResult.data.business_name,
          phone: phoneResult.data?.phone || null,
          serviceZones: proResult.data.service_zones || [],
        });
      } else if (resolvedRoles.includes('professional')) {
        // Auto-repair: professional role exists but profile row is missing.
        // Call become_professional RPC which safely upserts the profile.
        console.warn(
          `[SessionSnapshot] User ${userId} has professional role but no professional_profiles row — auto-repairing.`
        );

        try {
          const { error: repairError } = await supabase.rpc('become_professional');

          if (repairError) {
            console.error('[SessionSnapshot] Auto-repair failed:', repairError);
            setProfessionalProfile(null);
          } else {
            // Re-fetch the now-created profile
            const { data: repairedProfile } = await supabase
              .from('professional_profiles')
              .select('onboarding_phase, verification_status, services_count, is_publicly_listed, display_name, business_name, service_zones')
              .eq('user_id', userId)
              .maybeSingle();

            if (repairedProfile) {
              setProfessionalProfile({
                onboardingPhase: repairedProfile.onboarding_phase as OnboardingPhase,
                verificationStatus: repairedProfile.verification_status as VerificationStatus,
                servicesCount: repairedProfile.services_count,
                isPubliclyListed: repairedProfile.is_publicly_listed,
                displayName: repairedProfile.display_name,
                businessName: repairedProfile.business_name,
                phone: phoneResult.data?.phone || null,
                serviceZones: repairedProfile.service_zones || [],
              });
            } else {
              setProfessionalProfile(null);
            }
          }
        } catch (repairErr) {
          console.error('[SessionSnapshot] Auto-repair threw:', repairErr);
          setProfessionalProfile(null);
        }
      } else {
        setProfessionalProfile(null);
      }
    } catch (err) {
      // Bail on stale request even for errors
      if (version !== loadVersionRef.current) return;
      if (userRef.current && userRef.current.id !== userId) return;

      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, []);

  // ── Manual refresh ──────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.warn('Session refresh warning:', sessionError);
      }
      
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        await loadUserData(currentSession.user.id);
      } else {
        // Only preserve memory state if we haven't received a definitive SIGNED_OUT
        if (userRef.current && authStateRef.current !== 'signed_out') {
          console.warn('Session returned null but user exists in memory and no SIGNED_OUT — preserving state');
        } else {
          clearAuthState();
        }
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, [loadUserData, clearAuthState]);

  // ── Role switch ─────────────────────────────────────────────────────
  const switchRole = useCallback(async (newRole: UserRole) => {
    if (!user || !roles.includes(newRole)) return;

    try {
      const { error: rpcError } = await supabase
        .rpc('switch_active_role', { p_new_role: newRole });

      if (rpcError) throw rpcError;

      setActiveRole(newRole);
    } catch (err) {
      console.error('Error switching role:', err);
      setError(err instanceof Error ? err : new Error('Failed to switch role'));
    }
  }, [user, roles]);

  // ── Become professional (atomic role + profile creation) ────────────
  const becomeProfessional = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    // Already has professional role
    if (roles.includes('professional')) return true;

    try {
      const { error: rpcError } = await supabase.rpc('become_professional');
      if (rpcError) throw rpcError;

      // Reload user data to pick up new role + profile
      await loadUserData(user.id);
      return true;
    } catch (err) {
      console.error('Error becoming professional:', err);
      setError(err instanceof Error ? err : new Error('Failed to become professional'));
      return false;
    }
  }, [user, roles, loadUserData]);

  // ── Auth state listener ─────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        // Diagnostic: emit journey event for every auth state change
        try {
          if (event === 'INITIAL_SESSION') {
            logJourneyEvent(JOURNEY_EVENTS.AUTH_INIT, {
              success: true,
              payload: { hasSession: !!newSession?.user },
            });
          } else if (event === 'SIGNED_IN') {
            touchJourneySession();
            logJourneyEvent(JOURNEY_EVENTS.AUTH_SUCCESS, { success: true, action: 'signed_in' });
          } else if (event === 'TOKEN_REFRESHED') {
            logJourneyEvent(JOURNEY_EVENTS.TOKEN_REFRESH, {
              success: !!newSession,
              payload: { hasSession: !!newSession },
            });
          } else if (event === 'SIGNED_OUT') {
            logJourneyEvent(JOURNEY_EVENTS.LOGOUT_TRIGGERED, {
              success: true,
              action: 'signed_out',
              payload: { reason: 'auth_event' },
            });
          } else if (event === 'USER_UPDATED') {
            logJourneyEvent(JOURNEY_EVENTS.USER_UPDATED, { success: true });
          }
        } catch { /* never throw */ }

        if (event === 'INITIAL_SESSION') {
          authStateRef.current = newSession ? 'signed_in' : 'unknown';

          if (newSession?.user) {
            loadVersionRef.current += 1; // new identity
            setSession(newSession);
            setUser(newSession.user);
            await loadUserData(newSession.user.id);
          } else {
            const hasPersistedSession = Object.keys(localStorage).some(
              (key) => key.startsWith('sb-') && key.endsWith('-auth-token')
            );

            if (hasPersistedSession) {
              await refresh();
              return;
            }

            clearAuthState();
          }
          setIsLoading(false);
          setIsReady(true);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          authStateRef.current = 'signed_in';

          if (newSession?.user) {
            setSession(newSession);
            setUser(newSession.user);
            setIsLoading(true);
            setError(null);

            // Defer loadUserData to avoid potential deadlock with Supabase client.
            // Bump version INSIDE setTimeout so the latest event always wins
            // and earlier scheduled loads don't get discarded by the stale guard.
            setTimeout(() => {
              loadVersionRef.current += 1;
              loadUserData(newSession.user.id)
                .catch((err) => {
                  console.error(`[Auth] loadUserData failed during ${event}:`, err);
                  try {
                    logJourneyEvent(JOURNEY_EVENTS.AUTH_FAILURE, {
                      success: false,
                      action: 'load_user_data',
                      errorMessage: err instanceof Error ? err.message : String(err),
                    });
                  } catch { /* swallow */ }
                })
                .finally(() => {
                  if (!mounted) return;
                  setIsLoading(false);
                  setIsReady(true);
                });
            }, 0);

            if (event === 'SIGNED_IN') {
              bindAttributionOnSignIn().catch(() => {});
            }
          } else if (event === 'TOKEN_REFRESHED' && !newSession) {
            // Token refresh returned no session — stale auth state
            console.warn('[Auth] Token refresh returned null session — clearing stale auth');
            try {
              logJourneyEvent(JOURNEY_EVENTS.LOGOUT_TRIGGERED, {
                success: false,
                action: 'token_refresh_null',
                payload: { reason: 'token_refresh_returned_null' },
              });
            } catch { /* swallow */ }
            authStateRef.current = 'signed_out';
            clearAuthState();
          }
        } else if (event === 'SIGNED_OUT') {
          authStateRef.current = 'signed_out';
          clearAuthState();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData, clearAuthState, refresh]);

  useEffect(() => {
    if (!user?.id || isLoading || !isReady) return;

    const isDefaultOnlyRole =
      roles.length === 1 &&
      roles[0] === DEFAULT_ROLE &&
      activeRole === DEFAULT_ROLE;

    if (!isDefaultOnlyRole) return;

    if (
      hydrationRecoveryRef.current.userId === user.id &&
      hydrationRecoveryRef.current.attempted
    ) {
      return;
    }

    hydrationRecoveryRef.current = { userId: user.id, attempted: true };

    const retryTimer = window.setTimeout(() => {
      loadVersionRef.current += 1;
      loadUserData(user.id).catch((err) => {
        console.error('[Auth] recovery loadUserData failed:', err);
      });
    }, 250);

    return () => window.clearTimeout(retryTimer);
  }, [user?.id, roles, activeRole, isLoading, isReady, loadUserData]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  const isProReady = 
    isPhaseReady(professionalProfile?.onboardingPhase) &&
    (professionalProfile?.servicesCount ?? 0) > 0;

  return {
    user,
    session,
    isAuthenticated: !!user,
    roles,
    activeRole,
    hasRole,
    professionalProfile,
    isProReady,
    isLoading,
    isReady,
    error,
    refresh,
    switchRole,
    becomeProfessional,
  };
}
