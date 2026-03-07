import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from '@/contexts/SessionContext';
import { useProStats } from './hooks/useProStats';
import { RoleSwitcher } from '@/shared/components/layout/RoleSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Briefcase, 
  Wrench,
  MessageSquare,
  MessageCircle,
  LogOut,
  Settings,
  ArrowRight,
  User,
  Star,
  Store,
  ListChecks
} from 'lucide-react';
import { QuickActionTile } from '@/pages/dashboard/shared/components/QuickActionTile';

/**
 * PROFESSIONAL DASHBOARD
 * 
 * Clean navigation hub — action tiles only, no stats or job lists.
 */
const ProDashboard = () => {
  const { t } = useTranslation('dashboard');
  const { user, roles } = useSession();
  const { stats } = useProStats();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t('auth.signedOut'));
    navigate('/');
  };

  const needsServiceSetup = stats.servicesCount === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-sm bg-gradient-steel flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-display font-bold text-xs">CS</span>
            </div>
            <span className="font-display text-lg font-semibold text-foreground hidden sm:inline">
              CS Ibiza
            </span>
          </Link>
          
          <div className="flex items-center gap-2">
            {roles.length > 1 && (
              <RoleSwitcher className="w-[140px]" />
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-5 sm:py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {t('pro.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {t('pro.welcomeBack', { email: user?.email || '' })}
          </p>
        </div>

        {/* Services-First Guidance — only when no services */}
        {needsServiceSetup && (
          <Card className="mb-5 border-primary bg-primary/5 shadow-md">
            <CardContent className="py-5 px-5">
              <div className="flex items-start gap-4">
                <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base font-bold text-foreground mb-1">
                    {t('pro.servicesFirstTitle', 'Start with your services — it\'s how you get work')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('pro.servicesFirstDesc')}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('pro.servicesFirstWhy')}
                  </p>
                  <Button asChild size="default">
                    <Link to="/onboarding/professional?step=services">
                      <Wrench className="h-4 w-4 mr-2" />
                      {t('pro.chooseServices', 'Choose Your Services')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* MY WORK */}
        <div className="mb-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t('pro.sectionWork', 'My Work')}
          </h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <QuickActionTile
              to="/onboarding/professional?edit=1&step=services"
              icon={ListChecks}
              label={t('pro.editMyServices', 'Edit My Services')}
              hint={t('pro.editMyServicesHint', 'Add or remove the jobs you accept')}
            />
            <QuickActionTile
              to="/professional/listings"
              icon={Store}
              label={t('pro.createServicePages', 'Create Your Service Pages')}
              hint={t('pro.createServicePagesHint', 'Build the pages clients see when browsing')}
            />
            <QuickActionTile
              to="/professional/priorities"
              icon={Star}
              label={t('pro.jobPriorities', 'Job Priorities')}
              hint={t('pro.jobPrioritiesHint', 'Get more of the work you want')}
            />
            <QuickActionTile
              to="/jobs"
              icon={Briefcase}
              label={t('pro.browseAllJobs')}
              hint={t('pro.browseJobsHint', 'Find work that matches your skills')}
            />
          </div>
        </div>

        {/* COMMUNICATION */}
        <div className="mb-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t('pro.sectionComms', 'Communication')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <QuickActionTile
              to="/messages"
              icon={MessageSquare}
              label={t('pro.messages')}
              hint={t('pro.messagesHint', 'Chat with Askers')}
              badge={stats.unreadMessages}
            />
            <QuickActionTile
              to="/forum"
              icon={MessageCircle}
              label={t('pro.communityForum', 'Community Forum')}
              hint={t('pro.communityForumHint', 'Ask questions, get recommendations')}
            />
          </div>
        </div>

        {/* PROFILE & ACCOUNT */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t('pro.sectionAccount', 'Profile & Account')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <QuickActionTile
              to="/professional/profile"
              icon={User}
              label={t('pro.editProfile')}
              hint={t('pro.editProfileHint', 'Update your Tasker profile')}
            />
            <QuickActionTile
              to="/settings"
              icon={Settings}
              label={t('common.settings', 'Settings')}
              hint={t('pro.settingsHint', 'Account and preferences')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProDashboard;
