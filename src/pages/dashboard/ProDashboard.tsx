import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/contexts/SessionContext';
import { useProStats } from './hooks/useProStats';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Wrench,
  MessageSquare,
  LogOut,
  Settings,
  Loader2,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * PROFESSIONAL DASHBOARD
 * 
 * Protected route - requires proReady access
 * (verified + onboarding complete + has services)
 */
const ProDashboard = () => {
  const { user, roles, professionalProfile } = useSession();
  const { stats, matchedJobs, isLoading } = useProStats();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    navigate('/');
  };

  const needsServiceSetup = stats.servicesCount === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-ocean flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">CS</span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              CS Ibiza
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            {roles.length > 1 && (
              <RoleSwitcher className="w-[160px]" />
            )}
            <Button variant="ghost" size="icon" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Professional Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.email}
            </p>
          </div>
          <Button asChild>
            <Link to="/jobs">Browse All Jobs</Link>
          </Button>
        </div>

        {/* Service Setup Alert */}
        {needsServiceSetup && (
          <Card className="mb-6 border-primary">
            <CardHeader>
              <CardTitle className="font-display text-primary">Complete Your Setup</CardTitle>
              <CardDescription>
                Add your services to start receiving matched job opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/professional/service-setup" className="gap-2">
                  <Wrench className="h-4 w-4" />
                  Set Up Services
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Your Services
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.servicesCount}</span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/professional/service-setup">Edit</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Matched Jobs
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-2xl font-bold">{stats.matchedJobsCount}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Messages
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.unreadMessages}</span>
                  {stats.unreadMessages > 0 && (
                    <Badge variant="destructive" className="text-xs">New</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Matched Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display">Matched Jobs</CardTitle>
              <CardDescription>
                Jobs that match your selected services
              </CardDescription>
            </div>
            {matchedJobs.length > 0 && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/jobs?matched=true" className="gap-1">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : needsServiceSetup ? (
              <div className="py-8 text-center">
                <Wrench className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Set up your services to see matched jobs.
                </p>
                <Button asChild>
                  <Link to="/professional/service-setup">Set Up Services</Link>
                </Button>
              </div>
            ) : matchedJobs.length === 0 ? (
              <div className="py-8 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  No matched jobs yet. Check back soon!
                </p>
                <Button variant="outline" asChild>
                  <Link to="/jobs">Browse All Jobs</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {matchedJobs.slice(0, 5).map((job) => (
                  <div 
                    key={job.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate mb-1">{job.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {job.area && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.area}
                          </span>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {job.teaser && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {job.teaser}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/jobs/${job.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProDashboard;
