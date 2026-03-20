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
  ArrowRight,
  Shield,
  Wrench,
  Zap,
  ClipboardList,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Handshake,
  Target,
  Users,
} from 'lucide-react';
import heroHowItWorks from '@/assets/heroes/hero-how-it-works.webp';

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

      <div className="container py-12 space-y-16">
        {/* ── Intro ── */}
        <section className="text-center max-w-2xl mx-auto">
          <p className="text-muted-foreground leading-relaxed">
            {t('howItWorks.introP1')}
            <br />
            {t('howItWorks.introP2')}
          </p>
          <p className="text-foreground font-medium mt-3">
            {t('howItWorks.introP3')}
          </p>
        </section>

        {/* ── For Clients (Askers) ── */}
        <section>
          <SectionHeader
            icon={<Users className="h-5 w-5" />}
            label={t('howItWorks.forClients')}
            sub={t('howItWorks.forClientsAka')}
          />

          <div className="grid gap-6 md:grid-cols-2 mt-8 max-w-4xl mx-auto">
            <StepCard
              step={1}
              icon={<Target className="h-6 w-6" />}
              title={t('howItWorks.clientStep1Title')}
              description={t('howItWorks.clientStep1Desc')}
              why={t('howItWorks.clientStep1Why')}
            />
            <StepCard
              step={2}
              icon={<ClipboardList className="h-6 w-6" />}
              title={t('howItWorks.clientStep2Title')}
              description={t('howItWorks.clientStep2Desc')}
              why={t('howItWorks.clientStep2Why')}
            />
            <StepCard
              step={3}
              icon={<Clock className="h-6 w-6" />}
              title={t('howItWorks.clientStep3Title')}
              description={t('howItWorks.clientStep3Desc')}
              why={t('howItWorks.clientStep3Why')}
            />
            <StepCard
              step={4}
              icon={<Zap className="h-6 w-6" />}
              title={t('howItWorks.clientStep4Title')}
              description={t('howItWorks.clientStep4Desc')}
              why={t('howItWorks.clientStep4Why')}
            >
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-foreground">
                  {t('howItWorks.clientStep4Matching')}
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5 pl-3">
                  {(['clientStep4Match1', 'clientStep4Match2', 'clientStep4Match3', 'clientStep4Match4', 'clientStep4Match5'] as const).map((k) => (
                    <li key={k} className="flex items-start gap-1.5">
                      <CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      {t(`howItWorks.${k}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </StepCard>
          </div>

          <p className="text-sm text-muted-foreground text-center mt-8 italic max-w-lg mx-auto">
            {t('howItWorks.clientClosing')}
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

        {/* ── For Professionals (Taskers) ── */}
        <section className="bg-muted/30 rounded-lg p-6 sm:p-10">
          <SectionHeader
            icon={<Wrench className="h-5 w-5" />}
            label={t('howItWorks.forProfessionals')}
            sub={t('howItWorks.forProfessionalsAka')}
          />

          <div className="grid gap-6 md:grid-cols-3 mt-8 max-w-4xl mx-auto">
            <StepCard
              step={1}
              icon={<Target className="h-6 w-6" />}
              title={t('howItWorks.proStep1Title')}
              description={t('howItWorks.proStep1Desc')}
              why={t('howItWorks.proStep1Why')}
            />
            <StepCard
              step={2}
              icon={<ClipboardList className="h-6 w-6" />}
              title={t('howItWorks.proStep2Title')}
              description={t('howItWorks.proStep2Desc')}
              why={t('howItWorks.proStep2Why')}
            />
            <StepCard
              step={3}
              icon={<MessageSquare className="h-6 w-6" />}
              title={t('howItWorks.proStep3Title')}
              description={t('howItWorks.proStep3Desc')}
              why={t('howItWorks.proStep3Why')}
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

        {/* ── Why This Structure Exists ── */}
        <section className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t('howItWorks.whyExistsTitle')}
            </h2>
          </div>
          <p className="text-muted-foreground text-center mb-4">
            {t('howItWorks.whyExistsIntro')}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 max-w-lg mx-auto">
            {(['whyExists1', 'whyExists2', 'whyExists3', 'whyExists4', 'whyExists5', 'whyExists6'] as const).map((k) => (
              <li key={k} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {t(`howItWorks.${k}`)}
              </li>
            ))}
          </ul>
          <p className="text-foreground font-medium text-center mt-6">
            {t('howItWorks.whyExistsClosing')}
          </p>
        </section>

        {/* ── Standards ── */}
        <section className="max-w-2xl mx-auto bg-card border border-border/70 rounded-lg p-6 sm:p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Handshake className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              {t('howItWorks.standardsTitle')}
            </h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t('howItWorks.standards1')}</p>
            <p>{t('howItWorks.standards2')}</p>
          </div>
          <div className="mt-6 pt-5 border-t border-border/50">
            <p className="text-sm font-semibold text-foreground">
              {t('howItWorks.standardsVerifyTitle')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('howItWorks.standardsVerifyIntro')}
            </p>
            <ul className="mt-2 space-y-1">
              {(['standardsVerify1', 'standardsVerify2', 'standardsVerify3', 'standardsVerify4'] as const).map((k) => (
                <li key={k} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                  {t(`howItWorks.${k}`)}
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium text-foreground mt-4">
              {t('howItWorks.standardsClosing')}
            </p>
          </div>
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

/* ── Sub-components ── */

function SectionHeader({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-primary/10 text-primary">
        {icon}
      </span>
      <h2 className="font-display text-2xl font-semibold text-foreground">{label}</h2>
      {sub && <span className="text-muted-foreground text-sm">{sub}</span>}
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
  why,
  children,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  why: string;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation('common');

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
        {children}
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs font-medium text-primary/80 mb-0.5">{t('howItWorks.whyThisMatters')}</p>
          <p className="text-xs text-muted-foreground">{why}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default HowItWorks;
