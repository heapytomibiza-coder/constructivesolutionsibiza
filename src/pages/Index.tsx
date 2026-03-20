import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { MobileFAB } from '@/components/MobileFAB';
import { PLATFORM } from '@/domain/scope';
import { UniversalSearchBar } from '@/components/search';
import { isRolloutActive } from '@/domain/rollout';
import { 
  ArrowRight, Shield, Clock, Star, CheckCircle,
  MessageSquare, Ruler, HardHat, CheckCircle2,
  Hammer, PenTool, Waves, TreePine, Zap, Building2,
  XCircle, Quote, MapPin, Calendar, Euro, Wrench,
  AlertTriangle, Lock, FileCheck, Scale, Users, Briefcase
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
  { key: 'step2', icon: Lock, delay: '100ms' },
  { key: 'step3', icon: CheckCircle2, delay: '200ms' },
  { key: 'step4', icon: Scale, delay: '300ms' },
];

const WHY_ROWS = ['why1', 'why2', 'why3', 'why4'];

const PORTFOLIO_ITEMS = [
  { key: 'project1', accent: 'from-primary/80 to-primary/40' },
  { key: 'project2', accent: 'from-accent/80 to-accent/40' },
  { key: 'project3', accent: 'from-secondary/80 to-secondary/40' },
];

const TRUST_STRIP_KEYS = [
  'trustStripMilestones',
  'trustStripProtection',
  'trustStripVerified',
  'trustStripResolution',
  'trustStripRisk',
];

const PROBLEM_KEYS = ['problem1', 'problem2', 'problem3', 'problem4'];

const RESOLUTION_KEYS = ['resolution1', 'resolution2', 'resolution3', 'resolution4'];

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

      {/* ─── TRUST STRIP ─── */}
      <section className="py-4 bg-primary/5 border-y border-primary/10">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {TRUST_STRIP_KEYS.map((key) => (
              <span key={key} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
                {t(`home.${key}`)}
              </span>
            ))}
          </div>
        </div>
      </section>

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

      {/* ─── PROBLEM / SOLUTION ─── */}
      <section className="py-20 bg-gradient-concrete">
        <div className="container max-w-4xl">
          {/* Problem */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-destructive uppercase tracking-wider mb-4">
              <AlertTriangle className="h-4 w-4" />
              {t('home.problemTitle')}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {t('home.problemSubtitle')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto mb-6">
            {PROBLEM_KEYS.map((key) => (
              <div key={key} className="flex items-start gap-3 rounded-xl bg-destructive/5 border border-destructive/10 p-4">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{t(`home.${key}`)}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground italic max-w-lg mx-auto mb-16">
            {t('home.problemClosing')}
          </p>

          {/* Solution */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              <CheckCircle className="h-4 w-4" />
              {t('home.solutionTitle')}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {t('home.solutionSubtitle')}
            </h2>
          </div>
          <p className="text-center text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-4">
            {t('home.solutionDesc')}
          </p>
          <p className="text-center text-sm font-semibold text-foreground">
            {t('home.solutionClosing')}
          </p>
        </div>
      </section>

      {/* ─── PAYMENT PROTECTION ─── */}
      <section className="py-20 bg-background">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {t('home.paymentTitle')}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              {t('home.paymentSubtitle')}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto mb-6">
            {['payment1', 'payment2', 'payment3', 'payment4'].map((key) => (
              <div key={key} className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/10 p-4">
                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm font-medium text-foreground">{t(`home.${key}`)}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-semibold text-foreground">
            {t('home.paymentClosing')}
          </p>
        </div>
      </section>

      {/* ─── 28-DAY RESOLUTION ─── */}
      <section className="py-20 bg-gradient-steel text-primary-foreground">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
              <Scale className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              {t('home.resolutionTitle')}
            </h2>
            <p className="mt-3 text-lg text-primary-foreground/80">
              {t('home.resolutionSubtitle')}
            </p>
            <p className="mt-2 text-sm text-primary-foreground/70">
              {t('home.resolutionDesc')}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto mb-6">
            {RESOLUTION_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/10 p-4">
                <FileCheck className="h-5 w-5 text-primary-foreground/80 shrink-0" />
                <p className="text-sm text-primary-foreground/90">{t(`home.${key}`)}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-primary-foreground/70 italic mb-6">
            {t('home.resolutionClosing')}
          </p>
          <div className="text-center">
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20" asChild>
              <Link to="/dispute-policy">{t('home.resolutionLink')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── DUAL AUDIENCE: For Pros / For Clients ─── */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {/* For Professionals */}
            <Card className="card-grounded border-primary/15 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-primary to-primary/50" />
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">{t('home.forProsTitle')}</h3>
                    <p className="text-sm text-muted-foreground">{t('home.forProsSubtitle')}</p>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {['forPros1', 'forPros2', 'forPros3', 'forPros4'].map((key) => (
                    <li key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      {t(`home.${key}`)}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground italic">{t('home.forProsClosing')}</p>
              </CardContent>
            </Card>

            {/* For Clients */}
            <Card className="card-grounded border-accent/15 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-accent to-accent/50" />
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">{t('home.forClientsTitle')}</h3>
                    <p className="text-sm text-muted-foreground">{t('home.forClientsSubtitle')}</p>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {['forClients1', 'forClients2', 'forClients3', 'forClients4'].map((key) => (
                    <li key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      {t(`home.${key}`)}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground italic">{t('home.forClientsClosing')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── OUR SERVICES — Curated 6 cards ─── */}
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
            {SERVICE_CARDS.map(({ key, icon: Icon, link }) => {
              const servicesOpen = isRolloutActive('service-layer');
              const Wrapper = servicesOpen ? Link : 'div';
              const wrapperProps = servicesOpen ? { to: link, className: 'group' } : { className: 'group relative' };

              return (
                <Wrapper key={key} {...(wrapperProps as any)}>
                  {!servicesOpen && (
                    <span className="absolute top-3 right-3 z-10 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {t('home.comingSoon', 'Coming Soon')}
                    </span>
                  )}
                  <Card className={`card-grounded h-full transition-all duration-200 ${servicesOpen ? 'hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5' : 'opacity-80'}`}>
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
                </Wrapper>
              );
            })}
          </div>

          <div className="flex justify-center mt-10">
            {isRolloutActive('service-layer') ? (
              <Button variant="outline" size="lg" asChild>
                <Link to="/services">
                  {t('home.viewAllServices')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link to="/post">
                  {t('home.startProject')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ─── PORTFOLIO / FEATURED PROJECTS ─── */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              {t('home.portfolioTitle')}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
              {t('home.portfolioSubtitle')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {PORTFOLIO_ITEMS.map(({ key, accent }) => (
              <Card key={key} className="card-grounded overflow-hidden group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                <div className={`h-3 bg-gradient-to-r ${accent}`} />
                <CardContent className="p-6">
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
                    {t(`home.${key}Type`)}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-3.5 w-3.5" />
                    {t(`home.${key}Location`)}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <Euro className="h-4 w-4 mx-auto text-primary mb-1" />
                      <p className="text-xs font-semibold text-foreground">{t(`home.${key}Budget`)}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <Calendar className="h-4 w-4 mx-auto text-primary mb-1" />
                      <p className="text-xs font-semibold text-foreground">{t(`home.${key}Duration`)}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <Wrench className="h-4 w-4 mx-auto text-primary mb-1" />
                      <p className="text-xs font-semibold text-foreground">{t(`home.${key}Trades`)}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {t(`home.${key}Result`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US — Comparison ─── */}
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

      {/* ─── SOCIAL PROOF — Stats + Testimonials ─── */}
      <section className="py-20 bg-gradient-steel text-primary-foreground">
        <div className="container">
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

      {/* ─── TRUST SIGNALS ─── */}
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

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 bg-gradient-clay text-accent-foreground">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold">
            {t('home.finalCtaTitle')}
          </h2>
          <p className="mt-4 text-accent-foreground/80 max-w-xl mx-auto">
            {t('home.finalCtaDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/post">{t('home.finalCtaStart')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-accent-foreground/30 text-accent-foreground hover:bg-accent-foreground/10" asChild>
              <Link to="/register">{t('home.finalCtaJoin')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <MobileFAB />
    </PublicLayout>
  );
};

export default Index;
