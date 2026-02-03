import { Link } from 'react-router-dom';
import { PLATFORM } from '@/domain/scope';

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card py-12 mt-auto">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm bg-gradient-steel shadow-md flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold">
                {PLATFORM.mark}
              </span>
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">
                {PLATFORM.shortName}
              </p>
              <p className="text-sm text-muted-foreground">
                {PLATFORM.tagline}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link to="/how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {PLATFORM.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
