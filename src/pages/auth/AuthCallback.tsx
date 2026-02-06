import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * AUTH CALLBACK PAGE
 * 
 * Handles OAuth and email confirmation callbacks.
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        navigate('/auth?error=callback_failed');
        return;
      }

      if (session) {
        // Check for pending redirect (e.g., from wizard auth checkpoint)
        const pendingRedirect = sessionStorage.getItem('authRedirect');
        sessionStorage.removeItem('authRedirect');
        
        if (pendingRedirect) {
          navigate(pendingRedirect);
        } else {
          // Default redirect
          navigate('/dashboard/client');
        }
      } else {
        navigate('/auth');
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
