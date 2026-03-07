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
import { cn } from '@/lib/utils';
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
  Star,
  Store,
  ListChecks,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * PROFESSIONAL DASHBOARD
 * 
 * Clean navigation hub — flat menu, easy to scan.
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

        {/* Services-First Guidance — only when no services */}
        {needsServiceSetup && (
          <Card className="mb-5 border-primary bg-primary/5 shadow-md">
            <CardContent className="py-4 px-4">
              <h3 className="font-display text-sm font-bold text-foreground mb-1">
                {t('pro.servicesFirstTitle', 'Start with your services — it\'s how you get work')}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {t('pro.servicesFirstDesc')}
              </p>
              <Button asChild size="sm">
                <Link to="/onboarding/professional?step=services">
                  <Wrench className="h-4 w-4 mr-2" />
                  {t('pro.chooseServices', 'Choose Your Services')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Menu */}
        <div className="flex flex-col gap-2">
          <MenuItem to="/professional/profile" icon={User} label={t('pro.editProfile')} primary />
          <MenuItem to="/messages" icon={MessageSquare} label={t('pro.messages')} badge={stats.unreadMessages} />
          <MenuItem to="/jobs" icon={Briefcase} label={t('pro.browseMatchingJobs', 'Browse Matching Jobs')} />
          <MenuItem to="/professional/listings" icon={Store} label={t('pro.createServicePages', 'Create Service Pages')} />
          <MenuItem to="/professional/insights" icon={BarChart3} label={t('pro.myInsights', 'My Insights')} />
          <MenuItem to="/settings" icon={Settings} label={t('common.settings', 'Settings')} />
          <MenuItem to="/forum" icon={MessageCircle} label={t('pro.forumHelp', 'Community Forum & Help')} />
        </div>
      </div>
    </div>
  );
};

export default ProDashboard;
