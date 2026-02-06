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
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Menu,
  Home,
  Wrench,
  ClipboardList,
  HardHat,
  HelpCircle,
  Mail,
  LayoutDashboard,
  MessageSquare,
  LogOut,
  Users,
  Settings,
  PlusCircle,
} from 'lucide-react';
import { useState } from 'react';

// Public discovery links
const publicNavLinks = [
  { to: '/', labelKey: 'nav.home', icon: Home },
  { to: '/services', labelKey: 'nav.services', icon: Wrench },
  { to: '/jobs', labelKey: 'nav.jobs', icon: ClipboardList },
  { to: '/professionals', labelKey: 'nav.professionals', icon: HardHat },
  { to: '/how-it-works', labelKey: 'nav.howItWorks', icon: HelpCircle },
  { to: '/contact', labelKey: 'nav.contact', icon: Mail },
];

// Hiring lane links (client)
const hiringLinks = [
  { to: '/post', labelKey: 'nav.postJob', icon: PlusCircle },
  { to: '/dashboard/client', labelKey: 'nav.dashboard', icon: LayoutDashboard },
];

// Working lane links (professional)
const workingLinks = [
  { to: '/dashboard/pro', labelKey: 'nav.dashboard', icon: LayoutDashboard },
];

// Shared hub links
const sharedLinks = [
  { to: '/messages', labelKey: 'nav.messages', icon: MessageSquare },
  { to: '/forum', labelKey: 'nav.community', icon: Users },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, activeRole, roles } = useSession();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setOpen(false);
      toast.success(t('toast.signOutSuccess'));
      navigate('/');
    } catch (error) {
      toast.error(t('toast.signOutError'));
    }
  };

  const hasClientRole = roles.includes('client');
  const hasProRole = roles.includes('professional');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-lg">Menu</SheetTitle>
        </SheetHeader>

        {/* PUBLIC DISCOVERY */}
        <nav className="mt-6 flex flex-col gap-1">
          {publicNavLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <link.icon className="h-4 w-4" />
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        {isAuthenticated && (
          <>
            <Separator className="my-4" />

            {/* HIRING LANE - Only if user has client role */}
            {hasClientRole && (
              <>
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('lanes.hiring')}
                </p>
                <nav className="flex flex-col gap-1">
                  {hiringLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <link.icon className="h-4 w-4" />
                      {t(link.labelKey)}
                    </Link>
                  ))}
                </nav>
              </>
            )}

            {/* WORKING LANE - Only if user has professional role */}
            {hasProRole && (
              <>
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3">
                  {t('lanes.working')}
                </p>
                <nav className="flex flex-col gap-1">
                  {workingLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <link.icon className="h-4 w-4" />
                      {t(link.labelKey)}
                    </Link>
                  ))}
                </nav>
              </>
            )}

            {/* SHARED HUB - Where both lanes meet */}
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3">
              {t('lanes.shared')}
            </p>
            <nav className="flex flex-col gap-1">
              {sharedLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <link.icon className="h-4 w-4" />
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>

            {/* Role Switcher for dual-role users */}
            {roles.length > 1 && (
              <>
                <Separator className="my-3" />
                <div className="px-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {t('lanes.switchMode')}
                  </p>
                  <RoleSwitcher className="w-full" />
                </div>
              </>
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
