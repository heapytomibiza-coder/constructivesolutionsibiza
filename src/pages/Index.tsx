import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { MobileFAB } from '@/components/MobileFAB';
import { PLATFORM, MAIN_CATEGORIES } from '@/domain/scope';
import { UniversalSearchBar } from '@/components/search';
import { 
  Hammer, Wrench, Droplets, Zap, Wind, Paintbrush, 
  Sparkles, TreePine, Waves, PenTool, Truck, 
  ChefHat, DoorOpen, Settings, Building2, FileCheck,
  ArrowRight, Shield, Clock, Star, CheckCircle
} from 'lucide-react';
import heroHome from '@/assets/heroes/hero-home.jpg';
import { CATEGORY_KEYS } from '@/i18n/categoryTranslations';

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
  'Architects, Design & Management': <PenTool className="h-5 w-5" />,
  'Transport & Logistics': <Truck className="h-5 w-5" />,
  'Kitchen & Bathroom': <ChefHat className="h-5 w-5" />,
  'Floors, Doors & Windows': <DoorOpen className="h-5 w-5" />,
  'Handyman & General': <Settings className="h-5 w-5" />,
  'Commercial & Industrial': <Building2 className="h-5 w-5" />,
  'Legal & Regulatory': <FileCheck className="h-5 w-5" />,
};


const Index = () => {
  const { t } = useTranslation('common');

  return (
    <PublicLayout>
      {/* Hero Section */}
      <HeroBanner
        imageSrc={heroHome}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        height="full"
        action={
          <div className="flex flex-col gap-6 items-center">
            {/* Universal Search - PRIMARY ACTION */}
            <UniversalSearchBar className="w-full" />
            
            {/* Secondary CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
                <Link to="/post">
                  {t('hero.postJob')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {/* Browse Taskers hidden until ready */}
            </div>
            
            {/* Trust badges - LAST, anchoring the bottom */}
            <div className="hero-trust-badge mt-2">
              <CheckCircle className="h-4 w-4" />
              {t('trust.guided')}
              <span className="text-white/50">•</span>
              <Clock className="h-4 w-4" />
              {t('trust.clarity')}
              <span className="text-white/50">•</span>
              <Shield className="h-4 w-4" />
              {t('trust.local')}
            </div>
          </div>
        }
      >
        {/* Brand lockup above title */}
        <p className="mb-4 text-sm sm:text-base font-semibold tracking-widest uppercase text-white/90">
          {PLATFORM.name}
        </p>
      </HeroBanner>


      {/* Trust Signals */}
      <section className="py-16 bg-gradient-concrete">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-sm bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {t('home.verifiedTitle')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('home.verifiedDesc')}
              </p>
            </div>
            <div className="relative text-center md:before:absolute md:before:left-0 md:before:top-1/2 md:before:-translate-y-1/2 md:before:h-16 md:before:w-px md:before:bg-border md:after:absolute md:after:right-0 md:after:top-1/2 md:after:-translate-y-1/2 md:after:h-16 md:after:w-px md:after:bg-border">
              <div className="mx-auto h-14 w-14 rounded-sm bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {t('home.quickTitle')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('home.quickDesc')}
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-sm bg-primary/10 flex items-center justify-center mb-4">
                <Star className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {t('home.qualityTitle')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('home.qualityDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-clay text-accent-foreground">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold">
            {t('home.ctaTitle')}
          </h2>
          <p className="mt-4 text-accent-foreground/80 max-w-xl mx-auto">
            {t('home.ctaDesc')}
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link to="/post">{t('home.ctaButton')}</Link>
          </Button>
        </div>
      </section>

      {/* Mobile FAB */}
      <MobileFAB />
    </PublicLayout>
  );
};

export default Index;
