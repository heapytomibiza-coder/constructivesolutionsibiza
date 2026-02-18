import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { PLATFORM } from '@/domain/scope';
import {
  Hammer, Shield, Target, Globe, TrendingUp, Heart,
  ArrowRight, CheckCircle, Clock, Star, Users,
} from 'lucide-react';
import heroAbout from '@/assets/heroes/hero-about.jpg';

export default function About() {
  const { t } = useTranslation('common');

  return (
    <PublicLayout>
      {/* Hero */}
      <HeroBanner
        imageSrc={heroAbout}
        title={t('about.heroTitle')}
        subtitle={t('about.heroSubtitle')}
        height="medium"
      >
        <p className="mb-4 text-sm sm:text-base font-semibold tracking-widest uppercase text-white/90">
          {PLATFORM.name}
        </p>
      </HeroBanner>

      {/* Section 1 — Brand Mission (no "I", no personal) */}
      <section className="py-16 bg-background">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">
            {t('about.missionTitle')}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {t('about.missionP1')}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {t('about.missionP2')}
          </p>
        </div>
      </section>

      {/* Section 2 — What We Do */}
      <section className="py-16 bg-gradient-concrete">
        <div className="container max-w-4xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
            {t('about.whatWeDoTitle')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: <Users className="h-6 w-6 text-primary" />, titleKey: 'about.wwd1Title', descKey: 'about.wwd1Desc' },
              { icon: <Target className="h-6 w-6 text-primary" />, titleKey: 'about.wwd2Title', descKey: 'about.wwd2Desc' },
              { icon: <Shield className="h-6 w-6 text-primary" />, titleKey: 'about.wwd3Title', descKey: 'about.wwd3Desc' },
              { icon: <Hammer className="h-6 w-6 text-primary" />, titleKey: 'about.wwd4Title', descKey: 'about.wwd4Desc' },
            ].map((item) => (
              <div key={item.titleKey} className="flex gap-4 p-5 rounded-md bg-card border border-border">
                <div className="flex-shrink-0 mt-1">{item.icon}</div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{t(item.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(item.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Built for Ibiza (introduces experience, controlled personal) */}
      <section className="py-16 bg-background">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-7 w-7 text-primary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {t('about.ibizaTitle')}
            </h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {t('about.ibizaP1')}
          </p>
          <ul className="space-y-3 mb-6">
            {['about.ibizaBullet1', 'about.ibizaBullet2', 'about.ibizaBullet3', 'about.ibizaBullet4'].map((k) => (
              <li key={k} className="flex items-start gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            {t('about.ibizaP2')}
          </p>
        </div>
      </section>

      {/* Section 4 — Raising Standards */}
      <section className="py-16 bg-gradient-concrete">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-7 w-7 text-primary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {t('about.standardsTitle')}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {['about.std1', 'about.std2', 'about.std3', 'about.std4'].map((k) => (
              <div key={k} className="flex items-start gap-2 text-muted-foreground">
                <Star className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <span>{t(k)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Where We're Going */}
      <section className="py-16 bg-background">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">
            {t('about.futureTitle')}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {t('about.futureP1')}
          </p>
          <p className="text-lg font-display font-semibold text-foreground">
            {t('about.futureTagline')}
          </p>
        </div>
      </section>

      {/* Section 6 — Founder's Note */}
      <section className="py-16 bg-gradient-clay text-accent-foreground">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="h-7 w-7" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              {t('about.founderTitle')}
            </h2>
          </div>
          <blockquote className="border-l-4 border-accent-foreground/30 pl-6 italic text-accent-foreground/90 leading-relaxed mb-6">
            {t('about.founderQuote')}
          </blockquote>
          <p className="text-accent-foreground/80 leading-relaxed">
            {t('about.founderClosing')}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold text-foreground mb-4">
            {t('about.ctaTitle')}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            {t('about.ctaDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="accent" asChild>
              <Link to="/post">
                {t('about.ctaPost')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/how-it-works">{t('about.ctaHow')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
