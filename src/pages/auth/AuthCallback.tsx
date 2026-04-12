import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { ensureUserRoles } from '@/lib/ensureUserRoles';
import { toast } from 'sonner';

/**
 * AUTH CALLBACK PAGE
 * 
 * Handles OAuth and email confirmation callbacks.
 * Routes users to the correct destination based on their role and onboarding status.
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] = null;

      // Try getSession first; if null, wait briefly for onAuthStateChange to deliver it
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        navigate('/auth?error=callback_failed');
        return;
      }

      session = data.session;

      // Race condition guard: session may not be ready yet after signInWithPassword + navigate
      if (!session) {
        session = await new Promise<typeof session>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 3000);
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            if (s) {
              clearTimeout(timeout);
              subscription.unsubscribe();
              resolve(s);
            }
          });
        });
      }

      if (!session) {
        navigate('/auth');
        return;
      }

      // Check for pending redirect (e.g., from wizard auth checkpoint)
      // Check both storages — localStorage survives cross-tab email confirmations
      const pendingRedirect = sessionStorage.getItem('authRedirect')
        || localStorage.getItem('authRedirect');
      sessionStorage.removeItem('authRedirect');
      try { localStorage.removeItem('authRedirect'); } catch {}
      
      if (pendingRedirect) {
        navigate(pendingRedirect);
        return;
      }

      // Query user roles with retry — never silently default
      let activeRole: string;
      try {
        const result = await ensureUserRoles(session.user.id);
        activeRole = result.activeRole;
      } catch (err: any) {
        console.error('[AuthCallback] Role setup failed:', err.message);
        toast.error(err.message || 'Account setup incomplete. Please try signing in again.');
        navigate('/auth');
        return;
      }

      if (activeRole === 'professional') {
        const { data: profileData } = await supabase
          .from('professional_profiles')
          .select('onboarding_phase')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const onboardingPhase = profileData?.onboarding_phase || 'not_started';

        if (onboardingPhase === 'complete') {
          navigate('/dashboard/pro');
        } else {
          navigate('/onboarding/professional');
        }
      } else {
        navigate('/dashboard/client');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
