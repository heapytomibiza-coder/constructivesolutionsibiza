import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';
import { IntentSelector, type UserIntent } from '@/components/auth/IntentSelector';

/**
 * AUTH PAGE
 * 
 * Public page for sign in / sign up.
 * Supports returnUrl for post-login redirect.
 * Includes intent selection for new signups.
 */
const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Intent selection state (for signup flow)
  const [showIntentSelector, setShowIntentSelector] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<UserIntent | null>(null);

  const returnUrl = searchParams.get('returnUrl') || '/dashboard/client';
  const defaultTab = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Welcome back!');
      navigate(returnUrl);
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If intent not selected yet, show the selector first
    if (!selectedIntent) {
      setShowIntentSelector(true);
      return;
    }
    
    setIsLoading(true);

    try {
      // Determine roles based on intent
      const roles = selectedIntent === 'client' 
        ? ['client'] 
        : ['client', 'professional'];
      const activeRole = selectedIntent === 'professional' ? 'professional' : 'client';
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback',
          data: {
            intent: selectedIntent,
            initial_roles: roles,
            initial_active_role: activeRole,
          },
        },
      });

      if (error) throw error;

      toast.success('Check your email to confirm your account!');
      
      // Reset form
      setEmail('');
      setPassword('');
      setSelectedIntent(null);
      setShowIntentSelector(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntentContinue = () => {
    if (selectedIntent) {
      setShowIntentSelector(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-concrete flex items-center justify-center p-4">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-texture-concrete opacity-30" />
      
      <div className="relative w-full max-w-md z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-11 w-11 rounded-sm bg-gradient-steel flex items-center justify-center shadow-md">
            <span className="text-primary-foreground font-display font-bold text-lg">CS</span>
          </div>
          <span className="font-display text-2xl font-semibold text-foreground">
            CS Ibiza
          </span>
        </Link>

        <Card className="border-border/70">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display text-2xl">Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                  <div className="text-center">
                    <Link 
                      to="/auth/forgot-password" 
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                {showIntentSelector ? (
                  <div className="space-y-6">
                    <IntentSelector
                      value={selectedIntent}
                      onChange={setSelectedIntent}
                    />
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowIntentSelector(false)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        disabled={!selectedIntent}
                        onClick={handleIntentContinue}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    {selectedIntent && (
                      <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {selectedIntent === 'client' && '🏠 Signing up to hire'}
                          {selectedIntent === 'professional' && '🔧 Signing up to offer services'}
                          {selectedIntent === 'both' && '↔️ Signing up for both'}
                        </span>
                        <button
                          type="button"
                          className="ml-2 text-xs underline hover:text-foreground"
                          onClick={() => setShowIntentSelector(true)}
                        >
                          Change
                        </button>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        At least 6 characters
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        selectedIntent ? 'Create Account' : 'Continue'
                      )}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Trust signal */}
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Used by verified trades across Ibiza</span>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link to="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
