import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Normalizes URLs with duplicate slashes (e.g. //jobs/abc → /jobs/abc).
 * Must be placed inside <BrowserRouter>.
 */
export function UrlNormalizer() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const cleaned = location.pathname.replace(/\/{2,}/g, '/');
    if (cleaned !== location.pathname) {
      navigate(cleaned + location.search + location.hash, { replace: true });
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
}
