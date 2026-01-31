import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ArrowRight } from 'lucide-react';

/**
 * POST SUCCESS PAGE
 * 
 * Shown after successfully publishing a job.
 */
const PostSuccess = () => {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
            Job Posted Successfully!
          </h1>
          <p className="text-muted-foreground mb-6">
            Professionals will start reviewing your job and sending proposals soon.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/dashboard/client">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/job-board">View Job Board</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostSuccess;
