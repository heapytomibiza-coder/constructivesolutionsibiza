import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useSession } from '@/contexts/SessionContext';
import { RoleSwitcher } from './RoleSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Menu, LogOut, MessageSquare } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useConversations } from '@/pages/messages/hooks';

import type { NavSection, RouteConfig } from '@/app/routes';
import { 
  getVisibleNavModel, 
  getVisibleSections, 
  getDashboardPath,
  SECTION_LABELS,
} from '@/app/routes';

/**
 * Section heading for mobile nav
 */
function SectionHeading({ labelKey }: { labelKey: string }) {
  const { t } = useTranslation();
  return (
    <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {t(labelKey)}
    </p>
  );
}

/**
 * Nav item rendered from route config
 */
function NavItem({
  route,
  onClick,
}: {
  route: RouteConfig;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  if (!route.nav) return null;

  return (
    <Link
      to={route.path}
      onClick={onClick}
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {t(route.nav.labelKey)}
    </Link>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, activeRole, roles, user } = useSession();

  // Get visible nav from registry
  const navModel = useMemo(
    () => getVisibleNavModel({ isAuthenticated, roles, activeRole, userEmail: user?.email }),
    [isAuthenticated, roles, activeRole, user?.email]
  );

  const visibleSections = useMemo(
    () => getVisibleSections({ isAuthenticated, roles, activeRole }),
    [isAuthenticated, roles, activeRole]
  );

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setOpen(false);
      toast.success(t('toast.signOutSuccess'));
      navigate('/');
    } catch {
      toast.error(t('toast.signOutError'));
    }
  };

  const dashboardPath = getDashboardPath(activeRole);

  const renderSection = (section: NavSection) => {
    const routes = navModel[section];
    
    // Skip empty sections
    if (!routes || routes.length === 0) return null;

    const labelKey = SECTION_LABELS[section];

    return (
      <div key={section} className="mb-2">
        {/* Show heading for lane sections, not for public */}
        {section !== 'public' && <SectionHeading labelKey={labelKey} />}
        <nav className="flex flex-col gap-1">
          {routes.map((route) => (
            <NavItem 
              key={route.path} 
              route={route} 
              onClick={() => setOpen(false)} 
            />
          ))}
        </nav>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t('nav.openMenu')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-lg">{t('nav.menu')}</SheetTitle>
        </SheetHeader>

        {/* Render all visible sections from registry */}
        <div className="mt-6">
          {visibleSections.map((section) => renderSection(section))}
        </div>

        {isAuthenticated && (
          <>
            <Separator className="my-3" />

            {/* Quick dashboard shortcut */}
            <div className="px-3 mb-2">
              <Link
                to={dashboardPath}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted transition-colors"
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                to="/messages"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-1"
              >
                <MessageSquare className="h-4 w-4" />
                {t('nav.messages')}
              </Link>
            </div>

            {/* Role Switcher for dual-role users */}
            {roles.length > 1 && (
              <div className="px-3 py-2">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {t('lanes.switchMode')}
                </p>
                <RoleSwitcher className="w-full" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('lanes.switchModeHint')}
                </p>
              </div>
            )}

            <Separator className="my-3" />

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              {t('nav.signOut')}
            </button>
          </>
        )}

        {/* Not authenticated - Show sign in + post job */}
        {!isAuthenticated && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-col gap-2 px-3">
              <Button variant="outline" asChild className="w-full">
                <Link to="/auth" onClick={() => setOpen(false)}>
                  {t('nav.signIn')}
                </Link>
              </Button>
              <Button variant="accent" asChild className="w-full">
                <Link to="/post" onClick={() => setOpen(false)}>
                  {t('nav.postJob')}
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
