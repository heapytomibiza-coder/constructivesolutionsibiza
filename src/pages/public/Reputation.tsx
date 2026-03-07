import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PublicLayout, HeroBanner } from '@/components/layout';
import {
  Award, Star, Shield, ArrowRight, CheckCircle,
  TrendingUp, BarChart3, MessageSquare, Clock,
  Target, Users,
} from 'lucide-react';
import heroImg from '@/assets/heroes/hero-reputation.jpg';

const SCORE_METRICS = [
  { icon: Star, labelKey: 'reputation.metrics.quality.label', descKey: 'reputation.metrics.quality.desc', weight: 35, color: 'bg-primary' },
  { icon: Shield, labelKey: 'reputation.metrics.reliability.label', descKey: 'reputation.metrics.reliability.desc', weight: 30, color: 'bg-accent' },
  { icon: MessageSquare, labelKey: 'reputation.metrics.communication.label', descKey: 'reputation.metrics.communication.desc', weight: 20, color: 'bg-amber-500' },
  { icon: Target, labelKey: 'reputation.metrics.completion.label', descKey: 'reputation.metrics.completion.desc', weight: 15, color: 'bg-emerald-500' },
];

const LADDER_TIERS = [
  {
    name: 'Bronze',
    colorClass: 'border-orange-200 bg-orange-50',
    textClass: 'text-orange-700',
    requirementsKey: 'reputation.ladder.bronze.requirements',
    benefitsKey: 'reputation.ladder.bronze.benefits',
  },
  {
    name: 'Silver',
    colorClass: 'border-slate-300 bg-slate-50',
    textClass: 'text-slate-700',
    requirementsKey: 'reputation.ladder.silver.requirements',
    benefitsKey: 'reputation.ladder.silver.benefits',
  },
  {
    name: '⭐ Gold',
    colorClass: 'border-amber-300 bg-amber-50',
    textClass: 'text-amber-800',
    requirementsKey: 'reputation.ladder.gold.requirements',
    benefitsKey: 'reputation.ladder.gold.benefits',
    inviteOnly: true,
  },
];

const STEPS = [
  { num: 1, labelKey: 'reputation.steps.s1' },
  { num: 2, labelKey: 'reputation.steps.s2' },
  { num: 3, labelKey: 'reputation.steps.s3' },
  { num: 4, labelKey: 'reputation.steps.s4' },
  { num: 5, labelKey: 'reputation.steps.s5' },
];

const GOLD_INSIGHTS = [
  'reputation.gold.insight1',
  'reputation.gold.insight2',
  'reputation.gold.insight3',
  'reputation.gold.insight4',
];

const Reputation = () => {
  const { t } = useTranslation('common');

  return (
    <PublicLayout>
      <HeroBanner
        imageSrc={heroImg}
        title={t('reputation.hero.title')}
        subtitle={t('reputation.hero.subtitle')}
        height="compact"
        trustBadge={
          <div className="hero-trust-badge">
            <Award className="h-4 w-4" />
            {t('reputation.hero.badge')}
          </div>
        }
      />

      <div className="container py-12 space-y-20">
        {/* ── Philosophy ── */}
        <section className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('reputation.philosophy.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('reputation.philosophy.desc')}
          </p>
          <p className="text-primary font-semibold italic">
            "{t('reputation.philosophy.quote')}"
          </p>
        </section>

        {/* ── How Professionals Rise ── */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-foreground text-center">
            {t('reputation.howItWorks.title')}
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-3xl mx-auto">
            {STEPS.map(({ num, labelKey }, i) => (
              <div key={num} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {num}
                  </div>
                  <p className="text-xs text-center text-muted-foreground max-w-[80px]">{t(labelKey)}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Score Formula ── */}
        <section className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t('reputation.score.title')}
            </h2>
            <p className="text-muted-foreground">{t('reputation.score.desc')}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {SCORE_METRICS.map(({ icon: Icon, labelKey, descKey, weight, color }) => (
              <Card key={labelKey} className="border-border">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{t(labelKey)}</h3>
                      <p className="text-xs text-muted-foreground">{t(descKey)}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('reputation.score.weight')}</span>
                      <span className="font-semibold text-foreground">{weight}%</span>
                    </div>
                    <Progress value={weight} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Example score */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">{t('reputation.score.example')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">4.8</p>
                  <p className="text-xs text-muted-foreground">{t('reputation.metrics.quality.label')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">4.9</p>
                  <p className="text-xs text-muted-foreground">{t('reputation.metrics.reliability.label')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">4.7</p>
                  <p className="text-xs text-muted-foreground">{t('reputation.metrics.communication.label')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">100%</p>
                  <p className="text-xs text-muted-foreground">{t('reputation.metrics.completion.label')}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">{t('reputation.score.resultLabel')}</p>
                <p className="text-3xl font-bold text-primary">4.85</p>
              </div>
            </CardContent>
          </Card>

          {/* ── Score Over Time ── */}
          <section className="bg-muted rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('reputation.growth.title')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t('reputation.growth.desc')}</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-lg p-4 border border-border text-center">
                <p className="text-xs text-muted-foreground mb-1">{t('reputation.growth.early')}</p>
                <p className="text-2xl font-bold text-foreground">4.2</p>
                <p className="text-xs text-muted-foreground">{t('reputation.growth.earlyJobs')}</p>
              </div>
              <div className="bg-card rounded-lg p-4 border border-border text-center">
                <p className="text-xs text-muted-foreground mb-1">{t('reputation.growth.growing')}</p>
                <p className="text-2xl font-bold text-foreground">4.6</p>
                <p className="text-xs text-muted-foreground">{t('reputation.growth.growingJobs')}</p>
              </div>
              <div className="bg-card rounded-lg p-4 border border-primary/30 text-center">
                <p className="text-xs text-primary font-medium mb-1">{t('reputation.growth.established')}</p>
                <p className="text-2xl font-bold text-primary">4.85</p>
                <p className="text-xs text-muted-foreground">{t('reputation.growth.establishedJobs')}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">{t('reputation.growth.tip')}</p>
          </section>
        </section>

        {/* ── Reputation Ladder ── */}
        <section className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-foreground text-center">
            {t('reputation.ladder.title')}
          </h2>
          <div className="space-y-6">
            {LADDER_TIERS.map((tier) => (
              <Card key={tier.name} className={`border-2 ${tier.colorClass}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${tier.textClass}`}>{tier.name}</h3>
                    {tier.inviteOnly && (
                      <span className="text-xs font-semibold bg-amber-200 text-amber-800 px-2 py-1 rounded-full">
                        {t('reputation.ladder.inviteOnly')}
                      </span>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {t('reputation.ladder.requirements')}
                      </p>
                      <p className="text-sm text-foreground">{t(tier.requirementsKey)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {t('reputation.ladder.benefits')}
                      </p>
                      <p className="text-sm text-foreground">{t(tier.benefitsKey)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Gold Data Insights ── */}
        <section className="bg-amber-50 rounded-2xl p-8 md:p-12 max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <BarChart3 className="h-10 w-10 text-amber-600 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">{t('reputation.gold.title')}</h2>
            <p className="text-muted-foreground">{t('reputation.gold.desc')}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {GOLD_INSIGHTS.map((key) => (
              <div key={key} className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{t(key)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonial Placeholder ── */}
        <section className="text-center max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-foreground">{t('reputation.testimonials.title')}</h2>
          <Card className="border-border">
            <CardContent className="p-8">
              <p className="text-lg text-muted-foreground italic mb-4">
                "{t('reputation.testimonials.quote1')}"
              </p>
              <p className="text-sm font-medium text-foreground">— {t('reputation.testimonials.author1')}</p>
            </CardContent>
          </Card>
        </section>

        {/* ── CTA ── */}
        <section className="text-center space-y-4 py-8">
          <h2 className="text-2xl font-bold text-foreground">{t('reputation.cta.title')}</h2>
          <p className="text-muted-foreground">{t('reputation.cta.desc')}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild size="lg">
              <Link to="/auth">
                {t('reputation.cta.button')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">{t('reputation.cta.viewPricing')}</Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default Reputation;
