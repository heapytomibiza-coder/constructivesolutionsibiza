import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useState } from 'react';

const publicNavLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/services', label: 'Services', icon: Wrench },
  { to: '/jobs', label: 'Jobs', icon: ClipboardList },
  { to: '/professionals', label: 'Professionals', icon: HardHat },
  { to: '/how-it-works', label: 'How it works', icon: HelpCircle },
  { to: '/contact', label: 'Contact', icon: Mail },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, activeRole, roles } = useSession();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setOpen(false);
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const dashboardPath = activeRole === 'professional' ? '/dashboard/pro' : '/dashboard/client';

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

        <nav className="mt-6 flex flex-col gap-1">
          {publicNavLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <Separator className="my-4" />

        {isAuthenticated ? (
          <div className="flex flex-col gap-1">
            <Link
              to={dashboardPath}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/messages"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>

            {roles.length > 1 && (
              <>
                <Separator className="my-3" />
                <div className="px-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Switch mode</p>
                  <RoleSwitcher className="w-full" />
                </div>
              </>
            )}

            <Separator className="my-3" />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-3">
            <Button variant="outline" asChild className="w-full">
              <Link to="/auth" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </Button>
            <Button variant="accent" asChild className="w-full">
              <Link to="/post" onClick={() => setOpen(false)}>
                Post a job
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
