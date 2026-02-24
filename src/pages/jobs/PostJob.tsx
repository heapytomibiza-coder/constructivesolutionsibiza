/**
 * POST JOB PAGE
 * 
 * Thin launcher that mounts CanonicalJobWizard.
 * All step logic lives in the wizard component.
 * Construction-grade professional styling with subtle photo backdrop.
 * 
 * Route: /post
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CanonicalJobWizard } from '@/features/wizard/canonical/CanonicalJobWizard';
import { PLATFORM } from '@/domain/scope';
import heroPost from '@/assets/heroes/hero-post.jpg';

const PostJob = () => {
  const { t } = useTranslation('wizard');
  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroPost})` }}
      />
      
      {/* Light Overlay */}
      <div className="fixed inset-0 bg-background/85 backdrop-blur-[2px]" />
      
      {/* Content */}
      <div className="relative z-10">
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
              <Link to="/">{t('buttons.cancel')}</Link>
            </Button>
          </div>
        </nav>

        {/* Wizard Container - extra horizontal padding on small screens */}
        <div className="container py-6 md:py-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl pb-24 md:pb-0">
            <CanonicalJobWizard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
