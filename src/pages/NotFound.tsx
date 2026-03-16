import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { PublicLayout } from "@/shared/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If the path has double slashes, redirect to cleaned path instead of showing 404
    const cleaned = location.pathname.replace(/\/{2,}/g, '/');
    if (cleaned !== location.pathname) {
      navigate(cleaned + location.search + location.hash, { replace: true });
      return;
    }
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname, location.search, location.hash, navigate]);

  return (
    <PublicLayout>
      <div className="flex flex-1 items-center justify-center py-24 px-4">
        <div className="text-center max-w-md space-y-6">
          <h1 className="text-7xl font-display font-bold text-primary">404</h1>
          <p className="text-xl text-muted-foreground">
            Sorry, we couldn't find that page.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/services">
                <Search className="mr-2 h-4 w-4" />
                Browse Services
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default NotFound;
