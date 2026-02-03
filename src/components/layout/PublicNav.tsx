import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PLATFORM } from '@/domain/scope';

export function PublicNav() {
  return (
    <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
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

        <div className="hidden md:flex items-center gap-6">
          <Link 
            to="/services" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
          >
            Services
          </Link>
          <Link 
            to="/jobs" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
          >
            Jobs
          </Link>
          <Link 
            to="/professionals" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
          >
            Professionals
          </Link>
          <Link 
            to="/how-it-works" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
          >
            How it works
          </Link>
          <Link 
            to="/contact" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:after:w-full"
          >
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button variant="accent" asChild>
            <Link to="/post">Post a job</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
