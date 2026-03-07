import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicLayout, HeroBanner } from '@/components/layout';
import {
  Shield, CheckCircle, ArrowRight, Award, Star,
  Users, FileText, Search, Bell, Briefcase, Calculator,
} from 'lucide-react';
import heroImg from '@/assets/heroes/hero-pricing.jpg';

const PLANS = [
  {
    name: 'Bronze',
    monthly: 33,
    annual: 333,
    fee: '18%',
    tagKey: 'pricing.plans.bronze.tag',
    features: ['pricing.plans.bronze.f1', 'pricing.plans.bronze.f2', 'pricing.plans.bronze.f3', 'pricing.plans.bronze.f4'],
    earned: false,
  },
  {
    name: 'Silver',
    monthly: 66,
    annual: 666,
    fee: '12%',
    tagKey: 'pricing.plans.silver.tag',
    features: ['pricing.plans.silver.f1', 'pricing.plans.silver.f2', 'pricing.plans.silver.f3', 'pricing.plans.silver.f4'],
    earned: false,
    popular: true,
  },
  {
    name: 'Gold',
    monthly: null,
    annual: null,
    fee: '9%',
    tagKey: 'pricing.plans.gold.tag',
    features: ['pricing.plans.gold.f1', 'pricing.plans.gold.f2', 'pricing.plans.gold.f3', 'pricing.plans.gold.f4'],
    earned: true,
  },
  {
    name: 'Elite',
    monthly: 199,
    annual: 2000,
    fee: '6%',
    tagKey: 'pricing.plans.elite.tag',
    features: ['pricing.plans.elite.f1', 'pricing.plans.elite.f2', 'pricing.plans.elite.f3', 'pricing.plans.elite.f4'],
    earned: false,
  },
];

const COMPARISON_ROWS = [
  { label: 'Professional profile', icon: Users, bronze: true, silver: true, gold: true, elite: true },
  { label: 'Portfolio gallery', icon: Briefcase, bronze: true, silver: true, gold: true, elite: true },
  { label: 'Client reviews', icon: Star, bronze: true, silver: true, gold: true, elite: true },
  { label: 'Job notifications', icon: Bell, bronze: true, silver: true, gold: true, elite: true },
  { label: 'Priority visibility', icon: Search, bronze: false, silver: true, gold: true, elite: true },
  { label: 'Reduced commission', icon: Calculator, bronze: false, silver: true, gold: true, elite: true },
  { label: 'Top search placement', icon: ArrowRight, bronze: false, silver: false, gold: true, elite: true },
  { label: 'Market data insights', icon: FileText, bronze: false, silver: false, gold: true, elite: true },
  { label: 'Company branding', icon: Shield, bronze: false, silver: false, gold: false, elite: true },
];

const Pricing = () => {
  const { t } = useTranslation('common');
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <PublicLayout>
      <HeroBanner
        imageSrc={heroImg}
        title={t('pricing.hero.title')}
        subtitle={t('pricing.hero.subtitle')}
        height="compact"
        trustBadge={
          <div className="hero-trust-badge">
            <Award className="h-4 w-4" />
            {t('pricing.hero.badge')}
          </div>
        }
      />

      <div className="container py-12 space-y-16">
        {/* ── Billing Toggle ── */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !isAnnual ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('pricing.toggle.monthly')}
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isAnnual ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('pricing.toggle.annual')}
            <span className="ml-1 text-xs opacity-80">{t('pricing.toggle.save')}</span>
          </button>
        </div>

        {/* ── Plan Cards ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`border-border relative ${plan.popular ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  {t('pricing.mostPopular')}
                </div>
              )}
              <CardContent className="p-6 text-center space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  {plan.earned && '⭐ '}{plan.name}
                </h3>
                <p className="text-xs text-muted-foreground">{t(plan.tagKey)}</p>

                {plan.earned ? (
                  <p className="text-2xl font-bold text-amber-600">{t('pricing.inviteOnly')}</p>
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      €{isAnnual ? plan.annual!.toLocaleString() : plan.monthly}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      /{isAnnual ? t('pricing.year') : t('pricing.month')}
                    </p>
                    {isAnnual && (
                      <p className="text-xs text-primary mt-1">
                        €{Math.round(plan.annual! / 12)}/mo
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-border">
                  <p className="text-sm font-medium text-foreground">{plan.fee} {t('pricing.commission')}</p>
                </div>

                <ul className="space-y-2 text-left">
                  {plan.features.map((fKey) => (
                    <li key={fKey} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {t(fKey)}
                    </li>
                  ))}
                </ul>

                {!plan.earned && (
                  <Button asChild className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    <Link to="/auth">{t('pricing.getStarted')}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Reputation First ── */}
        <section className="bg-muted rounded-2xl p-8 md:p-12 text-center space-y-4 max-w-3xl mx-auto">
          <Award className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">
            {t('pricing.reputationFirst.title')}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t('pricing.reputationFirst.desc')}
          </p>
          <Button asChild variant="outline">
            <Link to="/reputation">
              {t('pricing.reputationFirst.learnMore')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        {/* ── Feature Comparison ── */}
        <section className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-foreground text-center">
            {t('pricing.comparison.title')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">{t('pricing.comparison.feature')}</th>
                  <th className="text-center py-3 px-2 text-foreground font-medium">Bronze</th>
                  <th className="text-center py-3 px-2 text-primary font-bold">Silver</th>
                  <th className="text-center py-3 px-2 text-amber-600 font-medium">Gold</th>
                  <th className="text-center py-3 px-2 text-foreground font-medium">Elite</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map(({ label, bronze, silver, gold, elite }) => (
                  <tr key={label} className="border-b border-border/50">
                    <td className="py-3 px-2 text-foreground">{label}</td>
                    {[bronze, silver, gold, elite].map((has, i) => (
                      <td key={i} className="text-center py-3 px-2">
                        {has ? (
                          <CheckCircle className="h-4 w-4 text-primary mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Tax Friendly ── */}
        <section className="bg-card rounded-2xl p-8 max-w-2xl mx-auto text-center space-y-3 border border-border">
          <Calculator className="h-8 w-8 text-primary mx-auto" />
          <h3 className="text-lg font-semibold text-foreground">{t('pricing.tax.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('pricing.tax.desc')}</p>
          <p className="text-xs text-muted-foreground italic">{t('pricing.tax.disclaimer')}</p>
        </section>

        {/* ── CTA ── */}
        <section className="text-center space-y-4 py-8">
          <h2 className="text-2xl font-bold text-foreground">{t('pricing.cta.title')}</h2>
          <p className="text-muted-foreground">{t('pricing.cta.desc')}</p>
          <Button asChild size="lg">
            <Link to="/auth">
              {t('pricing.cta.button')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    </PublicLayout>
  );
};

export default Pricing;
