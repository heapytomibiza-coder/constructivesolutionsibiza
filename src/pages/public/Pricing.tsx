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
import heroImg from '@/assets/heroes/hero-pricing.webp';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  TIER_PRICES, COMMISSION_RATES_DISPLAY, TIER_META, STRIPE_CHECKOUT_LIVE,
  type SubscriptionTier,
} from '@/domain/entitlements';

const PLANS: Array<{
  name: string;
  tier: SubscriptionTier;
  tagKey: string;
  features: string[];
  popular?: boolean;
}> = [
  {
    name: 'Bronze',
    tier: 'bronze',
    tagKey: 'pricing.plans.bronze.tag',
    features: ['pricing.plans.bronze.f1', 'pricing.plans.bronze.f2', 'pricing.plans.bronze.f3', 'pricing.plans.bronze.f4'],
  },
  {
    name: 'Silver',
    tier: 'silver',
    tagKey: 'pricing.plans.silver.tag',
    features: ['pricing.plans.silver.f1', 'pricing.plans.silver.f2', 'pricing.plans.silver.f3', 'pricing.plans.silver.f4'],
    popular: true,
  },
  {
    name: 'Gold',
    tier: 'gold',
    tagKey: 'pricing.plans.gold.tag',
    features: ['pricing.plans.gold.f1', 'pricing.plans.gold.f2', 'pricing.plans.gold.f3', 'pricing.plans.gold.f4'],
  },
  {
    name: 'Elite',
    tier: 'elite',
    tagKey: 'pricing.plans.elite.tag',
    features: ['pricing.plans.elite.f1', 'pricing.plans.elite.f2', 'pricing.plans.elite.f3', 'pricing.plans.elite.f4'],
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
  const { user, subscription } = useSession();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (tier === 'bronze') return;
    if (!TIER_META[tier].purchasable) return;
    if (!STRIPE_CHECKOUT_LIVE) return;

    if (!user) {
      window.location.href = '/auth';
      return;
    }

    setLoadingTier(tier);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({ tier }),
        },
      );

      const result = await response.json();
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || 'Failed to create checkout session');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoadingTier(null);
    }
  };

  const getCtaLabel = (tier: SubscriptionTier) => {
    const meta = TIER_META[tier];

    if (meta.earned) return 'Earned by reputation';
    if (subscription.tier === tier && subscription.status === 'active') {
      return t('pricing.currentPlan', 'Current plan');
    }
    if (tier === 'bronze') return t('pricing.getStarted');
    if (!STRIPE_CHECKOUT_LIVE) return 'Coming Soon';
    return t('pricing.subscribe', 'Subscribe');
  };

  const isCtaDisabled = (tier: SubscriptionTier) => {
    const meta = TIER_META[tier];
    if (meta.earned) return true;
    if (!meta.purchasable) return true;
    if (!STRIPE_CHECKOUT_LIVE) return true;
    if (subscription.tier === tier && subscription.status === 'active') return true;
    if (loadingTier === tier) return true;
    return false;
  };

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
        {/* ── Plan Cards ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const price = TIER_PRICES[plan.tier];
            const commission = COMMISSION_RATES_DISPLAY[plan.tier];
            const meta = TIER_META[plan.tier];
            const isCurrentPlan = subscription.tier === plan.tier && subscription.status === 'active';

            return (
              <Card
                key={plan.name}
                className={`border-border relative ${plan.popular ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''} ${isCurrentPlan ? 'ring-2 ring-accent' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    {t('pricing.mostPopular')}
                  </div>
                )}
                {meta.earned && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    Invite &amp; Earned Only
                  </div>
                )}
                <CardContent className="p-6 text-center space-y-4">
                  <h3 className="text-lg font-bold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t(plan.tagKey)}</p>

                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      €{price}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {meta.earned ? '/mo value' : `/${t('pricing.month')}`}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <p className="text-sm font-medium text-foreground">{commission}% {t('pricing.commission')}</p>
                  </div>

                  <ul className="space-y-2 text-left">
                    {plan.features.map((fKey) => (
                      <li key={fKey} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {t(fKey)}
                      </li>
                    ))}
                  </ul>

                  {plan.tier === 'bronze' ? (
                    <Button asChild className="w-full" variant="outline">
                      <Link to="/auth">{t('pricing.getStarted')}</Link>
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        variant={plan.popular ? 'default' : 'outline'}
                        disabled={isCtaDisabled(plan.tier)}
                        onClick={() => handleSubscribe(plan.tier)}
                      >
                        {loadingTier === plan.tier ? '...' : getCtaLabel(plan.tier)}
                      </Button>
                      {meta.earned && (
                        <Link to="/reputation" className="block text-xs text-amber-600 hover:underline">
                          How Gold works →
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
                  <th className="text-center py-3 px-2 text-foreground font-medium">
                    Gold <span className="text-xs text-amber-500 font-normal">(earned)</span>
                  </th>
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