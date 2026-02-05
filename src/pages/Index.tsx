import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { MobileFAB } from '@/components/MobileFAB';
import { PLATFORM, MAIN_CATEGORIES } from '@/domain/scope';
import { 
  Hammer, Wrench, Droplets, Zap, Wind, Paintbrush, 
  Sparkles, TreePine, Waves, PenTool, Truck, 
  ChefHat, DoorOpen, Settings, Building2, FileCheck,
  ArrowRight, Shield, Clock, Star, CheckCircle
} from 'lucide-react';
import heroHome from '@/assets/heroes/hero-home.jpg';

/**
 * HOMEPAGE - Construction & Trade Services
 * 
 * SCOPE: This platform is STRICTLY for construction and property services.
 * Do NOT add concierge, lifestyle, hospitality, or personal services.
 */

const categoryIcons: Record<string, React.ReactNode> = {
  'Construction': <Hammer className="h-5 w-5" />,
  'Carpentry': <Wrench className="h-5 w-5" />,
  'Plumbing': <Droplets className="h-5 w-5" />,
  'Electrical': <Zap className="h-5 w-5" />,
  'HVAC': <Wind className="h-5 w-5" />,
  'Painting & Decorating': <Paintbrush className="h-5 w-5" />,
  'Cleaning': <Sparkles className="h-5 w-5" />,
  'Gardening & Landscaping': <TreePine className="h-5 w-5" />,
  'Pool & Spa': <Waves className="h-5 w-5" />,
  'Architects & Design': <PenTool className="h-5 w-5" />,
  'Transport & Logistics': <Truck className="h-5 w-5" />,
  'Kitchen & Bathroom': <ChefHat className="h-5 w-5" />,
  'Floors, Doors & Windows': <DoorOpen className="h-5 w-5" />,
  'Handyman & General': <Settings className="h-5 w-5" />,
  'Commercial & Industrial': <Building2 className="h-5 w-5" />,
  'Legal & Regulatory': <FileCheck className="h-5 w-5" />,
};

const Index = () => {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <HeroBanner
        imageSrc={heroHome}
        title="Find Trusted Construction Professionals"
        subtitle={PLATFORM.description}
        height="full"
        trustBadge={
          <div className="hero-trust-badge">
            <CheckCircle className="h-4 w-4" />
            Verified trades
            <span className="text-white/50">•</span>
            <Clock className="h-4 w-4" />
            Same-day response
            <span className="text-white/50">•</span>
            <Shield className="h-4 w-4" />
            Ibiza-based
          </div>
        }
        action={
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/post">
                Post a Job
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/professionals">Browse Professionals</Link>
            </Button>
          </div>
        }
      />

      {/* Categories Grid */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground">
              Our Services
            </h2>
            <p className="mt-4 text-muted-foreground">
              Find trusted professionals across all construction and property services
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {MAIN_CATEGORIES.slice(0, 8).map((category) => {
              const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
              return (
                <Link key={category} to={`/services/${slug}`}>
                  <Card className="h-full service-card-hover cursor-pointer group">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                        {categoryIcons[category] || <Hammer className="h-5 w-5" />}
                      </div>
                      <span className="font-medium text-foreground">{category}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/services">
                View All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 bg-gradient-concrete">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-sm bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Verified Professionals
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                All professionals are vetted and verified before joining
              </p>
            </div>
            <div className="relative text-center md:before:absolute md:before:left-0 md:before:top-1/2 md:before:-translate-y-1/2 md:before:h-16 md:before:w-px md:before:bg-border md:after:absolute md:after:right-0 md:after:top-1/2 md:after:-translate-y-1/2 md:after:h-16 md:after:w-px md:after:bg-border">
              <div className="mx-auto h-14 w-14 rounded-sm bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Quick Response
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get quotes from multiple professionals within hours
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-sm bg-primary/10 flex items-center justify-center mb-4">
                <Star className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Quality Guaranteed
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Rated and reviewed by real customers in Ibiza
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-clay text-accent-foreground">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold">
            Ready to start your project?
          </h2>
          <p className="mt-4 text-accent-foreground/80 max-w-xl mx-auto">
            Post your job for free and receive quotes from trusted local professionals.
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link to="/post">Post a Job Now</Link>
          </Button>
        </div>
      </section>

      {/* Mobile FAB */}
      <MobileFAB />
    </PublicLayout>
  );
};

export default Index;
