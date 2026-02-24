import React from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout';
import { LegalSection } from './components/LegalSection';

type TermsSection = {
  title: string;
  paragraphs?: string[];
  paragraphs2?: string[];
  paragraphs3?: string[];
  bullets?: string[];
  bullets1?: string[];
  bullets2?: string[];
};

export default function Terms() {
  const { t } = useTranslation('legal');

  const company = t('shared.company');
  const date = t('terms.date');
  const email = t('terms.email');

  const intro = t('terms.intro', { returnObjects: true, company }) as string[];
  const sections = t('terms.sections', { returnObjects: true, company, email }) as TermsSection[];

  return (
    <PublicLayout>
      <div className="container max-w-3xl py-16 space-y-10">
        <header>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {t('terms.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t('shared.lastUpdated', { date })}
          </p>
        </header>

        <section className="space-y-4 text-muted-foreground leading-relaxed">
          {intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        {sections.map((s, idx) => (
          <LegalSection key={idx} title={s.title}>
            {(s.paragraphs || []).map((p, i) => (
              <p key={`p-${i}`} className={i > 0 ? 'mt-3' : undefined}>
                <Trans
                  i18nKey={`terms.sections.${idx}.paragraphs.${i}`}
                  ns="legal"
                  values={{ company, email }}
                  components={{
                    disputeLink: (
                      <Link to="/dispute-policy" className="text-primary underline hover:text-primary/80" />
                    ),
                    contactLink: (
                      <Link to="/contact" className="text-primary underline hover:text-primary/80" />
                    ),
                    emailLink: (
                      <a href={`mailto:${email}`} className="text-primary underline hover:text-primary/80" />
                    ),
                  }}
                />
              </p>
            ))}

            {s.bullets1?.length ? (
              <ul className="list-disc pl-5 space-y-1 mt-2">
                {s.bullets1.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            ) : null}

            {(s.paragraphs2 || []).map((p, i) => (
              <p key={`p2-${i}`} className="mt-3">{p}</p>
            ))}

            {s.bullets2?.length ? (
              <ul className="list-disc pl-5 space-y-1 mt-2">
                {s.bullets2.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            ) : null}

            {(s.paragraphs3 || []).map((p, i) => (
              <p key={`p3-${i}`} className="mt-3">{p}</p>
            ))}

            {s.bullets?.length ? (
              <ul className="list-disc pl-5 space-y-1 mt-2">
                {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            ) : null}
          </LegalSection>
        ))}
      </div>
    </PublicLayout>
  );
}
