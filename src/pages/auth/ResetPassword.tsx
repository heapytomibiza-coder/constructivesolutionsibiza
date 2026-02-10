import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

/**
 * RESET PASSWORD PAGE
 *
 * Allows users to set a new password after clicking the reset link.
 */
const ResetPassword = () => {
  const { t, ready } = useTranslation('auth');
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // User should have a session from clicking the reset link
      setIsValidSession(!!session);
    };
    checkSession();
  }, []);

  // Show loading state while translations load or checking session
  if (!ready || isValidSession === null) {
    return (
      <div className="min-h-screen bg-gradient-concrete flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t('resetPasswordPage.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      toast.error(t('resetPasswordPage.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setIsSuccess(true);
      toast.success(t('resetPasswordPage.success'));
      
      // Redirect via callback for role-based routing
      setTimeout(() => {
        navigate('/auth/callback');
      }, 2000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('resetPasswordPage.error');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid or expired link
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-concrete flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-texture-concrete opacity-30" />

        <div className="relative w-full max-w-md z-10">
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="h-11 w-11 rounded-sm bg-gradient-steel flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-display font-bold text-lg">CS</span>
            </div>
            <span className="font-display text-2xl font-semibold text-foreground">
              CS Ibiza
            </span>
          </Link>

          <Card className="border-border/70">
            <CardContent className="pt-6">
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  {t('resetPasswordPage.invalidLink')}
                </p>
                <Button asChild className="w-full">
                  <Link to="/auth/forgot-password">
                    {t('resetPasswordPage.requestNewLink')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-concrete flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-texture-concrete opacity-30" />

      <div className="relative w-full max-w-md z-10">
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
            <CardTitle className="font-display text-2xl">
              {t('resetPasswordPage.title')}
            </CardTitle>
            <CardDescription>
              {t('resetPasswordPage.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isSuccess ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">
                    {t('resetPasswordPage.successTitle')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('resetPasswordPage.successDescription')}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('resetPasswordPage.newPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('form.password.placeholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-11 pr-10"
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('signUp.passwordHint')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('resetPasswordPage.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('form.password.placeholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                    autoComplete="new-password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('resetPasswordPage.updating')}
                    </>
                  ) : (
                    t('resetPasswordPage.submit')
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
