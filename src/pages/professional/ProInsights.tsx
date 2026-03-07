import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3 } from 'lucide-react';

/**
 * PRO INSIGHTS
 * 
 * Placeholder for professional analytics — views, messages, job stats.
 * Will be expanded with real data as the platform grows.
 */
export default function ProInsights() {
  const { t } = useTranslation('dashboard');

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
            {t('pro.myInsights', 'My Insights')}
          </h1>
        </div>
      </div>

      <div className="container py-12 max-w-lg text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground mb-2">
          {t('pro.insightsComingSoon', 'Insights coming soon')}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {t('pro.insightsComingSoonDesc', 'Track your profile views, message activity, and job performance — all in one place.')}
        </p>
      </div>
    </div>
  );
}
