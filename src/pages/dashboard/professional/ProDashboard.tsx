import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  LogOut,
  Settings,
  Loader2,
  ArrowRight,
  MapPin,
  User,
  Star,
  ChevronRight,
  Store,
  Clock,
  ListChecks
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/dateLocale';
import { PendingReviewsCard } from '@/pages/dashboard/shared/components/PendingReviewsCard';
import { cn } from '@/lib/utils';
import { QuickActionTile } from '@/pages/dashboard/shared/components/QuickActionTile';
import { MessageCircle, DollarSign } from 'lucide-react';
import { txCategory } from '@/i18n/taxonomyTranslations';

/**
 * PROFESSIONAL DASHBOARD
 * 
 * Protected route - requires proReady access
 * Mobile-first: compact stats, prominent quick actions, clean hierarchy
 */
const ProDashboard = () => {
  const { t } = useTranslation('dashboard');
  const { user, roles, professionalProfile } = useSession();
  const { stats, matchedJobs, isLoading } = useProStats();
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

      <div className="container py-5 sm:py-8">
        {/* Header — compact on mobile */}
        <div className="flex items-start justify-between mb-5 gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {t('pro.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {user?.email || ''}
            </p>
          </div>
          <Button size="sm" asChild className="shrink-0 hidden sm:flex">
            <Link to="/jobs">{t('pro.browseAllJobs')}</Link>
          </Button>
        </div>

        {/* Services-First Guidance — prominent when no services */}
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
                    {t('pro.servicesFirstDesc', 'Your services are how we match you to real job requests from clients on the island. No services = no matched jobs landing in your dashboard.')}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('pro.servicesFirstWhy', 'Your profile matters too, but services come first — they\'re the engine that drives leads to you. You can polish your profile later.')}
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

        {/* Compact Stats Row — 3 across on mobile */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
          <Link
            to="/professional/listings"
            className="group"
          >
            <Card className="border-border/70 h-full transition-colors group-hover:border-primary/30">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1">
                  <Wrench className="h-4 w-4 text-primary" />
                  <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-1" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.servicesCount}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{t('pro.myServices', 'My Services')}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-tight hidden sm:block">{t('pro.myServicesHint', 'Types of work you accept')}</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/jobs?matched=true" className="group">
            <Card className="border-border/70 h-full transition-colors group-hover:border-success/30">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1">
                  <Briefcase className="h-4 w-4 text-success" />
                  <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-1" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.matchedJobsCount}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{t('pro.matchedJobs')}</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/messages" className="group">
            <Card className="border-border/70 h-full transition-colors group-hover:border-accent/30">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  {stats.unreadMessages > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">{stats.unreadMessages}</Badge>
                  )}
                </div>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-1" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.unreadMessages}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{t('pro.messages')}</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions — visible on mobile before matched jobs */}
        <div className="grid grid-cols-2 gap-2 mb-5 sm:hidden">
          <QuickActionTile
            to="/onboarding/professional?edit=1&step=services"
            icon={ListChecks}
            label={t('pro.editMyServices', 'Edit My Services')}
            hint={t('pro.editMyServicesHint', 'Add or remove the jobs you accept')}
          />
          <QuickActionTile
            to="/professional/listings"
            icon={Store}
            label={t('pro.myPublicAds', 'My Public Ads')}
            hint={t('pro.myPublicAdsHint', 'What clients see when browsing')}
          />
          <QuickActionTile
            to="/professional/priorities"
            icon={Star}
            label={t('pro.jobPriorities', 'Job Priorities')}
            hint={t('pro.jobPrioritiesHint', 'Get more of the work you want')}
          />
          <QuickActionTile
            to="/professional/profile"
            icon={User}
            label={t('pro.editProfile')}
            hint={t('pro.editProfileHint', 'Update your Tasker profile')}
          />
          <QuickActionTile
            to="/messages"
            icon={MessageSquare}
            label={t('pro.messages')}
            hint={t('pro.messagesHint', 'Chat with Askers')}
          />
          <QuickActionTile
            to="/forum"
            icon={MessageCircle}
            label={t('pro.communityForum', 'Community Forum')}
            hint={t('pro.communityForumHint', 'Ask questions, get recommendations')}
          />
        </div>

        {/* Two-Column Layout — Actions first (left), Matched Jobs second (right) */}
        <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          {/* Left Column: Quick Actions (desktop) + Status + Pending Reviews */}
          <div className="space-y-4 hidden sm:block">
            {/* Pending Reviews */}
            <PendingReviewsCard />
            
            {/* Quick Actions — desktop only */}
            <Card className="border-border/70">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium">{t('pro.manageYourWork', 'Manage Your Work')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 px-4 pb-4">
                <Button className="w-full justify-start gap-2 h-10" asChild>
                  <Link to="/onboarding/professional?edit=1&step=services">
                    <ListChecks className="h-4 w-4" />
                    {t('pro.editMyServices', 'Edit My Services')}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 h-10" asChild>
                  <Link to="/professional/listings">
                    <Store className="h-4 w-4" />
                    {t('pro.myPublicAds', 'My Public Ads')}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 h-10" asChild>
                  <Link to="/professional/priorities">
                    <Star className="h-4 w-4" />
                    {t('pro.jobPriorities', 'Job Priorities')}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 h-10" asChild>
                  <Link to="/professional/profile">
                    <User className="h-4 w-4" />
                    {t('pro.editProfile')}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 h-10" asChild>
                  <Link to="/messages">
                    <MessageSquare className="h-4 w-4" />
                    {t('pro.viewMessages')}
                    {stats.unreadMessages > 0 && (
                      <Badge variant="destructive" className="ml-auto text-xs">
                        {stats.unreadMessages}
                      </Badge>
                    )}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 h-10" asChild>
                  <Link to="/forum">
                    <MessageCircle className="h-4 w-4" />
                    {t('pro.communityForum', 'Community Forum')}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Profile Status */}
            <Card className="border-border/70">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium">{t('pro.profileStatus')}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('pro.servicesAdded')}</span>
                    <span className="font-medium">{stats.servicesCount > 0 ? '✓' : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('pro.profileDetails')}</span>
                    <span className="font-medium text-muted-foreground">—</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('pro.publiclyVisible')}</span>
                    <span className="font-medium">{professionalProfile?.isPubliclyListed ? '✓' : '—'}</span>
                  </div>
                </div>
                {(stats.servicesCount === 0 || !professionalProfile?.isPubliclyListed) && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t('pro.addServicesHint')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Matched Jobs */}
          <Card className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
              <div>
                <CardTitle className="font-display text-lg">{t('pro.matchedJobs')}</CardTitle>
                <CardDescription className="text-sm">
                  {t('pro.matchedJobsDesc')}
                </CardDescription>
              </div>
              {matchedJobs.length > 0 && (
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link to="/jobs?matched=true" className="gap-1 text-xs">
                    {t('pro.viewAll')}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : needsServiceSetup ? (
                <div className="py-6 text-center">
                  <div className="mx-auto h-12 w-12 rounded-sm bg-muted flex items-center justify-center mb-3">
                    <Wrench className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('pro.setUpServicesToSee')}
                  </p>
                  <Button size="sm" asChild>
                    <Link to="/professional/listings">{t('pro.setUpServices')}</Link>
                  </Button>
                </div>
              ) : matchedJobs.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="mx-auto h-12 w-12 rounded-sm bg-muted flex items-center justify-center mb-3">
                    <Briefcase className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('pro.noMatchedJobs')}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/jobs">{t('pro.browseAllJobs')}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {matchedJobs.slice(0, 5).map((job) => {
                    const budgetLabel = job.budget_min && job.budget_max
                      ? `€${job.budget_min}–€${job.budget_max}`
                      : job.budget_value
                        ? `€${job.budget_value}`
                        : job.budget_type === 'tbd'
                          ? t('client.budgetTbd', 'Quote-based')
                          : null;

                    return (
                      <Link
                        key={job.id}
                        to={`/jobs/${job.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-card hover:bg-muted/50 hover:border-accent/30 transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                          </div>
                          {job.teaser && (
                            <p className="text-xs text-muted-foreground truncate mb-1">
                              {job.teaser.length > 100 ? job.teaser.slice(0, 100) + '…' : job.teaser}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                            {job.category && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                {txCategory(job.category, t) ?? job.category}
                              </Badge>
                            )}
                            {job.area && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {job.area}
                              </span>
                            )}
                            {budgetLabel && (
                              <span className="flex items-center gap-0.5">
                                <DollarSign className="h-3 w-3" />
                                {budgetLabel}
                              </span>
                            )}
                            {job.start_timing && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {t(`client.timing.${job.start_timing}`) !== `client.timing.${job.start_timing}`
                                  ? t(`client.timing.${job.start_timing}`)
                                  : job.start_timing.replace(/_/g, ' ')}
                              </span>
                            )}
                            <span>
                              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: getDateLocale() })}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProDashboard;
