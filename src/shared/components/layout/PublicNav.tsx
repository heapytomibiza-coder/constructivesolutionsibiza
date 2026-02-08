import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PLATFORM } from '@/domain/scope';
import { MobileNav } from './MobileNav';
import { RoleSwitcher } from './RoleSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LayoutDashboard, MessageSquare, LogOut } from 'lucide-react';

import { getVisibleNavModel, getDashboardPath, type RouteConfig } from '@/app/routes';

/**
 * Desktop nav link - renders from route config
 */
function DesktopNavLink({ route }: { route: RouteConfig }) {
  const { t } = useTranslation();
  if (!route.nav) return null;

  return (
    <Link 
      to={route.path}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
    >
      {t(route.nav.labelKey)}
    </Link>
  );
}

export function PublicNav() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, activeRole, roles } = useSession();

  // Derive nav from registry
  const navModel = useMemo(
    () => getVisibleNavModel({ isAuthenticated, roles, activeRole }),
    [isAuthenticated, roles, activeRole]
  );

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t('toast.signOutSuccess'));
      navigate('/');
    } catch {
      toast.error(t('toast.signOutError'));
    }
  };

  const dashboardPath = getDashboardPath(activeRole);

  // Desktop top links = public discovery + shared (forum/community)
  const desktopRoutes = useMemo(() => {
    const publicRoutes = navModel.public ?? [];
    const sharedRoutes = navModel.shared ?? [];
    // For desktop, we show public discovery links in the main nav
    // Skip 'home' from desktop nav (logo handles that)
    return [...publicRoutes.filter(r => r.path !== '/'), ...sharedRoutes];
  }, [navModel]);

  return (
    <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        {/* Mobile burger menu + Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <MobileNav />
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-9 w-9 rounded-sm bg-gradient-steel flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-display font-bold text-sm">
                {PLATFORM.mark}
              </span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground hidden xs:inline">
              {PLATFORM.shortName}
            </span>
          </Link>
        </div>

        {/* Desktop nav links - derived from registry */}
        <div className="hidden md:flex items-center gap-6">
          {desktopRoutes.map((route) => (
            <DesktopNavLink key={route.path} route={route} />
          ))}
        </div>

        {/* Right side: Auth or User menu */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          
          {isAuthenticated ? (
            <>
              {/* Role switcher for desktop (multi-role users) */}
              {roles.length > 1 && (
                <div className="hidden md:block">
                  <RoleSwitcher className="w-[140px]" />
                </div>
              )}

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex">
                    <User className="h-5 w-5" />
                    <span className="sr-only">{t('nav.userMenu')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={dashboardPath} className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      {t('nav.dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t('nav.messages')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Post a job button (always visible) */}
              <Button variant="accent" asChild className="hidden sm:inline-flex">
                <Link to="/post">{t('nav.postJob')}</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to="/auth">{t('nav.signIn')}</Link>
              </Button>
              <Button variant="accent" asChild>
                <Link to="/post">{t('nav.postJob')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
