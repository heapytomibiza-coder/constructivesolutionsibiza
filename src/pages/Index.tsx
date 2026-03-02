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
  ArrowRight, Shield, Clock, Star, CheckCircle,
  ClipboardList, Users, Handshake
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
  'Construction': <Hammer className="h-6 w-6" />,
  'Carpentry': <Wrench className="h-6 w-6" />,
  'Plumbing': <Droplets className="h-6 w-6" />,
  'Electrical': <Zap className="h-6 w-6" />,
  'HVAC': <Wind className="h-6 w-6" />,
  'Painting & Decorating': <Paintbrush className="h-6 w-6" />,
  'Cleaning': <Sparkles className="h-6 w-6" />,
  'Gardening & Landscaping': <TreePine className="h-6 w-6" />,
  'Pool & Spa': <Waves className="h-6 w-6" />,
  'Architects, Design & Management': <PenTool className="h-6 w-6" />,
  'Transport & Logistics': <Truck className="h-6 w-6" />,
  'Kitchen & Bathroom': <ChefHat className="h-6 w-6" />,
  'Floors, Doors & Windows': <DoorOpen className="h-6 w-6" />,
  'Handyman & General': <Settings className="h-6 w-6" />,
  'Commercial & Industrial': <Building2 className="h-6 w-6" />,
  'Legal & Regulatory': <FileCheck className="h-6 w-6" />,
};

const CATEGORY_LIST = Object.keys(categoryIcons);

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
            <UniversalSearchBar className="w-full" />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
                <Link to="/post">
                  {t('hero.postJob')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
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
        <p className="mb-4 text-sm sm:text-base font-semibold tracking-widest uppercase text-white/90">
          {PLATFORM.name}
        </p>
      </HeroBanner>

      {/* How It Works - 3-step visual flow */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              {t('home.howItWorksTitle', 'How it works')}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
              {t('home.howItWorksSubtitle', 'From idea to build in three simple steps')}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="group relative text-center animate-fade-in" style={{ animationDelay: '0ms' }}>
              <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 transition-transform group-hover:scale-105">
                <ClipboardList className="h-9 w-9 text-primary" />
              </div>
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                1
              </span>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {t('home.step1Title', 'Describe')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('home.step1Desc', 'Answer a few guided questions. We build a clear brief so professionals know exactly what you need.')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="group relative text-center animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 transition-transform group-hover:scale-105">
                <Users className="h-9 w-9 text-primary" />
              </div>
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                2
              </span>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {t('home.step2Title', 'Match')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('home.step2Desc', 'We connect you with verified, Ibiza-based professionals who specialise in your type of project.')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="group relative text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 transition-transform group-hover:scale-105">
                <Handshake className="h-9 w-9 text-primary" />
              </div>
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                3
              </span>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {t('home.step3Title', 'Build')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('home.step3Desc', 'Compare quotes, chat directly, and hire with confidence. No obligation until you\'re ready.')}
              </p>
            </div>
          </div>

          {/* Connecting line between steps on desktop */}
          <div className="hidden md:flex justify-center mt-8">
            <Button size="lg" asChild>
              <Link to="/post">
                {t('home.startProject', 'Start your project')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="py-20 bg-gradient-concrete">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              {t('home.categoriesTitle', 'Browse by trade')}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
              {t('home.categoriesSubtitle', 'Find the right professional for any project')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {CATEGORY_LIST.map((category) => (
              <Link
                key={category}
                to={`/post?category=${encodeURIComponent(category)}`}
                className="group"
              >
                <Card className="card-grounded h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.98]">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                      {categoryIcons[category]}
                    </div>
                    <span className="text-sm font-medium text-foreground leading-tight">
                      {category}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
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
              <div className="mx-auto h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
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
              <div className="mx-auto h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
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
