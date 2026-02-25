import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Normalizes malformed URLs (duplicate slashes and accidental trailing dots).
 * Examples: //jobs/abc → /jobs/abc, /dashboard/admin/monitoring.. → /dashboard/admin/monitoring
 * Must be placed inside <BrowserRouter>.
 */
export function UrlNormalizer() {
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
}
