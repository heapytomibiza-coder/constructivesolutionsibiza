import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { ClipboardList, Users, MessageSquare, CheckCircle, ArrowRight, Shield } from 'lucide-react';
import heroHowItWorks from '@/assets/heroes/hero-how-it-works.jpg';

/**
 * HOW IT WORKS PAGE
 * 
 * Explains the platform flow for clients and professionals.
 * Construction-grade professional styling.
 */

const HowItWorks = () => {
  const { t } = useTranslation('common');

  return (
    <PublicLayout>
      {/* Hero Section */}
      <HeroBanner
        imageSrc={heroHowItWorks}
        title={t('howItWorks.title')}
        subtitle={t('howItWorks.subtitle')}
        height="compact"
        trustBadge={
          <div className="hero-trust-badge">
            <Shield className="h-4 w-4" />
            {t('howItWorks.trustBadge')}
          </div>
        }
      />

      <div className="container py-12">
        {/* For Clients */}
        <section className="mb-20">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-8 text-center">
            {t('howItWorks.forClients')}
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            <StepCard
              step={1}
              icon={<ClipboardList className="h-6 w-6" />}
              title={t('howItWorks.clientStep1Title')}
              description={t('howItWorks.clientStep1Desc')}
            />
            <StepCard
              step={2}
              icon={<Users className="h-6 w-6" />}
              title={t('howItWorks.clientStep2Title')}
              description={t('howItWorks.clientStep2Desc')}
            />
            <StepCard
              step={3}
              icon={<MessageSquare className="h-6 w-6" />}
              title={t('howItWorks.clientStep3Title')}
              description={t('howItWorks.clientStep3Desc')}
            />
            <StepCard
              step={4}
              icon={<CheckCircle className="h-6 w-6" />}
              title={t('howItWorks.clientStep4Title')}
              description={t('howItWorks.clientStep4Desc')}
            />
          </div>
          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link to="/post">
                {t('howItWorks.postJobButton')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* For Professionals */}
        <section className="bg-muted/30 rounded-lg p-8">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-8 text-center">
            {t('howItWorks.forProfessionals')}
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            <StepCard
              step={1}
              icon={<ClipboardList className="h-6 w-6" />}
              title={t('howItWorks.proStep1Title')}
              description={t('howItWorks.proStep1Desc')}
            />
            <StepCard
              step={2}
              icon={<CheckCircle className="h-6 w-6" />}
              title={t('howItWorks.proStep2Title')}
              description={t('howItWorks.proStep2Desc')}
            />
            <StepCard
              step={3}
              icon={<MessageSquare className="h-6 w-6" />}
              title={t('howItWorks.proStep3Title')}
              description={t('howItWorks.proStep3Desc')}
            />
            <StepCard
              step={4}
              icon={<Users className="h-6 w-6" />}
              title={t('howItWorks.proStep4Title')}
              description={t('howItWorks.proStep4Desc')}
            />
          </div>
          <div className="text-center mt-8">
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth?mode=pro">
                {t('howItWorks.joinAsProButton')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="relative card-grounded hover:border-accent/50 transition-colors">
      <CardHeader>
        <div className="absolute -top-3 -left-3 h-8 w-8 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
          {step}
        </div>
        <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default HowItWorks;
