/**
 * POST JOB PAGE
 * 
 * Thin launcher that mounts CanonicalJobWizard.
 * All step logic lives in the wizard component.
 * Construction-grade professional styling.
 * 
 * Route: /post
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CanonicalJobWizard } from '@/components/wizard/canonical/CanonicalJobWizard';
import { PLATFORM } from '@/domain/scope';

const PostJob = () => {
  return (
    <div className="min-h-screen bg-gradient-hero bg-texture-concrete">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-sm bg-gradient-steel shadow-md flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">
                {PLATFORM.mark}
              </span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              {PLATFORM.shortName}
            </span>
          </Link>
          
          <Button variant="ghost" asChild>
            <Link to="/">Cancel</Link>
          </Button>
        </div>
      </nav>

      {/* Wizard Container */}
      <div className="container py-8">
        <div className="mx-auto max-w-2xl">
          <CanonicalJobWizard />
        </div>
      </div>
    </div>
  );
};

export default PostJob;
