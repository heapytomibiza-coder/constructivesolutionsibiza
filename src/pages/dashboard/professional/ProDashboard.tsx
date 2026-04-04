import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from '@/contexts/SessionContext';
import { useProStats, type DashboardStage } from './hooks/useProStats';
import { RoleSwitcher } from '@/shared/components/layout/RoleSwitcher';
import { MobileRolePill } from '@/shared/components/layout/MobileRolePill';
import { RoleSwitchPanel } from '@/shared/components/layout/RoleSwitchPanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  BarChart3,
  Wrench,
  MessageSquare,
  MessageCircle,
  LogOut,
  Settings,
  ArrowRight,
  User,
  Store,
  ChevronRight,
  Eye,
  CheckCircle2,
  Hammer,
  X,
  Sparkles,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * PROFESSIONAL DASHBOARD
 *
 * State-aware navigation hub — shows guidance card based on
 * dashboardStage and groups menu items by relevance.
 */

interface MenuItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
  badge?: number;
}

function MenuItem({ to, icon: Icon, label, primary, badge }: MenuItemProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150',
        primary
          ? 'bg-primary text-primary-foreground shadow-md hover:opacity-90 active:scale-[0.98]'
          : 'bg-card border border-border/50 hover:border-primary/20 hover:bg-muted/30 active:scale-[0.98]'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', primary ? 'text-primary-foreground' : 'text-primary')} />
      <span className={cn('text-sm font-medium flex-1', primary ? 'text-primary-foreground' : 'text-foreground')}>
        {label}
      </span>
      {badge != null && badge > 0 && (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
          {badge}
        </Badge>
      )}
      <ChevronRight className={cn('h-4 w-4 shrink-0', primary ? 'text-primary-foreground/60' : 'text-muted-foreground/40')} />
    </Link>
  );
}

function MenuGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-4 pb-1">
      {children}
    </p>
  );
}

/* ── Stage guidance cards ── */

interface StageCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  ctaTo: string;
}

function StageCard({ icon, title, description, ctaLabel, ctaTo }: StageCardProps) {
  return (
    <Card className="mb-5 border-primary/30 bg-primary/5 shadow-md">
      <CardContent className="py-4 px-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">{icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-bold text-foreground mb-0.5">{title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{description}</p>
            <Button asChild size="sm">
              <Link to={ctaTo}>
                {ctaLabel}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStageCard(stage: DashboardStage, t: any) {
  switch (stage) {
    case 'needs_profile':
      return (
        <StageCard
          icon={<User className="h-5 w-5 text-primary" />}
          title={t('pro.stage.needsProfileTitle', 'Complete your profile')}
          description={t('pro.stage.needsProfileDesc', 'Add your name and details so clients know who you are.')}
          ctaLabel={t('pro.editProfile')}
          ctaTo="/professional/profile"
        />
      );
    case 'needs_services':
      return (
        <StageCard
          icon={<Wrench className="h-5 w-5 text-primary" />}
          title={t('pro.stage.needsServicesTitle', 'Choose your services')}
          description={t('pro.stage.needsServicesDesc', 'Your services are how we match you to real job requests. No services = no matched jobs.')}
          ctaLabel={t('pro.chooseServices', 'Choose Your Services')}
          ctaTo="/onboarding/professional?step=services"
        />
      );
    case 'needs_review':
      return (
        <StageCard
          icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
          title={t('pro.stage.needsReviewTitle', 'Review and go live')}
          description={t('pro.stage.needsReviewDesc', 'You\'re almost there — finish your setup to start receiving jobs.')}
          ctaLabel={t('pro.stage.finishSetup', 'Finish Setup')}
          ctaTo="/onboarding/professional"
        />
      );
    case 'needs_visibility':
      return (
        <StageCard
          icon={<Eye className="h-5 w-5 text-primary" />}
          title={t('pro.stage.needsVisibilityTitle', 'Turn on visibility')}
          description={t('pro.stage.needsVisibilityDesc', 'Your profile is ready but hidden. Toggle visibility so clients can find you.')}
          ctaLabel={t('pro.stage.goVisible', 'Edit Visibility')}
          ctaTo="/professional/profile"
        />
      );
    case 'active':
      return null; // No guidance needed — pro is fully live
  }
}

const ProDashboard = () => {
  const { t } = useTranslation('dashboard');
  const { user, roles } = useSession();
  const { stats, dashboardStage, bio, tagline, businessName } = useProStats();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const showWelcome = searchParams.get('welcome') === '1';
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  const dismissWelcome = () => {
    setWelcomeDismissed(true);
    setSearchParams((prev) => {
      prev.delete('welcome');
      return prev;
    }, { replace: true });
  };

  // Fetch count of incomplete draft listings for nudge
  const { data: draftCount } = useQuery({
    queryKey: ['pro_draft_listings_count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('service_listings')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', user.id)
        .eq('status', 'draft');
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user?.id && (dashboardStage === 'active' || dashboardStage === 'needs_visibility'),
    staleTime: 120000,
  });

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      toast.error(t('auth.signOutError', 'Log out failed'));
      return;
    }
    toast.success(t('auth.signedOut'));
    navigate('/', { replace: true });
  };

  const isSetupComplete = dashboardStage === 'active' || dashboardStage === 'needs_visibility';
  const hasServices = stats.servicesCount > 0;
  const showWelcomeBanner = showWelcome && !welcomeDismissed;

  // Delayed profile prompt — show only highest priority, only when active + no welcome banner
  const profilePrompt = (() => {
    if (!isSetupComplete || showWelcomeBanner) return null;
    const matchCount = stats.matchedJobsCount;
    if (matchCount >= 1 && (!businessName || !tagline)) {
      return { key: 'prompt1', icon: Sparkles, link: '/onboarding/professional?edit=1&step=basic_info' };
    }
    if (matchCount >= 3 && !bio) {
      return { key: 'prompt2', icon: FileText, link: '/onboarding/professional?edit=1&step=basic_info' };
    }
    if (matchCount >= 5 && businessName && tagline && bio) {
      return { key: 'prompt3', icon: SlidersHorizontal, link: '/onboarding/professional?edit=1&step=services' };
    }
    return null;
  })();

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
              <>
                <MobileRolePill />
                <div className="hidden md:block">
                  <RoleSwitcher className="w-[140px]" />
                </div>
              </>
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

      <div className="container py-5 sm:py-8 max-w-lg">
        {/* Header */}
        <div className="mb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {t('pro.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {t('pro.welcomeBack', { email: user?.email || '' })}
          </p>
        </div>

        <RoleSwitchPanel className="mb-5 md:hidden" />

        {/* Welcome banner — shown after Go Live redirect */}
        {showWelcomeBanner && (
          <Card className="mb-5 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 shadow-md relative">
            <CardContent className="py-4 px-4">
              <button
                onClick={dismissWelcome}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/40 p-2 shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-display text-sm font-bold text-foreground mb-0.5">
                    {t('pro.welcomeTitle', "You're live!")}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t('pro.welcomeBody')}
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/dashboard/pro/jobs">
                      {t('pro.welcomeCta', 'View Matching Jobs')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage guidance card */}
        {getStageCard(dashboardStage, t)}

        {/* Delayed profile prompt — one at a time, highest priority */}
        {profilePrompt && (
          <Card className="mb-5 border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="py-4 px-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  {(() => { const Icon = profilePrompt.icon; return <Icon className="h-5 w-5 text-primary" />; })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-sm font-bold text-foreground mb-0.5">
                    {t(`pro.${profilePrompt.key}Title`)}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t(`pro.${profilePrompt.key}Body`)}
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to={profilePrompt.link}>
                      {t(`pro.${profilePrompt.key}Cta`)}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Draft listings nudge — shown when pro is active but has unpublished listings */}
        {isSetupComplete && !!draftCount && draftCount > 0 && (
          <Card className="mb-5 border-accent/30 bg-accent/5 shadow-sm">
            <CardContent className="py-4 px-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-accent/10 p-2 shrink-0">
                  <Store className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-sm font-bold text-foreground mb-0.5">
                    {t('pro.draftNudgeTitle', 'You have {{count}} unpublished listing', { count: draftCount })}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {t('pro.draftNudgeDesc', 'Add a title, description and price to each listing so clients can find and book you in the marketplace.')}
                  </p>
                  <Button asChild size="sm">
                    <Link to="/dashboard/pro/listings">
                      {t('pro.completeListings', 'Complete Your Listings')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu — grouped by context */}
        <div className="flex flex-col gap-2">
          {/* Get Started — visible while setup is incomplete */}
          {!isSetupComplete && (
            <>
              <MenuGroupLabel>{t('pro.menuGroup.getStarted', 'Get Started')}</MenuGroupLabel>
              <MenuItem to="/professional/profile" icon={User} label={t('pro.editProfile')} primary />
              {dashboardStage !== 'needs_profile' && (
                <MenuItem to="/onboarding/professional?step=services" icon={Wrench} label={t('pro.chooseServices', 'Choose Your Services')} />
              )}
            </>
          )}

          {/* Your Work — visible once services exist */}
          {hasServices && (
            <>
              <MenuGroupLabel>{t('pro.menuGroup.yourWork', 'Your Work')}</MenuGroupLabel>
              {isSetupComplete && (
                <MenuItem to="/professional/profile" icon={User} label={t('pro.editProfile')} primary />
              )}
              <MenuItem to="/jobs" icon={Briefcase} label={t('pro.browseMatchingJobs', 'Browse Matching Jobs')} />
              <MenuItem to="/dashboard/professional/jobs" icon={Hammer} label={t('pro.myJobs', 'My Jobs')} />
              <MenuItem to="/messages" icon={MessageSquare} label={t('pro.messages')} badge={stats.unreadMessages} />
              <MenuItem to="/professional/listings" icon={Store} label={t('pro.myListings', 'My Listings')} />
            </>
          )}

          {/* Grow — visible once active */}
          {isSetupComplete && (
            <>
              <MenuGroupLabel>{t('pro.menuGroup.grow', 'Grow')}</MenuGroupLabel>
              <MenuItem to="/professional/insights" icon={BarChart3} label={t('pro.myInsights', 'My Insights')} />
              <MenuItem to="/forum" icon={MessageCircle} label={t('pro.forumHelp', 'Community Forum & Help')} />
            </>
          )}

          {/* Account — always visible */}
          <MenuGroupLabel>{t('pro.menuGroup.account', 'Account')}</MenuGroupLabel>
          <MenuItem to="/settings" icon={Settings} label={t('common.settings', 'Settings')} />
        </div>

        {/* Empty matched jobs state — below menu when active but no matches */}
        {isSetupComplete && stats.matchedJobsCount === 0 && (
          <Card className="mt-5 border-border/50 bg-muted/30">
            <CardContent className="py-6 px-4 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <h3 className="font-display text-sm font-semibold text-foreground mb-1">
                {t('pro.emptyMatchedTitle', 'No matching jobs yet')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('pro.emptyMatchedBody')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProDashboard;
