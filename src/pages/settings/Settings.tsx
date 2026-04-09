/**
 * SETTINGS PAGE
 * 
 * Accessible to any authenticated user.
 * Shows account info, role, notifications, and sign out option.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, Bell, BellRing, LogOut, Shield, Eye, EyeOff, Loader2, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSession } from '@/contexts/SessionContext';
import type { UserRole } from '@/hooks/useSessionSnapshot';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface NotificationPrefs {
  email_messages: boolean;
  email_job_matches: boolean;
  email_quotes: boolean;
  email_project_updates: boolean;
  email_digests: boolean;
  digest_frequency: string;
}

const DEFAULT_PREFS: NotificationPrefs = {
  email_messages: true,
  email_job_matches: true,
  email_quotes: true,
  email_project_updates: true,
  email_digests: false,
  digest_frequency: 'daily',
};

export default function Settings() {
  const navigate = useNavigate();
  const { t } = useTranslation('settings');
  const { user, activeRole, roles, switchRole } = useSession();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const queryClient = useQueryClient();

  // Track browser notification permission state
  useEffect(() => {
    if (!('Notification' in window)) {
      setBrowserPermission('unsupported');
    } else {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setBrowserPermission(result);
    if (result === 'granted') {
      try {
        new Notification('✅ Notifications enabled!', {
          body: 'You\'ll now receive alerts when someone messages you.',
          icon: '/favicon.ico',
        });
      } catch {
        // Some browsers don't support Notification constructor
      }
    }
  }, []);

  // Notification preferences
  const { data: prefs, isLoading: prefsLoading } = useQuery({
    queryKey: ['notification_preferences', user?.id],
    queryFn: async (): Promise<NotificationPrefs> => {
      if (!user?.id) return DEFAULT_PREFS;
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('email_messages, email_job_matches, email_quotes, email_project_updates, email_digests, digest_frequency')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        await supabase.from('notification_preferences').insert({ user_id: user.id });
        return DEFAULT_PREFS;
      }
      return data as NotificationPrefs;
    },
    enabled: !!user?.id,
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPrefs>) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('notification_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification_preferences'] });
    },
    onError: () => {
      toast.error(t('notifications.updateFailed'));
    },
  });

  // Re-enable confirmation state
  const [confirmDialog, setConfirmDialog] = useState<{ key: keyof NotificationPrefs; label: string } | null>(null);

  const labelForKey = (key: keyof NotificationPrefs): string => {
    const map: Record<string, string> = {
      email_messages: t('notifications.newMessages'),
      email_job_matches: t('notifications.jobMatches'),
      email_quotes: t('notifications.quotes'),
      email_project_updates: t('notifications.projectUpdates'),
      email_digests: t('notifications.emailDigest'),
    };
    return map[key] ?? key;
  };

  const handleToggle = (key: keyof NotificationPrefs, value: boolean) => {
    if (value) {
      // Re-enabling → require confirmation
      setConfirmDialog({ key, label: labelForKey(key) });
    } else {
      // Turning off → instant
      updatePrefsMutation.mutate({ [key]: value });
    }
  };

  const confirmReEnable = () => {
    if (confirmDialog) {
      updatePrefsMutation.mutate({ [confirmDialog.key]: true });
      setConfirmDialog(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(t('security.tooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('security.mismatch'));
      return;
    }
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(t('security.success'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('security.mismatch');
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(t('signOutFailed'));
      return;
    }
    toast.success(t('signOutSuccess'));
    navigate('/');
  };

  const dashboardPath = activeRole === 'admin'
    ? '/dashboard/admin'
    : activeRole === 'professional'
      ? '/dashboard/pro'
      : '/dashboard/client';

  const switchableRoles = roles.filter((r): r is UserRole => (
    r === 'client' || r === 'professional' || r === 'admin'
  ));
  const isAdmin = roles.includes('admin');
  const currentPrefs = prefs ?? DEFAULT_PREFS;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(dashboardPath)}
            aria-label={t('backToDashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('title')}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-2xl px-4 py-6 space-y-6">
        {/* Account Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t('account.title')}</CardTitle>
            </div>
            <CardDescription>{t('account.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('account.email')}</p>
              <p className="font-medium">{user?.email || t('account.notAvailable')}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t('account.currentMode')}</p>
              {switchableRoles.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {switchableRoles.map((role) => {
                    const isActive = role === activeRole;
                    const label = role === 'professional'
                      ? t('account.tasker')
                      : role === 'admin'
                        ? t('roles.admin', 'Admin')
                        : t('account.asker');
                    return (
                      <Button
                        key={role}
                        type="button"
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 active:scale-[0.97] transition-transform"
                        onClick={async () => {
                          if (role === activeRole) return;
                          await switchRole(role);
                          queryClient.invalidateQueries({ queryKey: ['jobs'] });
                          queryClient.invalidateQueries({ queryKey: ['jobs_board'] });
                          queryClient.invalidateQueries({ queryKey: ['matched_jobs'] });
                          queryClient.invalidateQueries({ queryKey: ['conversations'] });
                          queryClient.invalidateQueries({ queryKey: ['client_stats'] });
                          queryClient.invalidateQueries({ queryKey: ['client_jobs'] });
                          queryClient.invalidateQueries({ queryKey: ['pro_unread_messages'] });
                          queryClient.invalidateQueries({ queryKey: ['professional_services'] });
                          toast.success(t('account.switchedTo', { label }));
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <p className="font-medium">
                  {activeRole === 'professional'
                    ? t('account.tasker')
                    : activeRole === 'admin'
                      ? t('roles.admin', 'Admin')
                      : t('account.asker')}
                </p>
              )}
            </div>
            {isAdmin && (
              <>
                <Separator />
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between active:scale-[0.97] transition-transform"
                    onClick={() => navigate('/dashboard/admin')}
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t('account.adminPanel')}
                    </span>
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t('security.title')}</CardTitle>
            </div>
            <CardDescription>{t('security.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('security.newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('security.minChars')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? t('security.hidePassword') : t('security.showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('security.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('security.reEnter')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={isUpdating || !newPassword || !confirmPassword}>
                {isUpdating ? t('security.updating') : t('security.updatePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t('notifications.title')}</CardTitle>
            </div>
            <CardDescription>{t('notifications.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {prefsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('notifications.newMessages')}</Label>
                    <p className="text-xs text-muted-foreground">{t('notifications.newMessagesDesc')}</p>
                  </div>
                  <Switch
                    checked={currentPrefs.email_messages}
                    onCheckedChange={(v) => handleToggle('email_messages', v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('notifications.jobMatches')}</Label>
                    <p className="text-xs text-muted-foreground">{t('notifications.jobMatchesDesc')}</p>
                  </div>
                  <Switch
                    checked={currentPrefs.email_job_matches}
                    onCheckedChange={(v) => handleToggle('email_job_matches', v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('notifications.quotes')}</Label>
                    <p className="text-xs text-muted-foreground">{t('notifications.quotesDesc')}</p>
                  </div>
                  <Switch
                    checked={currentPrefs.email_quotes}
                    onCheckedChange={(v) => handleToggle('email_quotes', v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('notifications.projectUpdates')}</Label>
                    <p className="text-xs text-muted-foreground">{t('notifications.projectUpdatesDesc')}</p>
                  </div>
                  <Switch
                    checked={currentPrefs.email_project_updates}
                    onCheckedChange={(v) => handleToggle('email_project_updates', v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{t('notifications.emailDigest')}</Label>
                    <p className="text-xs text-muted-foreground">{t('notifications.emailDigestDesc')}</p>
                  </div>
                  <Switch
                    checked={currentPrefs.email_digests}
                    onCheckedChange={(v) => handleToggle('email_digests', v)}
                  />
                </div>
                {currentPrefs.email_digests && (
                  <div className="pl-4 border-l-2 border-border">
                    <Label className="text-sm">{t('notifications.digestFrequency')}</Label>
                    <Select
                      value={currentPrefs.digest_frequency}
                      onValueChange={(v) => updatePrefsMutation.mutate({ digest_frequency: v })}
                    >
                      <SelectTrigger className="w-32 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{t('notifications.daily')}</SelectItem>
                        <SelectItem value="weekly">{t('notifications.weekly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Browser Notifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t('notifications.browserTitle')}</CardTitle>
              {browserPermission === 'granted' && (
                <span className="ml-auto flex items-center gap-1 text-xs font-medium text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t('notifications.browserStatusAllowed')}
                </span>
              )}
              {browserPermission === 'denied' && (
                <span className="ml-auto flex items-center gap-1 text-xs font-medium text-destructive">
                  <XCircle className="h-3.5 w-3.5" />
                  {t('notifications.browserStatusBlocked')}
                </span>
              )}
            </div>
            <CardDescription>{t('notifications.browserDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {browserPermission === 'unsupported' ? (
              <p className="text-sm text-muted-foreground">
                Your browser does not support notifications.
              </p>
            ) : browserPermission === 'granted' ? (
              <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
                <p className="text-sm text-foreground">{t('notifications.browserGranted')}</p>
              </div>
            ) : browserPermission === 'denied' ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">{t('notifications.browserBlocked')}</p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>{t('notifications.browserBlockedStep1')}</li>
                  <li>{t('notifications.browserBlockedStep2')}</li>
                  <li>{t('notifications.browserBlockedStep3')}</li>
                </ol>
              </div>
            ) : (
              <Button onClick={requestBrowserPermission} variant="outline" className="w-full">
                <BellRing className="h-4 w-4 mr-2" />
                {t('notifications.browserEnable')}
              </Button>
            )}
            <Separator />
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{t('notifications.browserHowItWorks')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('notifications.browserHowItWorksDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('signOut')}
            </Button>
          </CardContent>
        </Card>
      </main>
      {/* Re-enable confirmation dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('notifications.confirmReEnable', { name: confirmDialog?.label })}</AlertDialogTitle>
            <AlertDialogDescription>{t('notifications.confirmReEnableDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('notifications.confirmCancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReEnable}>{t('notifications.confirmYes')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
