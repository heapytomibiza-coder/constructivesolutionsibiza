/**
 * SETTINGS PAGE
 * 
 * Accessible to any authenticated user.
 * Shows account info, role, notifications, and sign out option.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, LogOut, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from '@/contexts/SessionContext';
import type { UserRole } from '@/hooks/useSessionSnapshot';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface NotificationPrefs {
  email_messages: boolean;
  email_job_matches: boolean;
  email_digests: boolean;
  digest_frequency: string;
}

const DEFAULT_PREFS: NotificationPrefs = {
  email_messages: true,
  email_job_matches: true,
  email_digests: false,
  digest_frequency: 'daily',
};

export default function Settings() {
  const navigate = useNavigate();
  const { user, activeRole, roles, switchRole } = useSession();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  // Notification preferences
  const { data: prefs, isLoading: prefsLoading } = useQuery({
    queryKey: ['notification_preferences', user?.id],
    queryFn: async (): Promise<NotificationPrefs> => {
      if (!user?.id) return DEFAULT_PREFS;
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('email_messages, email_job_matches, email_digests, digest_frequency')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // Auto-create row if missing (for existing users)
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
      toast.error('Failed to update preference');
    },
  });

  const handleToggle = (key: keyof NotificationPrefs, value: boolean) => {
    updatePrefsMutation.mutate({ [key]: value });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
      return;
    }
    toast.success('Signed out successfully');
    navigate('/');
  };

  const dashboardPath = activeRole === 'professional' 
    ? '/dashboard/pro' 
    : '/dashboard/client';

  const roleLabel = activeRole === 'professional' ? 'Tasker' : 'Asker';
  const switchableRoles = roles.filter((r): r is UserRole => r === 'client' || r === 'professional');
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
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-2xl px-4 py-6 space-y-6">
        {/* Account Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Account</CardTitle>
            </div>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || 'Not available'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Current Mode</p>
              {switchableRoles.length > 1 ? (
                <div className="flex gap-2">
                  {switchableRoles.map((role) => {
                    const isActive = role === activeRole;
                    const label = role === 'professional' ? 'Tasker' : 'Asker';
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
                          toast.success(`Switched to ${label} mode`);
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <p className="font-medium">{roleLabel}</p>
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
                    onClick={() => navigate('/admin')}
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Panel
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
              <CardTitle className="text-base">Security</CardTitle>
            </div>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
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
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={isUpdating || !newPassword || !confirmPassword}>
                {isUpdating ? 'Updating…' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Notifications</CardTitle>
            </div>
            <CardDescription>Control which emails you receive</CardDescription>
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
                    <Label className="text-sm font-medium">New messages</Label>
                    <p className="text-xs text-muted-foreground">Email me when I receive a new message</p>
                  </div>
                  <Switch
                    checked={currentPrefs.email_messages}
                    onCheckedChange={(v) => handleToggle('email_messages', v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Job matches</Label>
                    <p className="text-xs text-muted-foreground">Email me when a job matches my services</p>
                  </div>
                  <Switch
                    checked={currentPrefs.email_job_matches}
                    onCheckedChange={(v) => handleToggle('email_job_matches', v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Email digest</Label>
                    <p className="text-xs text-muted-foreground">Receive a summary of activity</p>
                  </div>
                  <Switch
                    checked={currentPrefs.email_digests}
                    onCheckedChange={(v) => handleToggle('email_digests', v)}
                  />
                </div>
                {currentPrefs.email_digests && (
                  <div className="pl-4 border-l-2 border-border">
                    <Label className="text-sm">Digest frequency</Label>
                    <Select
                      value={currentPrefs.digest_frequency}
                      onValueChange={(v) => updatePrefsMutation.mutate({ digest_frequency: v })}
                    >
                      <SelectTrigger className="w-32 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
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
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
