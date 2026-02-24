import React from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout';
import { LegalSection } from './components/LegalSection';

type Section = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export default function Privacy() {
  const { t } = useTranslation('legal');

  const company = t('shared.company');
  const date = t('privacy.date');
  const email = t('privacy.email');

  const intro = t('privacy.intro', { returnObjects: true, company }) as string[];
  const sections = t('privacy.sections', { returnObjects: true, company, email }) as Section[];

  return (
    <PublicLayout>
      <div className="container max-w-3xl py-16 space-y-10">
        <header>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {t('privacy.title')}
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
            {s.bullets?.length ? (
              <ul className="list-disc pl-5 space-y-1">
                {s.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : (
              (s.paragraphs || []).map((p, i) => (
                <p key={i}>
                  <Trans
                    i18nKey={`privacy.sections.${idx}.paragraphs.${i}`}
                    ns="legal"
                    values={{ company, email }}
                    components={{
                      contactLink: (
                        <Link to="/contact" className="text-primary underline hover:text-primary/80" />
                      ),
                      emailLink: (
                        <a href={`mailto:${email}`} className="text-primary underline hover:text-primary/80" />
                      ),
                    }}
                  />
                </p>
              ))
            )}
          </LegalSection>
        ))}
      </div>
    </PublicLayout>
  );
}
