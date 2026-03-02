import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { MobileFAB } from '@/components/MobileFAB';
import { PLATFORM } from '@/domain/scope';
import { UniversalSearchBar } from '@/components/search';
import { 
  ArrowRight, Shield, Clock, Star, CheckCircle,
  MessageSquare, Ruler, HardHat, CheckCircle2,
  Hammer, PenTool, Waves, TreePine, Zap, Building2,
  XCircle, Quote
} from 'lucide-react';
import heroHome from '@/assets/heroes/hero-home.jpg';

const SERVICE_CARDS = [
  { key: 'svc1', icon: Hammer, link: '/services' },
  { key: 'svc2', icon: Building2, link: '/services' },
  { key: 'svc3', icon: PenTool, link: '/services' },
  { key: 'svc4', icon: Ruler, link: '/services' },
  { key: 'svc5', icon: TreePine, link: '/services' },
  { key: 'svc6', icon: Zap, link: '/services' },
];

const STEPS = [
  { key: 'step1', icon: MessageSquare, delay: '0ms' },
  { key: 'step2', icon: Ruler, delay: '100ms' },
  { key: 'step3', icon: HardHat, delay: '200ms' },
  { key: 'step4', icon: CheckCircle2, delay: '300ms' },
];

const WHY_ROWS = ['why1', 'why2', 'why3', 'why4'];

const Index = () => {
  const { t } = useTranslation('common');

  return (
    <PublicLayout>
      {/* ─── 1. HERO ─── */}
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
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
                <Link to="#how-we-work">
                  {t('home.seeHowWeWork')}
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

      {/* ─── 2. HOW WE WORK — 4 steps ─── */}
      <section id="how-we-work" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              {t('home.howWeWorkTitle')}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
              {t('home.howWeWorkSubtitle')}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {STEPS.map(({ key, icon: Icon, delay }, i) => (
              <div key={key} className="group relative text-center animate-fade-in" style={{ animationDelay: delay }}>
                <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 transition-transform group-hover:scale-105">
                  <Icon className="h-9 w-9 text-primary" />
                </div>
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {i + 1}
                </span>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {t(`home.${key}Title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`home.${key}Desc`)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <Button size="lg" asChild>
              <Link to="/post">
                {t('home.startProject')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── 3. OUR SERVICES — Curated 6 cards ─── */}
      <section className="py-20 bg-gradient-concrete">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              {t('home.servicesTitle')}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
              {t('home.servicesSubtitle')}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {SERVICE_CARDS.map(({ key, icon: Icon, link }) => (
              <Link key={key} to={link} className="group">
                <Card className="card-grounded h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                        {t(`home.${key}Title`)}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t(`home.${key}Desc`)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <Button variant="outline" size="lg" asChild>
              <Link to="/services">
                {t('home.viewAllServices')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── 4. WHY CHOOSE US — Comparison ─── */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              {t('home.whyTitle')}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
              {t('home.whySubtitle')}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Header row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <XCircle className="h-4 w-4 text-destructive" />
                  {t('home.oldWay')}
                </span>
              </div>
              <div className="text-center">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                  <CheckCircle className="h-4 w-4" />
                  {t('home.newWay')}
                </span>
              </div>
            </div>

            {/* Comparison rows */}
            <div className="space-y-3">
              {WHY_ROWS.map((key, i) => (
                <div
                  key={key}
                  className="grid grid-cols-2 gap-4 animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="rounded-xl bg-destructive/5 border border-destructive/10 p-4 text-center">
                    <p className="text-sm text-muted-foreground line-through decoration-destructive/40">
                      {t(`home.${key}Old`)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 text-center">
                    <p className="text-sm font-medium text-foreground">
                      {t(`home.${key}New`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. SOCIAL PROOF — Stats + Testimonials ─── */}
      <section className="py-20 bg-gradient-steel text-primary-foreground">
        <div className="container">
          {/* Stats bar */}
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              {t('home.proofTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-16">
            {['stat1', 'stat2', 'stat3'].map((key) => (
              <div key={key} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold">{t(`home.${key}Value`)}</p>
                <p className="text-sm text-primary-foreground/75 mt-1">{t(`home.${key}Label`)}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
            {['testimonial1', 'testimonial2'].map((key) => (
              <Card key={key} className="bg-white/10 border-white/15 backdrop-blur-sm">
                <CardContent className="p-6">
                  <Quote className="h-6 w-6 text-primary-foreground/40 mb-3" />
                  <p className="text-sm text-primary-foreground/90 leading-relaxed italic">
                    "{t(`home.${key}`)}"
                  </p>
                  <p className="mt-4 text-xs font-semibold text-primary-foreground/60">
                    — {t(`home.${key}Author`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. TRUST SIGNALS ─── */}
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

      {/* ─── 7. CTA ─── */}
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

      <MobileFAB />
    </PublicLayout>
  );
};

export default Index;
