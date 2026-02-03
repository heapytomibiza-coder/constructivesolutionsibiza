import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, BadgeCheck, MessageSquare, Shield } from 'lucide-react';
import { PLATFORM } from '@/domain/scope';

/**
 * PROFESSIONAL DETAILS PAGE
 * 
 * Public page - queries public_professional_details view only.
 * No authentication required for viewing.
 * Construction-grade professional styling.
 */
const ProfessionalDetails = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-sm bg-gradient-steel shadow-md flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">
                {PLATFORM.mark}
              </span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              {PLATFORM.shortName}
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

      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-concrete bg-texture-concrete py-8">
        <div className="container">
          <Button variant="ghost" className="mb-4 gap-2" asChild>
            <Link to="/professionals">
              <ArrowLeft className="h-4 w-4" />
              Back to Professionals
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Verified professional profile</span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Professional details placeholder */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="card-grounded">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-lg bg-primary/10 text-primary rounded-sm">
                      P
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="font-display text-2xl">
                        Professional Profile
                      </CardTitle>
                      <BadgeCheck className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Profile ID: {id}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Professional details will be loaded from public_professional_details view.
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="card-grounded">
              <CardHeader>
                <CardTitle className="font-display text-lg">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Sign in required to contact professionals
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDetails;
