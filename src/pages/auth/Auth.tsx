import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react';
import { IntentSelector, type UserIntent } from '@/components/auth/IntentSelector';
import { trackEvent } from '@/lib/trackEvent';

/**
 * AUTH PAGE
 *
 * Public page for sign in / sign up.
 * Supports returnUrl for post-login redirect.
 * Includes intent selection for new signups.
 */
const Auth = () => {
  const { t, ready } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');

  // Intent selection state (for signup flow) - START with intent selector
  const [showIntentSelector, setShowIntentSelector] = useState(true);
  const [phone, setPhone] = useState('');
  const [selectedIntent, setSelectedIntent] = useState<UserIntent | null>(null);
  
  // Post-signup state for confirmation messaging
  const [showConfirmationSent, setShowConfirmationSent] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );

  const returnUrl = searchParams.get('returnUrl'); // No default - let callback handle role-based routing
  const allowProfessional = searchParams.get('pro') === '1';

  // Double-check: ready can be true before HTTP fetch completes with useSuspense: false
  // Verify that a known key actually resolves (not to itself)
  const translationsLoaded = ready && t('page.title') !== 'page.title';

  // Show loading state while translations load (fallback for slow connections)
  if (!translationsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-concrete flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('login_started', 'client', { method: 'email' });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success(t('toast.welcomeBack'));
      // Let AuthCallback handle role-based routing if no explicit returnUrl
      navigate(returnUrl || '/auth/callback');
    } catch (error: any) {
      const message = error?.message || t('toast.signInFailed');
      const code = error?.code;

      trackEvent('login_failed', 'client', { error: message, code });

      // If the user exists but hasn't confirmed their email yet,
      // show the confirmation UI so they can resend the email.
      if (code === 'email_not_confirmed' || /email.*not.*confirmed/i.test(message)) {
        setConfirmationEmail(email);
        setShowConfirmationSent(true);
        setActiveTab('signup');
      }

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Intent must be selected (flow enforces this)
    if (!selectedIntent) return;

    setIsLoading(true);
    trackEvent('signup_started', 'client', { intent: selectedIntent });

    try {
      // Determine roles based on intent
      const roles: string[] = selectedIntent === 'client' ? ['client'] : ['client', 'professional'];
      const activeRole = selectedIntent === 'professional' ? 'professional' : 'client';

      // Use Supabase's built-in auth which handles confirmation emails automatically
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            intent: selectedIntent,
            full_name: fullName,
            ...(phone ? { phone } : {}),
          },
        },
      });

      if (error) throw error;

      // If auto-confirm is enabled, user gets a session immediately — redirect
      if (data.session) {
        toast.success(t('toast.signUpSuccess', 'Account created successfully!'));
        navigate('/auth/callback');
        return;
      }

      // Otherwise show confirmation UI
      setConfirmationEmail(email);
      setShowConfirmationSent(true);

      // Reset form
      setEmail('');
      setPassword('');
      setPhone('');
      setFullName('');
      setSelectedIntent(null);
      setShowIntentSelector(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t('toast.signUpFailed');

      trackEvent('signup_failed', 'client', { error: message, intent: selectedIntent });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendConfirmation = async () => {
    if (!confirmationEmail) return;
    
    setIsResending(true);
    try {
      // Use Supabase's built-in resend confirmation
      await supabase.auth.resend({
        type: 'signup',
        email: confirmationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      toast.success(t('toast.confirmationResent'));
    } catch (error: unknown) {
      // Still show success to prevent enumeration
      toast.success(t('toast.confirmationResent'));
    } finally {
      setIsResending(false);
    }
  };
  
  const handleBackToSignup = () => {
    setShowConfirmationSent(false);
    setConfirmationEmail('');
  };
  
  const handleSwitchToSignIn = () => {
    setShowConfirmationSent(false);
    setActiveTab('signin');
    setEmail(confirmationEmail);
  };

  const handleIntentSelect = (intent: UserIntent) => setSelectedIntent(intent);

  const handleIntentContinue = () => {
    if (selectedIntent) setShowIntentSelector(false);
  };

  const intentBadgeText =
    selectedIntent === 'client'
      ? t('signUp.intentBadge.client')
      : selectedIntent === 'professional'
        ? t('signUp.intentBadge.professional')
        : selectedIntent === 'both'
          ? t('signUp.intentBadge.both')
          : '';

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
            <CardTitle className="font-display text-2xl">{t('page.title')}</CardTitle>
            <CardDescription>{t('page.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">{t('tabs.signIn')}</TabsTrigger>
                <TabsTrigger value="signup">{t('tabs.signUp')}</TabsTrigger>
              </TabsList>

              {/* SIGN IN */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t('form.email.label')}</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder={t('form.email.placeholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t('form.password.label')}</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('form.password.placeholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                        autoComplete="current-password"
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
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('signIn.loading')}
                      </>
                    ) : (
                      t('tabs.signIn')
                    )}
                  </Button>

                  <div className="text-center">
                    <Link
                      to="/auth/forgot-password"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {t('forgotPassword')}
                    </Link>
                  </div>
                </form>
              </TabsContent>

              {/* SIGN UP */}
              <TabsContent value="signup">
                {showConfirmationSent ? (
                  // Confirmation sent screen
                  <div className="space-y-6 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{t('confirmation.title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('confirmation.description', { email: confirmationEmail })}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleResendConfirmation}
                        disabled={isResending}
                      >
                        {isResending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('confirmation.resending')}
                          </>
                        ) : (
                          t('confirmation.resend')
                        )}
                      </Button>
                      
                      <div className="text-sm text-muted-foreground">
                        {t('confirmation.alreadyConfirmed')}{' '}
                        <button
                          type="button"
                          onClick={handleSwitchToSignIn}
                          className="text-primary hover:underline font-medium"
                        >
                          {t('confirmation.signInLink')}
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleBackToSignup}
                        className="text-sm text-muted-foreground hover:text-foreground underline"
                      >
                        {t('confirmation.tryDifferentEmail')}
                      </button>
                    </div>
                  </div>
                ) : showIntentSelector ? (
                  <div className="space-y-6">
                    <IntentSelector value={selectedIntent} onChange={handleIntentSelect} allowProfessional={allowProfessional} />
                    <Button
                      type="button"
                      className="w-full"
                      disabled={!selectedIntent}
                      onClick={handleIntentContinue}
                    >
                      {t('signUp.continue')}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {selectedIntent === 'client' && `❓ ${intentBadgeText}`}
                        {selectedIntent === 'professional' && `💼 ${intentBadgeText}`}
                        {selectedIntent === 'both' && `↔️ ${intentBadgeText}`}
                      </span>
                      <button
                        type="button"
                        className="ml-2 text-xs underline hover:text-foreground"
                        onClick={() => setShowIntentSelector(true)}
                      >
                        {t('signUp.intentBadge.change')}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-fullname">{t('form.fullName.label', 'Full name')}</Label>
                      <Input
                        id="signup-fullname"
                        type="text"
                        placeholder={t('form.fullName.placeholder', 'Your full name')}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-11"
                        autoComplete="name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t('form.email.label')}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t('form.email.placeholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">{t('signUp.phone.label')}</Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder={t('signUp.phone.placeholder')}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="h-11"
                        autoComplete="tel"
                      />
                      <p className="text-xs text-muted-foreground">{t('signUp.phone.hint')}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t('form.password.label')}</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t('form.password.placeholder')}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                          className="h-11 pr-10"
                          autoComplete="new-password"
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

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowIntentSelector(true)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('signUp.back')}
                      </Button>
                      <Button type="submit" className="flex-1" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('signUp.loading')}
                          </>
                        ) : (
                          t('signUp.button')
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Trust signal */}
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>{t('trust')}</span>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {t('legal.prefix')}{' '}
          <Link to="/terms" className="underline hover:text-foreground">
            {t('legal.terms')}
          </Link>
          {' '}{t('legal.and')}{' '}
          <Link to="/privacy" className="underline hover:text-foreground">
            {t('legal.privacy')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
