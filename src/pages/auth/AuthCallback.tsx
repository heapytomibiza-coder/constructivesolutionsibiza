import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { ensureUserRoles } from '@/lib/ensureUserRoles';
import { Button } from '@/components/ui/button';

/**
 * AUTH CALLBACK PAGE
 * 
 * Handles OAuth and email confirmation callbacks.
 * Routes users to the correct destination based on their role and onboarding status.
 * 
 * UX: shows a calm loading state, then an inline error if something goes wrong —
 * never silently redirects on failure.
 */

type CallbackState =
  | { status: 'loading'; message: string }
  | { status: 'error'; message: string };

const AuthCallback = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: 'Completing sign in…',
  });

  useEffect(() => {
    const handleCallback = async () => {
      let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] = null;

      // Try getSession first; if null, wait briefly for onAuthStateChange to deliver it
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        setState({ status: 'error', message: 'Sign-in failed. Please try again.' });
        return;
      }

      session = data.session;

      // Race condition guard: session may not be ready yet after signInWithPassword + navigate
      if (!session) {
        setState({ status: 'loading', message: 'Waiting for confirmation…' });

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
        setState({
          status: 'error',
          message: 'We couldn\'t complete sign-in. Your session may have expired.',
        });
        return;
      }

      setState({ status: 'loading', message: 'Setting up your account…' });

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
        setState({
          status: 'error',
          message: err.message || 'Account setup incomplete. Please try signing in again.',
        });
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
      <div className="flex flex-col items-center gap-4 max-w-sm text-center px-4">
        {state.status === 'loading' ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{state.message}</p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-sm text-foreground font-medium">{state.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/auth')}
            >
              Back to sign in
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
