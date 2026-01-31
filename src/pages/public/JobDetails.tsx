import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, DollarSign, User } from 'lucide-react';

/**
 * JOB DETAILS PAGE
 * 
 * Public page - queries public_job_details view only.
 * No authentication required for viewing.
 */
const JobDetails = () => {
  const { id } = useParams();

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

      <div className="container py-8">
        {/* Back button */}
        <Button variant="ghost" className="mb-6 gap-2" asChild>
          <Link to="/job-board">
            <ArrowLeft className="h-4 w-4" />
            Back to Job Board
          </Link>
        </Button>

        {/* Job details placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="outline" className="mb-2">Open</Badge>
                <CardTitle className="font-display text-2xl">
                  Job Details
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Job ID: {id}
                </p>
              </div>
              <Button>Apply Now</Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Job details will be loaded from public_job_details view.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobDetails;
