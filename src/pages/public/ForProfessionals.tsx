import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout, HeroBanner } from '@/components/layout';
import {
  Globe, Users, Search, FileText, Star, Bell,
  Clock, TrendingUp, Shield, ArrowRight, Award,
  CheckCircle, Calculator, Briefcase,
} from 'lucide-react';
import heroImg from '@/assets/heroes/hero-for-professionals.jpg';

/* ── Constant data (not i18n'd yet — static values) ── */

const PROBLEM_TOOLS = [
  { icon: Globe, label: 'Website', cost: '€120/mo' },
  { icon: TrendingUp, label: 'Advertising', cost: '€150/mo' },
  { icon: Users, label: 'Lead platforms', cost: '€70/mo' },
  { icon: FileText, label: 'Quote software', cost: '€80/mo' },
  { icon: Star, label: 'Review sites', cost: '€60/mo' },
  { icon: Clock, label: 'Time lost', cost: '€200/mo' },
];

const FEATURES = [
  { icon: Users, titleKey: 'forPros.features.profile.title', descKey: 'forPros.features.profile.desc', value: '€120' },
  { icon: FileText, titleKey: 'forPros.features.wizard.title', descKey: 'forPros.features.wizard.desc', value: '€70' },
  { icon: Search, titleKey: 'forPros.features.matching.title', descKey: 'forPros.features.matching.desc', value: '€50' },
  { icon: Briefcase, titleKey: 'forPros.features.jobCards.title', descKey: 'forPros.features.jobCards.desc', value: '€80' },
  { icon: Star, titleKey: 'forPros.features.reviews.title', descKey: 'forPros.features.reviews.desc', value: '€60' },
  { icon: Bell, titleKey: 'forPros.features.notifications.title', descKey: 'forPros.features.notifications.desc', value: '€25' },
];

const VALUE_STACK = [
  { label: 'Website profile', value: '€120' },
  { label: 'Advertising exposure', value: '€150' },
  { label: 'Job systems', value: '€70' },
  { label: 'Quote software', value: '€80' },
  { label: 'Review platforms', value: '€60' },
  { label: 'Time saved', value: '€200' },
];

const TIERS = [
  { name: 'Bronze', annual: '€333', monthly: '€33', fee: '18%', tagKey: 'forPros.tiers.bronze.tag', earned: false },
  { name: 'Silver', annual: '€666', monthly: '€66', fee: '12%', tagKey: 'forPros.tiers.silver.tag', earned: false, popular: true },
  { name: 'Gold', annual: null, monthly: null, fee: '9%', tagKey: 'forPros.tiers.gold.tag', earned: true },
  { name: 'Elite', annual: '€2,000', monthly: '€199', fee: '6%', tagKey: 'forPros.tiers.elite.tag', earned: false },
];

const PROJECT_EXAMPLES = [
  { type: 'Painting', range: '€500 – €1,500' },
  { type: 'Electrical', range: '€600 – €2,000' },
  { type: 'Renovations', range: '€5,000+' },
];

const ForProfessionals = () => {
  const { t } = useTranslation('common');

  return (
    <PublicLayout>
      {/* ── 1. Hero ── */}
      <HeroBanner
        imageSrc={heroImg}
        title={t('forPros.hero.title')}
        subtitle={t('forPros.hero.subtitle')}
        height="compact"
        trustBadge={
          <div className="hero-trust-badge">
            <Shield className="h-4 w-4" />
            {t('forPros.hero.badge')}
          </div>
        }
        action={
          <div className="flex gap-3 flex-wrap">
            <Button asChild size="lg">
              <Link to="/auth">{t('forPros.hero.cta')}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-background/10 border-background/30 text-primary-foreground hover:bg-background/20">
              <Link to="/how-it-works">{t('forPros.hero.ctaSecondary')}</Link>
            </Button>
          </div>
        }
      />

      <div className="container py-12 space-y-20">
        {/* ── 2. The Problem ── */}
        <section className="text-center max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('forPros.problem.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('forPros.problem.desc')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PROBLEM_TOOLS.map(({ icon: Icon, label, cost }) => (
              <Card key={label} className="border-border">
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <Icon className="h-6 w-6 text-accent" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="text-lg font-bold text-accent">{cost}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xl font-semibold text-foreground">
            {t('forPros.problem.total')}
          </p>
        </section>

        {/* ── 3. The Constructive Solution ── */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t('forPros.solution.title')}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, titleKey, descKey, value }) => (
              <Card key={titleKey} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{t(titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(descKey)}</p>
                  <p className="text-xs text-accent font-medium">
                    {t('forPros.solution.valueLabel')} {value}/mo
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── 4. Time Saved ── */}
        <section className="bg-muted rounded-2xl p-8 md:p-12 text-center space-y-6 max-w-3xl mx-auto">
          <Clock className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('forPros.timeSaved.title')}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-bold text-foreground">5–10</p>
              <p className="text-sm text-muted-foreground">{t('forPros.timeSaved.hoursWeek')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">€40–€60</p>
              <p className="text-sm text-muted-foreground">{t('forPros.timeSaved.hourlyRate')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">€800+</p>
              <p className="text-sm text-muted-foreground">{t('forPros.timeSaved.monthlyLost')}</p>
            </div>
          </div>
          <p className="text-muted-foreground">{t('forPros.timeSaved.cta')}</p>
        </section>

        {/* ── 5. Value Stack ── */}
        <section className="max-w-xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-foreground text-center">
            {t('forPros.valueStack.title')}
          </h2>
          <div className="space-y-3">
            {VALUE_STACK.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-3 px-4 bg-card rounded-lg border border-border">
                <span className="text-sm text-foreground">{label}</span>
                <span className="font-semibold text-foreground">{value}/mo</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-4 px-4 bg-primary/10 rounded-lg border-2 border-primary">
              <span className="font-bold text-foreground">{t('forPros.valueStack.total')}</span>
              <span className="text-xl font-bold text-primary">≈ €755/mo</span>
            </div>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            {t('forPros.valueStack.compare')}
          </p>
        </section>

        {/* ── 6. Reputation Ladder ── */}
        <section className="text-center max-w-2xl mx-auto space-y-8">
          <Award className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('forPros.reputation.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('forPros.reputation.desc')}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {['Bronze', 'Silver', 'Gold'].map((tier, i) => (
              <div key={tier} className="flex items-center gap-3">
                <div className={`px-5 py-3 rounded-xl font-semibold text-sm ${
                  tier === 'Gold' 
                    ? 'bg-amber-100 text-amber-800 border-2 border-amber-300' 
                    : tier === 'Silver' 
                      ? 'bg-slate-100 text-slate-700 border-2 border-slate-300'
                      : 'bg-orange-50 text-orange-700 border-2 border-orange-200'
                }`}>
                  {tier === 'Gold' && '⭐ '}{tier}
                </div>
                {i < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground italic">
            {t('forPros.reputation.goldNote')}
          </p>
          <Button asChild variant="outline">
            <Link to="/reputation">
              {t('forPros.reputation.learnMore')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        {/* ── 7. Pricing Cards ── */}
        <section className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center">
            {t('forPros.pricing.title')}
          </h2>
          <p className="text-center text-muted-foreground max-w-lg mx-auto">
            {t('forPros.pricing.subtitle')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {TIERS.map((tier) => (
              <Card 
                key={tier.name} 
                className={`border-border relative ${tier.popular ? 'ring-2 ring-primary shadow-lg' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {t('forPros.pricing.mostPopular')}
                  </div>
                )}
                <CardContent className="p-6 text-center space-y-4">
                  <h3 className="text-lg font-bold text-foreground">
                    {tier.earned && '⭐ '}{tier.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t(tier.tagKey)}</p>
                  {tier.earned ? (
                    <div>
                      <p className="text-2xl font-bold text-amber-600">{t('forPros.pricing.inviteOnly')}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-foreground">{tier.annual}</p>
                      <p className="text-xs text-muted-foreground">/year</p>
                      <p className="text-sm text-muted-foreground mt-1">or {tier.monthly}/mo</p>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-foreground">{tier.fee} {t('forPros.pricing.commission')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {t('forPros.pricing.upgradeNote')}
          </p>
        </section>

        {/* ── 8. Tax Friendly ── */}
        <section className="bg-muted rounded-2xl p-8 max-w-2xl mx-auto text-center space-y-4">
          <Calculator className="h-8 w-8 text-primary mx-auto" />
          <h3 className="text-lg font-semibold text-foreground">
            {t('forPros.tax.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('forPros.tax.desc')}
          </p>
          <p className="text-xs text-muted-foreground italic">
            {t('forPros.tax.disclaimer')}
          </p>
        </section>

        {/* ── 9. Final CTA ── */}
        <section className="text-center max-w-2xl mx-auto space-y-6 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('forPros.cta.title')}
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {PROJECT_EXAMPLES.map(({ type, range }) => (
              <div key={type} className="p-4 bg-card rounded-lg border border-border">
                <p className="font-medium text-foreground">{type}</p>
                <p className="text-sm text-primary font-semibold">{range}</p>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground">{t('forPros.cta.desc')}</p>
          <Button asChild size="lg">
            <Link to="/auth">
              {t('forPros.cta.button')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    </PublicLayout>
  );
};

export default ForProfessionals;
