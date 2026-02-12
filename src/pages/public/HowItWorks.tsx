import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PublicLayout, HeroBanner } from '@/components/layout';
import {
  ClipboardList,
  Users,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Shield,
  Wrench,
  Zap,
  Clock,
  Star,
  Search,
} from 'lucide-react';
import heroHowItWorks from '@/assets/heroes/hero-how-it-works.jpg';

/**
 * HOW IT WORKS PAGE
 *
 * Three sections: Overview → Asker → Tasker → FAQ
 * Mobile-first, warm construction tone matching Friendly Workshop design.
 */

const HowItWorks = () => {
  const { t } = useTranslation('common');

  return (
    <PublicLayout>
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

      <div className="container py-12 space-y-20">
        {/* ── Overview ── */}
        <section className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
            {t('howItWorks.overviewTitle')}
          </h2>
          <p className="text-muted-foreground mb-10">
            {t('howItWorks.overviewDesc')}
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            <OverviewStep
              icon={<ClipboardList className="h-7 w-7" />}
              number={1}
              title={t('howItWorks.ov1Title')}
              desc={t('howItWorks.ov1Desc')}
            />
            <OverviewStep
              icon={<Search className="h-7 w-7" />}
              number={2}
              title={t('howItWorks.ov2Title')}
              desc={t('howItWorks.ov2Desc')}
            />
            <OverviewStep
              icon={<MessageSquare className="h-7 w-7" />}
              number={3}
              title={t('howItWorks.ov3Title')}
              desc={t('howItWorks.ov3Desc')}
            />
          </div>
        </section>

        {/* ── For Askers (Clients) ── */}
        <section>
          <SectionHeader
            icon={<Users className="h-5 w-5" />}
            label={t('howItWorks.forClients')}
          />

          <div className="grid gap-6 md:grid-cols-4 mt-8">
            <StepCard step={1} icon={<Wrench className="h-6 w-6" />} title={t('howItWorks.clientStep1Title')} description={t('howItWorks.clientStep1Desc')} />
            <StepCard step={2} icon={<ClipboardList className="h-6 w-6" />} title={t('howItWorks.clientStep2Title')} description={t('howItWorks.clientStep2Desc')} />
            <StepCard step={3} icon={<Zap className="h-6 w-6" />} title={t('howItWorks.clientStep3Title')} description={t('howItWorks.clientStep3Desc')} />
            <StepCard step={4} icon={<CheckCircle className="h-6 w-6" />} title={t('howItWorks.clientStep4Title')} description={t('howItWorks.clientStep4Desc')} />
          </div>

          <p className="text-sm text-muted-foreground text-center mt-6">
            {t('howItWorks.clientAfter')}
          </p>

          <div className="text-center mt-6">
            <Button size="lg" asChild>
              <Link to="/post">
                {t('howItWorks.postJobButton')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* ── For Taskers (Professionals) ── */}
        <section className="bg-muted/30 rounded-lg p-6 sm:p-8">
          <SectionHeader
            icon={<Wrench className="h-5 w-5" />}
            label={t('howItWorks.forProfessionals')}
          />

          <div className="grid gap-6 md:grid-cols-3 mt-8">
            <StepCard step={1} icon={<ClipboardList className="h-6 w-6" />} title={t('howItWorks.proStep1Title')} description={t('howItWorks.proStep1Desc')} />
            <StepCard step={2} icon={<CheckCircle className="h-6 w-6" />} title={t('howItWorks.proStep2Title')} description={t('howItWorks.proStep2Desc')} />
            <StepCard step={3} icon={<Star className="h-6 w-6" />} title={t('howItWorks.proStep3Title')} description={t('howItWorks.proStep3Desc')} />
          </div>

          <div className="mt-8 space-y-4 max-w-xl mx-auto">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground text-sm">{t('howItWorks.proMatchTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('howItWorks.proMatchDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground text-sm">{t('howItWorks.proBadgeTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('howItWorks.proBadgeDesc')}</p>
              </div>
            </div>
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

        {/* ── Why It's Different ── */}
        <section className="max-w-2xl mx-auto">
          <h2 className="font-display text-xl font-semibold text-foreground mb-6 text-center">
            {t('howItWorks.whyTitle')}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {(['why1', 'why2', 'why3', 'why4', 'why5'] as const).map((key) => (
              <li key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                {t(`howItWorks.${key}`)}
              </li>
            ))}
          </ul>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-2xl mx-auto">
          <h2 className="font-display text-xl font-semibold text-foreground mb-6 text-center">
            {t('howItWorks.faqTitle')}
          </h2>

          <Accordion type="single" collapsible className="w-full">
            {FAQ_KEYS.map((key) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="text-left text-sm">
                  {t(`howItWorks.faq.${key}.q`)}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {t(`howItWorks.faq.${key}.a`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </PublicLayout>
  );
};

const FAQ_KEYS = [
  'account',
  'howLong',
  'isFree',
  'howMatched',
  'unverified',
  'contactPro',
  'editJob',
  'vsWhatsapp',
] as const;

/* ── Sub-components ── */

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-primary/10 text-primary">
        {icon}
      </span>
      <h2 className="font-display text-2xl font-semibold text-foreground">{label}</h2>
    </div>
  );
}

function OverviewStep({
  icon,
  number,
  title,
  desc,
}: {
  icon: React.ReactNode;
  number: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
          {number}
        </span>
      </div>
      <h3 className="font-display font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

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
      <CardContent className="pt-8 pb-6 px-5">
        <div className="absolute -top-3 -left-3 h-8 w-8 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
          {step}
        </div>
        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-sm bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default HowItWorks;
