import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/contexts/SessionContext';
import { useClientStats } from './hooks/useClientStats';
import { RoleSwitcher } from '@/shared/components/layout/RoleSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Briefcase, 
  Plus, 
  FileText, 
  MessageSquare,
  MessageCircle,
  LogOut,
  Settings,
  Loader2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { ClientJobCard } from './components/ClientJobCard';
import { QuickActionTile } from '@/pages/dashboard/shared/components/QuickActionTile';

/**
 * CLIENT DASHBOARD
 * 
 * Protected route - requires role:client
 * Shows user's jobs and real stats.
 */
const ClientDashboard = () => {
  const { t } = useTranslation('dashboard');
  const { user, roles } = useSession();
  const { stats, jobs, isLoading, refetch } = useClientStats();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t('auth.signedOut'));
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-sm bg-gradient-steel flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-display font-bold text-sm">CS</span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              CS Ibiza
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            {roles.length > 1 && (
              <RoleSwitcher className="w-[160px]" />
            )}
            <Button variant="ghost" size="icon" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {t('client.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('client.welcomeBack', { email: user?.email || '' })}
            </p>
          </div>
          <Button className="gap-2" asChild>
            <Link to="/post">
              <Plus className="h-4 w-4" />
              {t('client.postJob')}
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Link to="/dashboard/client?filter=open" className="group active:scale-[0.98] transition-transform">
            <Card className="border-border/70 transition-all group-hover:border-primary/40 group-hover:shadow-md cursor-pointer active:bg-muted/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('client.activeJobs')}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <div className="text-3xl font-bold text-foreground">{stats.activeJobs}</div>
                )}
              </CardContent>
            </Card>
          </Link>
          <Link to="/dashboard/client?filter=in_progress" className="group active:scale-[0.98] transition-transform">
            <Card className="border-border/70 transition-all group-hover:border-primary/40 group-hover:shadow-md cursor-pointer active:bg-muted/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('client.inProgress')}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <div className="h-10 w-10 rounded-sm bg-accent/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <div className="text-3xl font-bold text-foreground">{stats.inProgressJobs}</div>
                )}
              </CardContent>
            </Card>
          </Link>
          <Link to="/dashboard/client?filter=draft" className="group active:scale-[0.98] transition-transform">
            <Card className="border-border/70 transition-all group-hover:border-primary/40 group-hover:shadow-md cursor-pointer active:bg-muted/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('client.draftJobs')}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <div className="h-10 w-10 rounded-sm bg-secondary flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <div className="text-3xl font-bold text-foreground">{stats.draftJobs}</div>
                )}
              </CardContent>
            </Card>
          </Link>
          <Link to="/messages" className="group active:scale-[0.98] transition-transform">
            <Card className={`border-border/70 transition-all group-hover:border-primary/40 group-hover:shadow-md cursor-pointer active:bg-muted/40 ${stats.unreadMessages > 0 ? 'ring-1 ring-destructive/30' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('stats.messages')}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <div className="h-10 w-10 rounded-sm bg-accent/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-accent" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-foreground">{stats.unreadMessages}</span>
                    {stats.unreadMessages > 0 && (
                      <Badge variant="destructive" className="text-xs">{t('stats.unread')}</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions — mobile */}
        <div className="grid grid-cols-2 gap-2 mb-5 sm:hidden">
          <QuickActionTile
            to="/post"
            icon={Plus}
            label={t('client.postJob')}
            hint={t('client.postJobHint', 'Describe what you need done')}
          />
          <QuickActionTile
            to="/messages"
            icon={MessageSquare}
            label={t('stats.messages')}
            hint={t('client.messagesHint', 'Chat with Taskers')}
          />
          <QuickActionTile
            to="/forum"
            icon={MessageCircle}
            label={t('client.communityForum', 'Community Forum')}
            hint={t('client.communityForumHint', 'Ask questions, get recommendations')}
          />
          <QuickActionTile
            to="/settings"
            icon={Settings}
            label="Settings"
            hint={t('client.settingsHint', 'Account and preferences')}
          />
        </div>

        {/* Quick Actions — desktop */}
        <Card className="border-border/70 mb-5 hidden sm:block">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">{t('client.quickActions', 'Quick Actions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 px-4 pb-4">
            <Button className="w-full justify-start gap-2 h-10" asChild>
              <Link to="/post">
                <Plus className="h-4 w-4" />
                {t('client.postJob')}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-10" asChild>
              <Link to="/messages">
                <MessageSquare className="h-4 w-4" />
                {t('stats.messages')}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-10" asChild>
              <Link to="/forum">
                <MessageCircle className="h-4 w-4" />
                {t('client.communityForum', 'Community Forum')}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-10" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                {t('client.settingsHint', 'Settings')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-display">{t('client.yourJobs')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-14 w-14 rounded-sm bg-muted flex items-center justify-center mb-4">
                  <Briefcase className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  {t('client.noJobs')}
                </p>
                <Button asChild>
                  <Link to="/post">{t('client.postFirst')}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <ClientJobCard 
                    key={job.id}
                    job={job}
                    onJobUpdated={refetch}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
