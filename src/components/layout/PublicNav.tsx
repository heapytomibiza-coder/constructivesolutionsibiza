import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PLATFORM } from '@/domain/scope';

export function PublicNav() {
  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-ocean flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">
              {PLATFORM.mark}
            </span>
          </div>
          <span className="font-display text-xl font-semibold text-foreground">
            {PLATFORM.shortName}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Services
          </Link>
          <Link to="/professionals" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Professionals
          </Link>
          <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How it works
          </Link>
          <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button variant="default" asChild>
            <Link to="/post">Post a job</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
