import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLATFORM, MAIN_CATEGORIES } from '@/domain/scope';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * SERVICE CATEGORY PAGE - View subcategories and professionals
 * 
 * TODO: Connect to service_subcategories table
 */

const ServiceCategory = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  
  // Find the category name from slug
  const categoryName = MAIN_CATEGORIES.find(
    cat => cat.toLowerCase().replace(/[^a-z0-9]+/g, '-') === categorySlug
  );

  if (!categoryName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            Category Not Found
          </h1>
          <Button asChild>
            <Link to="/services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Link>
          </Button>
        </div>
      </div>
    );
  }

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

      <div className="container py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link to="/services" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Services
          </Link>
        </div>

        <div className="mb-12">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            {categoryName}
          </h1>
          <p className="text-lg text-muted-foreground">
            Find trusted {categoryName.toLowerCase()} professionals in Ibiza
          </p>
        </div>

        {/* Placeholder for subcategories - will be populated from DB */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subcategories</CardTitle>
            <CardDescription>
              Select a specific service type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Subcategories will be loaded from the database.
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild>
            <Link to="/post">
              Post a {categoryName} Job
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/professionals?category=${categorySlug}`}>
              Browse {categoryName} Professionals
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategory;
