import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Mobile Floating Action Button for "Post Job"
 * Visible on mobile devices on homepage, job board, services pages
 * Hidden during wizard (/post) and on desktop
 */
export function MobileFAB() {
  const location = useLocation();
  const isMobile = useIsMobile();

  // Hide on desktop
  if (!isMobile) return null;

  // Hide on wizard/post page
  if (location.pathname.startsWith('/post')) return null;

  // Hide on auth pages
  if (location.pathname.startsWith('/auth')) return null;

  // Hide on dashboard pages (they have their own CTAs)
  if (location.pathname.startsWith('/dashboard')) return null;

  // Hide on onboarding pages
  if (location.pathname.startsWith('/onboarding')) return null;

  // Hide on professional pages
  if (location.pathname.startsWith('/professional')) return null;

  // Hide on messages
  if (location.pathname.startsWith('/messages')) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        size="lg" 
        className="h-14 w-14 rounded-full shadow-lg gap-0"
        asChild
      >
        <Link to="/post" aria-label="Post a Job">
          <Plus className="h-6 w-6" />
        </Link>
      </Button>
    </div>
  );
}
