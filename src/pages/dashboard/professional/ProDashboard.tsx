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
  Store
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PendingReviewsCard } from '@/pages/dashboard/shared/components/PendingReviewsCard';
import { cn } from '@/lib/utils';

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

        {/* Service Setup Alert */}
        {needsServiceSetup && (
          <Card className="mb-5 border-accent bg-accent/5">
            <CardContent className="py-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-accent">{t('pro.completeSetup')}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{t('pro.setupDescription')}</p>
              </div>
              <Button variant="accent" size="sm" asChild className="shrink-0">
                <Link to="/onboarding/professional?step=services">
                  <Wrench className="h-4 w-4 mr-1.5" />
                  Setup
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Compact Stats Row — 3 across on mobile */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
          <Link
            to="/onboarding/professional?edit=1&step=services"
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
                <p className="text-xs text-muted-foreground mt-0.5">{t('pro.yourServices')}</p>
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
            to="/professional/listings"
            icon={Store}
            label={t('pro.myListings', 'My Listings')}
          />
          <QuickActionTile
            to="/onboarding/professional?edit=1&step=services"
            icon={Wrench}
            label={t('pro.updateServices')}
          />
          <QuickActionTile
            to="/professional/priorities"
            icon={Star}
            label={t('pro.setJobPriorities', 'Job Priorities')}
          />
          <QuickActionTile
            to="/professional/profile"
            icon={User}
            label={t('pro.editProfile')}
          />
        </div>

        {/* Two-Column Layout */}
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          {/* Left Column: Matched Jobs */}
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
                    <Link to="/onboarding/professional?step=services">{t('pro.setUpServices')}</Link>
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
                  {matchedJobs.slice(0, 5).map((job) => (
                    <Link
                      key={job.id}
                      to={`/jobs/${job.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-card hover:bg-muted/50 hover:border-accent/30 transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {job.area && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {job.area}
                            </span>
                          )}
                          <span>
                            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Quick Actions (desktop) + Status + Pending Reviews */}
          <div className="space-y-4">
            {/* Pending Reviews */}
            <PendingReviewsCard />
            
            {/* Quick Actions — desktop only */}
            <Card className="border-border/70 hidden sm:block">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium">{t('pro.quickActions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 px-4 pb-4">
                <Button className="w-full justify-start gap-2 h-10" asChild>
                  <Link to="/professional/listings">
                    <Store className="h-4 w-4" />
                    {t('pro.myListings', 'My Listings')}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 h-10" asChild>
                  <Link to="/onboarding/professional?edit=1&step=services">
                    <Wrench className="h-4 w-4" />
                    {t('pro.updateServices')}
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
        </div>
      </div>
    </div>
  );
};

/* ── Mobile Quick Action Tile ── */
function QuickActionTile({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2.5 p-3 rounded-lg border border-border/70 bg-card',
        'hover:border-primary/30 hover:bg-muted/30 transition-colors',
        'active:scale-[0.98] active:bg-muted/50',
        'min-h-[48px]'
      )}
    >
      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground leading-tight">{label}</span>
    </Link>
  );
}

export default ProDashboard;
