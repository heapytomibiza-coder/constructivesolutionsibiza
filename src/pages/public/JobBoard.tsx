import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Calendar, DollarSign } from 'lucide-react';

/**
 * JOB BOARD PAGE
 * 
 * Public page - queries public_jobs_preview view only.
 * No authentication required.
 */
const JobBoard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
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
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button variant="default" asChild>
              <Link to="/post">Post a Job</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="border-b border-border bg-gradient-hero py-12">
        <div className="container">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            Job Board
          </h1>
          <p className="text-muted-foreground max-w-2xl mb-6">
            Browse open opportunities from clients looking for professional services in Ibiza.
          </p>
          
          {/* Search */}
          <div className="flex gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search jobs..." 
                className="pl-10"
              />
            </div>
            <Button>Search</Button>
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="container py-8">
        <div className="grid gap-4">
          {/* Empty state for now */}
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No open jobs at the moment. Check back soon!
              </p>
              <Button variant="outline" asChild>
                <Link to="/post">Post the First Job</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobBoard;
