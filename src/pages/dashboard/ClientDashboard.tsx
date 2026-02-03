import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/contexts/SessionContext';
import { useClientStats } from './hooks/useClientStats';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  FileText, 
  MessageSquare,
  LogOut,
  Settings,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * CLIENT DASHBOARD
 * 
 * Protected route - requires role:client
 * Shows user's jobs and real stats.
 */
const ClientDashboard = () => {
  const { user, roles } = useSession();
  const { stats, jobs, isLoading } = useClientStats();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    navigate('/');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'in_progress':
        return 'outline';
      case 'completed':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-sm bg-gradient-steel flex items-center justify-center shadow-sm">
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
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.email}
            </p>
          </div>
          <Button className="gap-2" asChild>
            <Link to="/post">
              <Plus className="h-4 w-4" />
              Post a Job
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Jobs
              </CardTitle>
              <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{stats.activeJobs}</div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Draft Jobs
              </CardTitle>
              <div className="h-10 w-10 rounded-sm bg-secondary flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{stats.draftJobs}</div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Messages
              </CardTitle>
              <div className="h-10 w-10 rounded-sm bg-accent/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-foreground">{stats.unreadMessages}</span>
                  {stats.unreadMessages > 0 && (
                    <Badge variant="destructive" className="text-xs">New</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-display">Your Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-14 w-14 rounded-sm bg-muted flex items-center justify-center mb-4">
                  <Briefcase className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  You haven't posted any jobs yet.
                </p>
                <Button asChild>
                  <Link to="/post">Post Your First Job</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div 
                    key={job.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/70 bg-card hover:bg-muted/50 hover:border-accent/30 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                          {job.title}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {job.category && job.subcategory 
                          ? `${job.category} → ${job.subcategory}` 
                          : 'Uncategorized'}
                        {' · '}
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </p>
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

export default ClientDashboard;
