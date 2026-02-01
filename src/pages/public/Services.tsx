import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLATFORM, MAIN_CATEGORIES } from '@/domain/scope';
import { 
  Hammer, Wrench, Droplets, Zap, Wind, Paintbrush, 
  Sparkles, TreePine, Waves, PenTool, Truck, 
  ChefHat, DoorOpen, Settings, Building2, FileCheck,
  ArrowRight
} from 'lucide-react';

/**
 * SERVICES PAGE - Browse all service categories
 * 
 * SCOPE: Construction & property services ONLY.
 */

const categoryIcons: Record<string, React.ReactNode> = {
  'Construction': <Hammer className="h-6 w-6" />,
  'Carpentry': <Wrench className="h-6 w-6" />,
  'Plumbing': <Droplets className="h-6 w-6" />,
  'Electrical': <Zap className="h-6 w-6" />,
  'HVAC': <Wind className="h-6 w-6" />,
  'Painting & Decorating': <Paintbrush className="h-6 w-6" />,
  'Cleaning': <Sparkles className="h-6 w-6" />,
  'Gardening & Landscaping': <TreePine className="h-6 w-6" />,
  'Pool & Spa': <Waves className="h-6 w-6" />,
  'Architects & Design': <PenTool className="h-6 w-6" />,
  'Transport & Logistics': <Truck className="h-6 w-6" />,
  'Kitchen & Bathroom': <ChefHat className="h-6 w-6" />,
  'Floors, Doors & Windows': <DoorOpen className="h-6 w-6" />,
  'Handyman & General': <Settings className="h-6 w-6" />,
  'Commercial & Industrial': <Building2 className="h-6 w-6" />,
  'Legal & Regulatory': <FileCheck className="h-6 w-6" />,
};

const Services = () => {
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
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            Our Services
          </h1>
          <p className="text-lg text-muted-foreground">
            Find trusted professionals across all construction and property services
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MAIN_CATEGORIES.map((category) => {
            const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <Link key={category} to={`/services/${slug}`}>
                <Card className="h-full transition-all hover:shadow-soft hover:border-primary/20 cursor-pointer">
                  <CardHeader>
                    <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {categoryIcons[category] || <Hammer className="h-6 w-6" />}
                    </div>
                    <CardTitle className="font-display text-lg">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="flex items-center gap-1">
                      View services <ArrowRight className="h-3 w-3" />
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for?
          </p>
          <Button asChild>
            <Link to="/post">Post a Custom Job</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Services;
