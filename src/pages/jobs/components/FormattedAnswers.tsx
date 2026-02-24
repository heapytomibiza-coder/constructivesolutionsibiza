import { useTranslation } from 'react-i18next';
import { txMicro } from '@/i18n/taxonomyTranslations';
import type { ResolvedServicePack } from "@/pages/jobs/lib/buildJobPack";

interface FormattedAnswersProps {
  services: ResolvedServicePack[];
}

/** Normalize a key string for i18n lookup (matches QuestionPackRenderer norm) */
const norm = (s: string): string =>
  (s || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

/**
 * Pure component that renders resolved service packs with human-readable labels.
 * Translates question labels and answer values using the questions namespace.
 */
export function FormattedAnswers({ services }: FormattedAnswersProps) {
  const { t } = useTranslation('questions');

  if (!services.length) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('noAnswers', 'No specific answers provided.')}
      </div>
    );
  }

  /** Translate an answer value using rawValue (snake_case DB key) first, falling back to displayValue */
  const translateValue = (rawValue: string | string[], displayValue: string): string => {
    // Handle arrays (checkbox answers)
    if (Array.isArray(rawValue)) {
      return rawValue.map(v => {
        const translated = t(`options.${v}`, { defaultValue: '' });
        return translated || v;
      }).join(', ');
    }
    // Single value — look up by raw snake_case key
    const byRaw = t(`options.${rawValue}`, { defaultValue: '' });
    if (byRaw) return byRaw;
    // Fallback to normalized displayValue
    const key = norm(displayValue);
    const byDisplay = t(`options.${key}`, { defaultValue: '' });
    return byDisplay || displayValue;
  };

  /** Translate a question label */
  const translateLabel = (label: string): string => {
    const key = norm(label);
    const translated = t(`labels.${key}`, { defaultValue: '' });
    return translated || label;
  };

  return (
    <div className="space-y-5">
      {services.map((service) => (
        <div key={service.slug} className="space-y-3">
          <div className="text-sm font-semibold text-foreground">
            {txMicro(service.slug, t, service.title)}
            {service.isFallback && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({t('loadingLabels', 'loading labels…')})
              </span>
            )}
          </div>
          <ul className="grid gap-2">
            {service.answers.map((answer) => (
              <li key={answer.questionId} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-primary/60">•</span>
                <div className="flex-1">
                  <span className="text-muted-foreground">{translateLabel(answer.questionLabel)}:</span>{" "}
                  <span className="font-medium">{translateValue(answer.displayValue)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
