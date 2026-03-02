import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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
 * Bold identity: Premium + Warm + Construction-raw + Island lifestyle
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

const categoryToKey: Record<string, string> = {
  'Construction': 'construction',
  'Carpentry': 'carpentry',
  'Plumbing': 'plumbing',
  'Electrical': 'electrical',
  'HVAC': 'hvac',
  'Painting & Decorating': 'paintingDecorating',
  'Cleaning': 'cleaning',
  'Gardening & Landscaping': 'gardeningLandscaping',
  'Pool & Spa': 'poolSpa',
  'Architects, Design & Management': 'architectsDesign',
  'Transport & Logistics': 'transportLogistics',
  'Kitchen & Bathroom': 'kitchenBathroom',
  'Floors, Doors & Windows': 'floorsDoorsWindows',
  'Handyman & General': 'handymanGeneral',
  'Commercial & Industrial': 'commercialIndustrial',
  'Legal & Regulatory': 'legalRegulatory',
};

const categoryToSlug: Record<string, string> = {
  'Construction': 'construction',
  'Carpentry': 'carpentry',
  'Plumbing': 'plumbing',
  'Electrical': 'electrical',
  'HVAC': 'hvac',
  'Painting & Decorating': 'painting-decorating',
  'Cleaning': 'cleaning',
  'Gardening & Landscaping': 'gardening-landscaping',
  'Pool & Spa': 'pool-spa',
  'Architects, Design & Management': 'architects-design',
  'Transport & Logistics': 'transport-logistics',
  'Kitchen & Bathroom': 'kitchen-bathroom',
  'Floors, Doors & Windows': 'floors-doors-windows',
  'Handyman & General': 'handyman-general',
  'Commercial & Industrial': 'commercial-industrial',
  'Legal & Regulatory': 'legal-regulatory',
};

const Index = () => {
  const { t } = useTranslation('common');

  return (
    <PublicLayout>
      {/* ═══════════════════════════════════════════════
          HERO — Bold, confident, island-rooted
          ═══════════════════════════════════════════════ */}
      <HeroBanner
        imageSrc={heroHome}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        height="full"
        action={
          <div className="flex flex-col gap-6 items-center">
            <UniversalSearchBar className="w-full" />
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 font-semibold" asChild>
                <Link to="/post">
                  {t('hero.postJob')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Stat badges — bold social proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-2 text-white/90 font-semibold text-sm sm:text-base">
                <span className="text-2xl sm:text-3xl font-bold text-white">16</span>
                {t('hero.statTrades')}
              </div>
              <span className="text-white/30 text-2xl font-thin">|</span>
              <div className="flex items-center gap-2 text-white/90 font-semibold text-sm sm:text-base">
                <Shield className="h-5 w-5 text-white" />
                {t('hero.statIsland')}
              </div>
            </div>
          </div>
        }
      >
        {/* Brand lockup — bolder */}
        <div className="mb-6">
          <span className="inline-block text-xs sm:text-sm font-bold tracking-[0.3em] uppercase text-white/80 border border-white/20 rounded px-4 py-1.5 backdrop-blur-sm bg-white/5">
            {PLATFORM.name}
          </span>
        </div>
      </HeroBanner>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS — 3-step visual flow
          ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {t('home.howItWorksTitle')}
            </h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="relative text-center group">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-steel flex items-center justify-center mb-5 shadow-lg group-hover:shadow-glow transition-shadow">
                <ClipboardList className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-2">01</div>
              <h3 className="font-bold text-xl text-foreground mb-2">
                {t('home.step1Title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.step1Desc')}
              </p>
              {/* Connector arrow — hidden on mobile */}
              <div className="hidden md:block absolute top-8 -right-4 w-8">
                <ArrowRight className="h-5 w-5 text-border" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative text-center group">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-steel flex items-center justify-center mb-5 shadow-lg group-hover:shadow-glow transition-shadow">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-2">02</div>
              <h3 className="font-bold text-xl text-foreground mb-2">
                {t('home.step2Title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.step2Desc')}
              </p>
              <div className="hidden md:block absolute top-8 -right-4 w-8">
                <ArrowRight className="h-5 w-5 text-border" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-clay flex items-center justify-center mb-5 shadow-lg group-hover:shadow-glow transition-shadow">
                <Handshake className="h-8 w-8 text-accent-foreground" />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-accent mb-2">03</div>
              <h3 className="font-bold text-xl text-foreground mb-2">
                {t('home.step3Title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CATEGORY GRID — Show the breadth
          ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-concrete">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {t('home.ourServices')}
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-lg">
              {t('home.ourServicesDesc')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {MAIN_CATEGORIES.map((cat) => {
              const key = categoryToKey[cat];
              const slug = categoryToSlug[cat];
              return (
                <Link
                  key={cat}
                  to={`/services/${slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 sm:p-5 transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:bg-card/90"
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {categoryIcons[cat]}
                  </div>
                  <span className="text-sm sm:text-base font-medium text-foreground leading-tight">
                    {t(`categories.${key}`)}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Button variant="outline" size="lg" asChild>
              <Link to="/services">
                {t('home.viewAllServices')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          VALUE PROPS — Confident, not fluffy
          ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="grid gap-10 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="border-l-4 border-primary pl-6">
              <h3 className="font-bold text-xl text-foreground mb-2">
                {t('home.verifiedTitle')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.verifiedDesc')}
              </p>
            </div>
            
            <div className="border-l-4 border-accent pl-6">
              <h3 className="font-bold text-xl text-foreground mb-2">
                {t('home.quickTitle')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.quickDesc')}
              </p>
            </div>
            
            <div className="border-l-4 border-primary pl-6">
              <h3 className="font-bold text-xl text-foreground mb-2">
                {t('home.qualityTitle')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.qualityDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA — Strong, direct
          ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-clay text-accent-foreground">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">
              {t('home.ctaTitle')}
            </h2>
            <p className="mt-4 text-accent-foreground/85 text-lg">
              {t('home.ctaDesc')}
            </p>
            <Button size="lg" variant="secondary" className="mt-8 text-lg px-8 py-6 font-semibold" asChild>
              <Link to="/post">
                {t('home.ctaButton')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <MobileFAB />
    </PublicLayout>
  );
};

export default Index;
