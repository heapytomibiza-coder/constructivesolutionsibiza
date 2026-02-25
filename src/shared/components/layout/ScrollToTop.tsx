import { forwardRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to top of page on route change.
 * Wrapped in forwardRef to silence React Router ref warnings.
 */
export const ScrollToTop = forwardRef<HTMLDivElement>(function ScrollToTop(_props, _ref) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
});
