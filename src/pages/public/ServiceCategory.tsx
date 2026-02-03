import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout';
import { MAIN_CATEGORIES } from '@/domain/scope';
import { ArrowLeft, ArrowRight, Shield } from 'lucide-react';

/**
 * SERVICE CATEGORY PAGE - View subcategories and professionals
 * 
 * TODO: Connect to service_subcategories table
 * Construction-grade professional styling.
 */

const ServiceCategory = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  
  // Find the category name from slug
  const categoryName = MAIN_CATEGORIES.find(
    cat => cat.toLowerCase().replace(/[^a-z0-9]+/g, '-') === categorySlug
  );

  if (!categoryName) {
    return (
      <PublicLayout>
        <div className="container py-20 text-center">
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
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-concrete bg-texture-concrete py-12">
        <div className="container">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link 
              to="/services" 
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Services
            </Link>
          </div>

          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            {categoryName}
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Find trusted {categoryName.toLowerCase()} professionals in Ibiza
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Verified professionals only</span>
          </div>
        </div>
      </div>

      <div className="container py-12">
        {/* Placeholder for subcategories - will be populated from DB */}
        <Card className="mb-8 card-grounded">
          <CardHeader>
            <CardTitle className="font-display">Subcategories</CardTitle>
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
    </PublicLayout>
  );
};

export default ServiceCategory;
