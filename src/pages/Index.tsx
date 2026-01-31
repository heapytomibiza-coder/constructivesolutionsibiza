import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, ArrowRight, MapPin, Star } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-ocean flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">CS</span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              CS Ibiza
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/job-board" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Job Board
            </Link>
            <Link to="/professionals" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Professionals
            </Link>
            <Link to="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
          </div>

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
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Ibiza's Premier Concierge Service
          </div>
          
          <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl animate-slide-up">
            Connect with the Best
            <span className="block text-gradient-ocean">Professionals in Ibiza</span>
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
            From luxury yacht chefs to villa managers, find verified professionals 
            for your Mediterranean experience. Post a job and receive quotes within hours.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button size="lg" className="gap-2 px-8" asChild>
              <Link to="/post">
                Post a Job
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/professionals">Browse Professionals</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-card py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-3xl font-semibold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              A seamless way to connect clients with verified professionals
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Briefcase className="h-6 w-6" />}
              title="Post Your Job"
              description="Describe what you need — from private chef services to event planning. Our wizard guides you through."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Receive Proposals"
              description="Verified professionals review your request and send personalized quotes with their availability."
            />
            <FeatureCard
              icon={<Star className="h-6 w-6" />}
              title="Choose & Book"
              description="Compare profiles, reviews, and pricing. Book with confidence through our secure platform."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-ocean p-12 text-center shadow-glow">
          <h2 className="font-display text-3xl font-semibold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join hundreds of satisfied clients who found their perfect professional through CS Ibiza.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="secondary" size="lg" asChild>
              <Link to="/post">Post a Job</Link>
            </Button>
            <Button variant="ghost" size="lg" className="text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/auth?mode=pro">Join as Professional</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-ocean flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-sm">CS</span>
              </div>
              <span className="font-display text-lg font-semibold text-foreground">
                CS Ibiza
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            </div>

            <p className="text-sm text-muted-foreground">
              © 2025 CS Ibiza. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 transition-all hover:shadow-soft hover:border-primary/20">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export default Index;
