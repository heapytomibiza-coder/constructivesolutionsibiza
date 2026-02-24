/**
 * QuestionPackRenderer - Renders a single question pack with mobile-first UX
 * Large touch-friendly cards, smooth animations, easy-on-the-eye design
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Option can be a string OR {value, label} object
interface QuestionOption {
  value: string;
  label: string;
}

type OptionType = string | QuestionOption;

// Helper to normalize options to {value, label}
const normalizeOption = (opt: OptionType): QuestionOption => {
  if (typeof opt === 'string') {
    return { value: opt, label: opt };
  }
  return opt;
};

// --- V2 helpers -------------------------------------------------------------

const normalizeQuestionType = (
  type: string,
): QuestionDef['type'] => {
  switch (type) {
    case 'single_select':
      return 'radio';
    case 'multi_select':
      return 'checkbox';
    case 'long_text':
      return 'textarea';
    default:
      return type as QuestionDef['type'];
  }
};

const normalizeAccept = (accept?: string | string[]): string => {
  if (!accept) return 'image/*';
  return Array.isArray(accept) ? accept.join(',') : accept;
};

const getOrderedQuestions = (pack: QuestionPack): QuestionDef[] => {
  const questions = pack.questions || [];
  const order = pack.question_order;

  if (!order?.length) return questions;

  const byId = new Map(questions.map((q) => [q.id, q]));
  const ordered = order
    .map((id) => byId.get(id))
    .filter(Boolean) as QuestionDef[];

  const unordered = questions.filter((q) => !order.includes(q.id));
  return [...ordered, ...unordered];
};

// Question definition from the pack
interface QuestionDef {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'file';

  options?: OptionType[];
  required?: boolean;
  placeholder?: string;
  help?: string;

  // V2 compatibility
  accept?: string | string[];
  min?: number;
  max?: number;
  step?: number;

  show_if?: {
    questionId: string;
    value: string | string[];
  };
  dependsOn?: {
    questionId: string;
    value: string | string[];
  };
}

interface QuestionPack {
  id: string;
  micro_slug: string;
  title: string;
  questions: QuestionDef[];

  // V2 optional ordering
  question_order?: string[];
}

interface Props {
  pack: QuestionPack;
  getAnswer: (microSlug: string, questionId: string) => unknown;
  onAnswerChange: (microSlug: string, questionId: string, value: unknown) => void;
  errors?: Record<string, string>; // question_id -> error message
}

// Question IDs that are handled by Step 5 (Logistics) and should not appear in Step 4
// Matches exact IDs or suffix patterns like "ac_installation_06_urgency"
const LOGISTICS_EXACT_IDS = new Set([
  'timeline',
  'timing',
  'urgency',
  'preferred_timing',
  'start_timeline',
]);
const LOGISTICS_SUFFIXES = ['_urgency', '_timing', '_timeline'];

const isLogisticsHandled = (questionId: string): boolean => {
  if (LOGISTICS_EXACT_IDS.has(questionId)) return true;
  return LOGISTICS_SUFFIXES.some(suffix => questionId.endsWith(suffix));
};

/**
 * OptionCard - Large touch-friendly selectable card for radio/checkbox options
 */
function OptionCard({
  option,
  isSelected,
  isMulti,
  onSelect,
}: {
  option: QuestionOption;
  isSelected: boolean;
  isMulti: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative w-full text-left p-4 rounded-lg border-2 transition-all duration-200',
        'min-h-[56px] flex items-center gap-3',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'active:scale-[0.98]',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
      )}
    >
      {/* Selection indicator */}
      <div
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
          isMulti && 'rounded-md',
          isSelected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/30 bg-background'
        )}
      >
        {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
      </div>

      {/* Label */}
      <span
        className={cn(
          'flex-1 text-base font-medium transition-colors',
          isSelected ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {option.label}
      </span>
    </button>
  );
}

export function QuestionPackRenderer({ pack, getAnswer, onAnswerChange, errors }: Props) {
  const { t } = useTranslation(['wizard', 'questions']);

  /** Normalize a key string to avoid misses from dash/quote/spacing differences */
  const norm = (s: string): string =>
    (s || '')
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[–—]/g, '-')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');

  /** Translate a question label using the questions namespace */
  const tLabel = (label: string): string => {
    const key = norm(label);
    const translated = t(`questions:labels.${key}`, { defaultValue: '' });
    return translated || label;
  };

  /** Normalize an option value to a stable i18n key (snake_case, lowercase) */
  const normalizeOptionKey = (v: string): string =>
    v.trim().toLowerCase().replace(/[^\w]+/g, '_');

  /** Translate an option using value-first strategy (stable), fallback to label */
  const tOption = (opt: QuestionOption): string => {
    const valueKey = norm(opt.value);
    const normalizedKey = normalizeOptionKey(opt.value);

    // Prefer stable value-based key
    const byValue = t(`questions:options.${valueKey}`, { defaultValue: '' });
    if (byValue) return byValue;

    // Try normalized snake_case key
    if (normalizedKey !== valueKey) {
      const byNorm = t(`questions:options.${normalizedKey}`, { defaultValue: '' });
      if (byNorm) return byNorm;
    }

    // Fallback to label-based key (legacy)
    const labelKey = norm(opt.label);
    const byLabel = t(`questions:options.${labelKey}`, { defaultValue: '' });

    if (import.meta.env.DEV && !(byValue || byLabel)) {
      // eslint-disable-next-line no-console
      console.warn('[i18n missing option]', { valueKey, normalizedKey, labelKey });
    }

    return byLabel || opt.label;
  };

  /** Localize an option - translate its label while preserving the value */
  const localizeOption = (opt: OptionType): QuestionOption => {
    const normalized = normalizeOption(opt);
    return {
      value: normalized.value,
      label: tOption(normalized),
    };
  };
  
  // Normalize + order questions once (V2 safe)
  const normalizedOrderedQuestions = useMemo(() => {
    const ordered = getOrderedQuestions(pack);
    return ordered.map((q) => ({
      ...q,
      type: normalizeQuestionType(q.type),
    }));
  }, [pack]);

  // UI protection: dedupe questions by id or label
  const uniqueQuestions = useMemo(() => {
    const seen = new Set<string>();
    return (normalizedOrderedQuestions || []).filter((q) => {
      const key = q?.id?.trim() || q?.label?.trim()?.toLowerCase();
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [normalizedOrderedQuestions]);

  // Conditional visibility check
  const shouldShowQuestion = (question: QuestionDef): boolean => {
    const dep = question.show_if || question.dependsOn;
    if (!dep?.questionId) return true;

    const depValue = getAnswer(pack.micro_slug, dep.questionId);

    const depValueArr = Array.isArray(depValue)
      ? depValue.map(String)
      : depValue != null
        ? [String(depValue)]
        : [];

    const requiredArr = Array.isArray(dep.value)
      ? dep.value.map(String)
      : [String(dep.value)];

    return requiredArr.some((v) => depValueArr.includes(v));
  };

  const renderQuestion = (question: QuestionDef) => {
    const value = getAnswer(pack.micro_slug, question.id);
    const key = `${pack.micro_slug}-${question.id}`;

    switch (question.type) {
      case 'text':
        return (
          <Input
            id={key}
            type="text"
            placeholder={question.placeholder}
            value={(value as string) ?? ''}
            onChange={(e) => onAnswerChange(pack.micro_slug, question.id, e.target.value)}
            className="h-12 text-base"
          />
        );

      case 'number':
        return (
          <Input
            id={key}
            type="number"
            placeholder={question.placeholder}
            value={(value as number | string) ?? ''}
            min={question.min}
            max={question.max}
            step={question.step}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                onAnswerChange(pack.micro_slug, question.id, null);
                return;
              }
              const parsed = Number(raw);
              onAnswerChange(pack.micro_slug, question.id, Number.isNaN(parsed) ? null : parsed);
            }}
            className="h-12 text-base"
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={key}
            placeholder={question.placeholder}
            value={(value as string) ?? ''}
            onChange={(e) => onAnswerChange(pack.micro_slug, question.id, e.target.value)}
            rows={3}
            className="text-base"
          />
        );

      case 'file': {
        const fileNames = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div className="space-y-2">
            <Input
              id={key}
              type="file"
              accept={normalizeAccept(question.accept)}
              onChange={(e) => {
                const files = e.target.files;
                onAnswerChange(
                  pack.micro_slug,
                  question.id,
                  files ? Array.from(files).map((f) => f.name) : [],
                );
              }}
              className="cursor-pointer h-12"
            />
            {fileNames.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {t('wizard:questions.selectedFiles', { files: fileNames.join(', ') })}{' '}
                <span className="italic">{t('wizard:questions.uploadsAfterPost')}</span>
              </p>
            )}
          </div>
        );
      }

      case 'radio':
      case 'select': {
        const selectedValue = (value as string) ?? '';
        return (
          <div className="grid gap-2">
            {question.options?.map((opt) => {
              const option = localizeOption(opt);
              const originalOption = normalizeOption(opt);
              return (
                <OptionCard
                  key={originalOption.value}
                  option={option}
                  isSelected={selectedValue === originalOption.value}
                  isMulti={false}
                  onSelect={() => onAnswerChange(pack.micro_slug, question.id, originalOption.value)}
                />
              );
            })}
          </div>
        );
      }

      case 'checkbox': {
        const selectedOptions = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div className="grid gap-2">
            {question.options?.map((opt) => {
              const option = localizeOption(opt);
              const originalOption = normalizeOption(opt);
              const isChecked = selectedOptions.includes(originalOption.value);
              return (
                <OptionCard
                  key={originalOption.value}
                  option={option}
                  isSelected={isChecked}
                  isMulti={true}
                  onSelect={() => {
                    const newSelected = isChecked
                      ? selectedOptions.filter((o) => o !== originalOption.value)
                      : [...selectedOptions, originalOption.value];
                    onAnswerChange(pack.micro_slug, question.id, newSelected);
                  }}
                />
              );
            })}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Filter out logistics-handled questions AND apply conditional visibility
  const visibleQuestions = uniqueQuestions
    .filter((q) => !isLogisticsHandled(q.id))
    .filter(shouldShowQuestion);

  return (
    <div className="space-y-6">
      {visibleQuestions.map((question, index) => (
        <div
          key={question.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Question card container */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Label
                htmlFor={`${pack.micro_slug}-${question.id}`}
                className="text-base font-semibold text-foreground leading-snug"
              >
                {tLabel(question.label)}
                {question.required && question.type !== 'file' && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
            </div>

            {question.help && (
              <p className="text-sm text-muted-foreground -mt-1">{question.help}</p>
            )}

            {renderQuestion(question)}

            {errors?.[question.id] && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive" />
                {errors[question.id]}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
