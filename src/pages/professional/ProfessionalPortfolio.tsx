import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLATFORM } from '@/domain/scope';
import { Image, Plus, ArrowLeft } from 'lucide-react';

/**
 * PROFESSIONAL PORTFOLIO PAGE - Showcase past work
 * 
 * TODO: Implement portfolio with:
 * - Photo uploads to storage
 * - Project descriptions
 * - Before/after comparisons
 */

const ProfessionalPortfolio = () => {
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
              {PLATFORM.shortName}
            </span>
          </Link>
        </div>
      </nav>

      <div className="container py-12">
        <div className="mb-8">
          <Link to="/onboarding/professional" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Onboarding
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Your Portfolio
          </h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Image className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>No portfolio items yet</CardTitle>
                <CardDescription>
                  Showcase your past work to attract more clients
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload photos of your completed projects to build trust with potential clients.
              Before and after photos work particularly well.
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Project
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfessionalPortfolio;
