import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

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

      // Query user's active role from user_roles table
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('active_role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (rolesError && rolesError.code !== 'PGRST116') {
        console.error('Error fetching user roles:', rolesError);
      }

      const activeRole = rolesData?.active_role || 'client';

      if (activeRole === 'professional') {
        // Check onboarding status for professionals
        const { data: profileData, error: profileError } = await supabase
          .from('professional_profiles')
          .select('onboarding_phase')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching professional profile:', profileError);
        }

        const onboardingPhase = profileData?.onboarding_phase || 'not_started';

        // Established professionals go to dashboard, new ones to onboarding
        if (onboardingPhase === 'complete') {
          navigate('/dashboard/pro');
        } else {
          navigate('/onboarding/professional');
        }
      } else {
        // Clients go straight to the wizard to build the habit
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
