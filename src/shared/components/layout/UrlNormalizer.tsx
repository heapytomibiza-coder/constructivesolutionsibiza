import { forwardRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Normalizes malformed URLs (duplicate slashes and accidental trailing dots).
 * Wrapped in forwardRef to silence React Router ref warnings.
 */
export const UrlNormalizer = forwardRef<HTMLDivElement>(function UrlNormalizer(_props, _ref) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const collapsedSlashes = location.pathname.replace(/\/{2,}/g, '/');
    const cleaned = collapsedSlashes.replace(/\.+$/g, '') || '/';

    if (cleaned !== location.pathname) {
      navigate(cleaned + location.search + location.hash, { replace: true });
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
});
