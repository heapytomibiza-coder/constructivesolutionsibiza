import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

/**
 * FORGOT PASSWORD PAGE
 *
 * Allows users to request a password reset email.
 */
const ForgotPassword = () => {
  const { t, ready } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  // Show loading state while translations load
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-concrete flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use Supabase's built-in password reset email
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      // Always show success to prevent email enumeration
      setIsEmailSent(true);
    } catch (error: unknown) {
      // Always show success to prevent email enumeration
      setIsEmailSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-concrete flex items-center justify-center p-4">
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
            <CardTitle className="font-display text-2xl">
              {t('forgotPasswordPage.title')}
            </CardTitle>
            <CardDescription>
              {t('forgotPasswordPage.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isEmailSent ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">
                    {t('forgotPasswordPage.emailSent.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('forgotPasswordPage.emailSent.description')}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/auth">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t('forgotPasswordPage.backToSignIn')}
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('form.email.label')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('form.email.placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('forgotPasswordPage.sending')}
                    </>
                  ) : (
                    t('forgotPasswordPage.submit')
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    to="/auth"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    {t('forgotPasswordPage.backToSignIn')}
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
