import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, MapPin, Lock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { hasFeature } from '@/domain/entitlements';
import { useDemandData } from './hooks/useDemandData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

/**
 * PRO INSIGHTS — Demand Intelligence Dashboard
 * Gated to Gold/Elite tiers via `demand_data` entitlement.
 */
export default function ProInsights() {
  const { t } = useTranslation('dashboard');

  const { data: session } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const userId = session?.user?.id ?? null;
  const { tier } = useSubscription(userId);
  const hasDemandAccess = hasFeature(tier, 'demand_data');
  const { data: snapshots, isLoading } = useDemandData();

  // Split into category-level (no area) and area-level
  const categoryData = (snapshots ?? []).filter((s) => !s.area);
  const areaData = (snapshots ?? []).filter((s) => !!s.area);

  // Top areas by 7d volume
  const topAreas = areaData.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/90 sticky top-0 z-40">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link to="/dashboard/pro">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="font-display text-lg font-bold text-foreground">
            {t('pro.myInsights', 'Market Insights')}
          </h1>
          {hasDemandAccess && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </Badge>
          )}
        </div>
      </div>

      {!hasDemandAccess ? (
        /* Upgrade gate */
        <div className="container py-16 max-w-lg text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">
            {t('pro.insightsLocked', 'Unlock Demand Intelligence')}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
            {t('pro.insightsLockedDesc', 'Want to grow smarter? See which services are trending, where demand is hottest, and how the market is moving.')}
          </p>
          <Button asChild>
            <Link to="/pricing">{t('pro.viewPlans', 'View Plans')}</Link>
          </Button>
        </div>
      ) : isLoading ? (
        <div className="container py-12 text-center text-muted-foreground text-sm">
          {t('common.loading', 'Loading...')}
        </div>
      ) : categoryData.length === 0 ? (
        <div className="container py-12 max-w-lg text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">
            {t('pro.noDataYet', 'No data yet')}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {t('pro.noDataYetDesc', 'Demand data will appear once there are enough jobs on the platform. Check back soon.')}
          </p>
        </div>
      ) : (
        <div className="container py-6 space-y-6 max-w-2xl">
          {/* Trending Categories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                {t('pro.trendingCategories', 'Trending Categories')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryData.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium capitalize">{cat.category}</div>
                    <div className="text-xs text-muted-foreground">
                      {t('pro.jobsThisWeek', { count: cat.jobCount7d, defaultValue: `${cat.jobCount7d} jobs this week` })}
                      {' · '}
                      {t('pro.jobsThisMonth', { count: cat.jobCount30d, defaultValue: `${cat.jobCount30d} this month` })}
                    </div>
                  </div>
                  {cat.pctChange7d !== 0 && (
                    <Badge
                      variant="outline"
                      className={`gap-1 text-xs ${
                        cat.pctChange7d > 0
                          ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : 'border-red-500/30 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {cat.pctChange7d > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {cat.pctChange7d > 0 ? '+' : ''}
                      {cat.pctChange7d}%
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Hot Areas */}
          {topAreas.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {t('pro.hotAreas', 'Hot Areas')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {topAreas.map((area) => (
                    <div
                      key={area.id}
                      className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                    >
                      <div className="text-sm font-medium">{area.area}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {area.category} · {area.jobCount7d} {t('pro.jobs', 'jobs')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
