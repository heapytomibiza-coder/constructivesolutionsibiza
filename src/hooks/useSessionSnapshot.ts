import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isPhaseReady } from '@/pages/onboarding/lib/phaseProgression';
import { bindAttributionOnSignIn } from '@/hooks/useAttribution';
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
  isProReady: boolean; // isPhaseReady(onboardingPhase) && servicesCount > 0 — verification is NOT a gate for MESSAGE/APPLY

  // Loading states
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;

  // Actions
  refresh: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
}

const DEFAULT_ROLE: UserRole = 'client';

// Attribution binding is now handled server-side via the collect-attribution edge function.
// See bindAttributionOnSignIn() in useAttribution.ts.

export function useSessionSnapshot(): SessionSnapshot {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([DEFAULT_ROLE]);
  const [activeRole, setActiveRole] = useState<UserRole>(DEFAULT_ROLE);
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadUserData = useCallback(async (userId: string) => {
    try {
      // Load user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('roles, active_role')
        .eq('user_id', userId)
        .single();

      if (rolesError && rolesError.code !== 'PGRST116') {
        console.error('Error loading user roles:', rolesError);
      }

      if (rolesData) {
        setRoles(rolesData.roles as UserRole[]);
        setActiveRole((rolesData.active_role as UserRole) || DEFAULT_ROLE);
      }

      // Load professional profile if user has professional role
      const userRoles = rolesData?.roles || [DEFAULT_ROLE];
      if (userRoles.includes('professional')) {
        const { data: profileData, error: profileError } = await supabase
          .from('professional_profiles')
          .select('onboarding_phase, verification_status, services_count, is_publicly_listed, display_name, business_name, service_zones')
          .eq('user_id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error loading professional profile:', profileError);
        }

        if (profileData) {
          // Also fetch phone from profiles table
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('phone')
            .eq('user_id', userId)
            .single();

          setProfessionalProfile({
            onboardingPhase: profileData.onboarding_phase as OnboardingPhase,
            verificationStatus: profileData.verification_status as VerificationStatus,
            servicesCount: profileData.services_count,
            isPubliclyListed: profileData.is_publicly_listed,
            displayName: profileData.display_name,
            businessName: profileData.business_name,
            phone: userProfile?.phone || null,
            serviceZones: profileData.service_zones || [],
          });
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      // Gracefully handle stale refresh tokens
      if (sessionError) {
        const msg = (sessionError as any)?.message?.toLowerCase?.() ?? '';
        if (msg.includes('refresh token') || msg.includes('token not found')) {
          console.warn('Stale session detected, signing out');
          await supabase.auth.signOut();
        }
      }
      
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        await loadUserData(currentSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        setRoles([DEFAULT_ROLE]);
        setActiveRole(DEFAULT_ROLE);
        setProfessionalProfile(null);
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, [loadUserData]);

  const switchRole = useCallback(async (newRole: UserRole) => {
    if (!user || !roles.includes(newRole)) {
      // Role switch denied - user doesn't have this role
      return;
    }

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

  // Set up auth state listener - handles INITIAL_SESSION for page load
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        // INITIAL_SESSION fires on page load with existing session (or null)
        if (event === 'INITIAL_SESSION') {
          if (newSession?.user) {
            setSession(newSession);
            setUser(newSession.user);
            await loadUserData(newSession.user.id);
          } else {
            // No session - reset to defaults
            setSession(null);
            setUser(null);
            setRoles([DEFAULT_ROLE]);
            setActiveRole(DEFAULT_ROLE);
            setProfessionalProfile(null);
          }
          setIsLoading(false);
          setIsReady(true);
          return;
        }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession?.user) {
            setSession(newSession);
            setUser(newSession.user);
            // Use setTimeout to avoid potential deadlock with Supabase client
            // On TOKEN_REFRESHED, load data but keep existing state on failure (graceful degradation)
            setTimeout(() => {
              loadUserData(newSession.user.id).catch((err) => {
                if (event === 'TOKEN_REFRESHED') {
                  console.warn('loadUserData failed during token refresh, keeping cached state:', err);
                  // Don't reset state — keep stale data rather than breaking the UI
                }
              });
            }, 0);

            // Fire-and-forget: bind attribution session → user via edge function
            if (event === 'SIGNED_IN') {
              bindAttributionOnSignIn().catch(() => {});
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setRoles([DEFAULT_ROLE]);
          setActiveRole(DEFAULT_ROLE);
          setProfessionalProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  // Calculate if professional is "ready" for marketplace actions
  // Uses normalized phase check from phaseProgression utility
  // Soft launch: verification is a trust badge, NOT a gate.
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
  };
}
