import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PLATFORM } from '@/domain/scope';
import { MobileNav } from '@/components/layout/MobileNav';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
 import { I18nSmokeTest } from '@/components/layout/I18nSmokeTest';
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

export function PublicNav() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, activeRole, roles } = useSession();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t('toast.signOutSuccess'));
      navigate('/');
    } catch (error) {
      toast.error(t('toast.signOutError'));
    }
  };

  const dashboardPath = activeRole === 'professional' ? '/dashboard/pro' : '/dashboard/client';

  return (
    <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        {/* Mobile burger menu + Logo */}
        <div className="flex items-center gap-2">
          <MobileNav />
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-sm bg-gradient-steel flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-display font-bold text-sm">
                {PLATFORM.mark}
              </span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              {PLATFORM.shortName}
            </span>
          </Link>
          <I18nSmokeTest />
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link 
            to="/services" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
          >
            {t('nav.services')}
          </Link>
          <Link 
            to="/jobs" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
          >
            {t('nav.jobs')}
          </Link>
          <Link 
            to="/professionals" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
          >
            {t('nav.professionals')}
          </Link>
          <Link 
            to="/how-it-works" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
          >
            {t('nav.howItWorks')}
          </Link>
          <Link 
            to="/forum" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
          >
            {t('nav.community')}
          </Link>
          <Link 
            to="/contact" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
          >
            {t('nav.contact')}
          </Link>
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
                    <span className="sr-only">User menu</span>
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
