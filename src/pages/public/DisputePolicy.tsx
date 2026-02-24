import React from 'react';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout';
import { LegalSection } from './components/LegalSection';

type Stage = {
  title: string;
  paragraphs?: string[];
  paragraphs2?: string[];
  paragraphs3?: string[];
  bullets?: string[];
  bullets1?: string[];
  bullets2?: string[];
};

type DisputeSection = {
  title: string;
  paragraphs?: string[];
  paragraphs2?: string[];
  bullets?: string[];
  stages?: Stage[];
};

export default function DisputePolicy() {
  const { t } = useTranslation('legal');

  const company = t('shared.company');
  const date = t('dispute.date');

  const intro = t('dispute.intro', { company });
  const sections = t('dispute.sections', { returnObjects: true, company }) as DisputeSection[];

  return (
    <PublicLayout>
      <div className="container max-w-3xl py-16 space-y-10">
        <header>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {t('dispute.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t('shared.lastUpdated', { date })}
          </p>
          <p className="text-muted-foreground mt-4 leading-relaxed">{intro}</p>
        </header>

        <div className="space-y-10">
          {sections.map((s, idx) => (
            <LegalSection key={idx} title={s.title}>
              {(s.paragraphs || []).map((p, i) => (
                <p key={`p-${i}`} className={i > 0 ? 'mt-3' : undefined}>{p}</p>
              ))}

              {s.bullets?.length ? (
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              ) : null}

              {(s.paragraphs2 || []).map((p, i) => (
                <p key={`p2-${i}`} className="mt-3">{p}</p>
              ))}

              {s.stages?.length ? (
                <div className="mt-6 space-y-6">
                  {s.stages.map((st, i) => (
                    <div key={i}>
                      <h3 className="font-semibold text-foreground">{st.title}</h3>

                      {(st.paragraphs || []).map((p, j) => (
                        <p key={`sp-${j}`} className="mt-2">{p}</p>
                      ))}

                      {st.bullets1?.length ? (
                        <ul className="list-disc pl-5 space-y-1 mt-1">
                          {st.bullets1.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      ) : null}

                      {(st.paragraphs2 || []).map((p, j) => (
                        <p key={`sp2-${j}`} className="mt-2">{p}</p>
                      ))}

                      {st.bullets2?.length ? (
                        <ul className="list-disc pl-5 space-y-1 mt-1">
                          {st.bullets2.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      ) : null}

                      {st.bullets?.length ? (
                        <ul className="list-disc pl-5 space-y-1 mt-1">
                          {st.bullets.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                      ) : null}

                      {(st.paragraphs3 || []).map((p, j) => (
                        <p key={`sp3-${j}`} className="mt-2">{p}</p>
                      ))}
                    </div>
                  ))}
                </div>
              ) : null}
            </LegalSection>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
