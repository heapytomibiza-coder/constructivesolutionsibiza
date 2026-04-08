/**
 * QuestionsStep - One question at a time, tile-based selection
 * Mobile-first: no scrolling, quick taps, animated transitions
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Check, ChevronLeft, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { txMicro } from '@/i18n/taxonomyTranslations';
import type { WizardState } from '../types';

// Question definition from the pack
interface QuestionDef {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'file' | 'single_select' | 'multi_select';
  options?: (string | { value: string; label: string })[];
  required?: boolean;
  placeholder?: string;
  help?: string;
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
  question_order?: string[];
}

type QualityTier = 'strong' | 'generic' | 'fallback';

const GENERIC_PHRASES = [
  'briefly describe',
  'describe your project',
  'please describe',
  'what do you need help with',
  'tell us about',
];

function getPackQualityTier(pack: QuestionPack): QualityTier {
  if (pack.micro_slug === 'general-project') return 'fallback';
  const firstQ = pack.questions[0];
  const label = (firstQ?.label || '').toLowerCase();
  if (GENERIC_PHRASES.some(phrase => label.includes(phrase))) {
    return 'generic';
  }
  return pack.questions.length >= 5 ? 'strong' : 'generic';
}

function determinePackTracking(
  primarySlug: string | null,
  packs: QuestionPack[]
): { source: 'strong' | 'generic' | 'fallback'; missing: boolean } {
  const usedFallback = packs.some(p => p.micro_slug === 'general-project');
  if (usedFallback || packs.length === 0) {
    return { source: 'fallback', missing: true };
  }
  const primaryPack = packs.find(p => p.micro_slug === primarySlug);
  if (!primaryPack) {
    return { source: 'fallback', missing: true };
  }
  const tier = getPackQualityTier(primaryPack);
  if (tier === 'fallback') {
    return { source: 'fallback', missing: true };
  }
  return { source: tier, missing: false };
}

// Normalize option to {value, label}
const normalizeOption = (opt: string | { value: string; label: string }) => {
  if (typeof opt === 'string') return { value: opt, label: opt };
  return opt;
};

// Normalize type aliases
const normalizeType = (type: string): QuestionDef['type'] => {
  switch (type) {
    case 'single_select': return 'radio';
    case 'multi_select': return 'checkbox';
    case 'long_text': return 'textarea';
    default: return type as QuestionDef['type'];
  }
};

// Question IDs handled by Logistics step - exact matches or suffix patterns
const LOGISTICS_EXACT_IDS = new Set(['timeline', 'timing', 'urgency', 'preferred_timing', 'start_timeline']);
const LOGISTICS_SUFFIXES = ['_urgency', '_timing', '_timeline'];

const isLogisticsHandled = (questionId: string): boolean => {
  if (LOGISTICS_EXACT_IDS.has(questionId)) return true;
  return LOGISTICS_SUFFIXES.some(suffix => questionId.endsWith(suffix));
};

// Types that show as tappable tiles (number also rendered but with input)
const TILE_TYPES = new Set(['radio', 'select', 'checkbox', 'single_select', 'multi_select', 'number']);

interface Props {
  microSlugs: string[];
  answers: WizardState['answers'];
  onChange: (answers: WizardState['answers']) => void;
  onPacksLoaded?: (packs: QuestionPack[]) => void;
  onComplete?: () => void;
  onAutoSkip?: () => void;
  errors?: Record<string, Record<string, string>>;
}

export function QuestionsStep({ microSlugs, answers, onChange, onPacksLoaded, onComplete, onAutoSkip, errors }: Props) {
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

  /** Translate an option label using the questions namespace (value-first strategy) */
  const tOptionLabel = (opt: { value: string; label: string }): string => {
    const valueKey = norm(opt.value);
    const normalizedKey = normalizeOptionKey(opt.value);
    // Try exact value key, then normalized snake_case key
    const byValue = t(`questions:options.${valueKey}`, { defaultValue: '' });
    if (byValue) return byValue;
    if (normalizedKey !== valueKey) {
      const byNorm = t(`questions:options.${normalizedKey}`, { defaultValue: '' });
      if (byNorm) return byNorm;
    }
    // Fallback to label-based key
    const labelKey = norm(opt.label);
    const byLabel = t(`questions:options.${labelKey}`, { defaultValue: '' });
    if (byLabel) return byLabel;
    const byLabelNorm = t(`questions:options.${normalizeOptionKey(opt.label)}`, { defaultValue: '' });
    return byLabelNorm || opt.label;
  };
  const [packs, setPacks] = useState<QuestionPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const answersRef = useRef(answers);
  const onChangeRef = useRef(onChange);
  const trackingInjectedRef = useRef(false);
  
  useEffect(() => {
    answersRef.current = answers;
    onChangeRef.current = onChange;
  }, [answers, onChange]);
  
  useEffect(() => {
    trackingInjectedRef.current = false;
  }, [microSlugs]);

  // Fetch packs with timeout
  useEffect(() => {
    if (!microSlugs.length) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort('timeout'), 5000);

    const fetchPacks = async () => {
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('question_packs')
          .select('id, micro_slug, title, questions')
          .in('micro_slug', microSlugs)
          .eq('is_active', true)
          .order('micro_slug')
          .abortSignal(controller.signal);

        if (cancelled) return;
        if (error) throw error;

        const foundSlugs = new Set((data || []).map(p => p.micro_slug));
        const missing = microSlugs.filter(slug => !foundSlugs.has(slug));
        
        let parsedPacks: QuestionPack[] = (data || []).map(p => ({
          id: p.id,
          micro_slug: p.micro_slug,
          title: p.title,
          questions: (p.questions as unknown as QuestionDef[]) || [],
        }));

        if (parsedPacks.length === 0) {
          const { data: fallback } = await supabase
            .from('question_packs')
            .select('id, micro_slug, title, questions')
            .eq('micro_slug', 'general-project')
            .eq('is_active', true)
            .single();

          if (fallback) {
            parsedPacks = [{
              id: fallback.id,
              micro_slug: 'general-project',
              title: fallback.title,
              questions: (fallback.questions as unknown as QuestionDef[]) || [],
            }];
          }
        }
        
        if (!trackingInjectedRef.current) {
          const primarySlug = microSlugs[0] || null;
          const { source, missing: isMissing } = determinePackTracking(primarySlug, parsedPacks);
          
          const shouldUpdate =
            answersRef.current._pack_source !== source ||
            answersRef.current._pack_slug !== primarySlug ||
            answersRef.current._pack_missing !== isMissing;
          
          if (shouldUpdate) {
            onChangeRef.current({
              ...answersRef.current,
              _pack_source: source,
              _pack_slug: primarySlug,
              _pack_missing: isMissing,
            });
          }
          trackingInjectedRef.current = true;
        }
        
        setPacks(parsedPacks);
        setLoading(false);
        
        if (onPacksLoaded) {
          onPacksLoaded(parsedPacks);
        }
      } catch (err: any) {
        if (cancelled) return;
        console.warn('Question packs fetch failed/timed out:', err?.message);
        trackEvent('wizard_step_timeout', 'client', {
          step: 'questions',
          micro_slugs: microSlugs,
        });
        setPacks([]);
        setLoading(false);
        onAutoSkip?.();
      } finally {
        clearTimeout(timeout);
      }
    };

    fetchPacks();
    return () => { cancelled = true; controller.abort('cleanup'); clearTimeout(timeout); };
  }, [microSlugs, onPacksLoaded]);

  // Initialize answers structure
  useEffect(() => {
    if (!packs.length) return;

    const microAnswers = (answers.microAnswers as Record<string, Record<string, unknown>>) || {};
    let hasChanges = false;

    packs.forEach(pack => {
      if (!microAnswers[pack.micro_slug]) {
        microAnswers[pack.micro_slug] = {};
        hasChanges = true;
      }
    });

    if (hasChanges) {
      onChange({ ...answers, microAnswers });
    }
  }, [packs, answers, onChange]);

  // Blocked question types (text inputs not used in tile-only flow)
  const BLOCKED_TYPES = new Set(['text', 'textarea', 'long_text', 'file']);

  // Build a label-based dedup map so shared questions across packs are asked only once
  const { visibleQuestions, sharedLabelMap, totalRawCount, pairToKey } = useMemo(() => {
    type SharedEntry = { packSlug: string; questionId: string; question: QuestionDef };
    const questions: { pack: QuestionPack; question: QuestionDef }[] = [];
    const labelMap = new Map<string, SharedEntry[]>();
    const reverseLookup = new Map<string, string>(); // "${packSlug}::${questionId}" -> dedupeKey
    const addedLabels = new Set<string>();
    let rawCount = 0;
    
    packs.forEach(pack => {
      const packQuestions = pack.questions || [];
      
      const seen = new Set<string>();
      packQuestions.forEach(q => {
        const key = q.id?.trim();
        if (!key || seen.has(key)) return;
        if (isLogisticsHandled(q.id)) return;
        
        const normalizedType = normalizeType(q.type);
        // Fix 3: blocklist instead of allowlist, allow number type
        if (BLOCKED_TYPES.has(normalizedType) || BLOCKED_TYPES.has(q.type)) {
          console.warn(`Blocked question type "${normalizedType}" for ${q.id}`);
          return;
        }
        
        // Check conditional visibility
        const dep = q.show_if || q.dependsOn;
        if (dep?.questionId) {
          const microAnswers = answers.microAnswers as Record<string, Record<string, unknown>>;
          const depValue = microAnswers?.[pack.micro_slug]?.[dep.questionId];
          
          const depValueArr = Array.isArray(depValue)
            ? depValue.map(String)
            : depValue != null ? [String(depValue)] : [];
          
          const requiredArr = Array.isArray(dep.value)
            ? dep.value.map(String)
            : [String(dep.value)];
          
          const shouldShow = requiredArr.some(v => depValueArr.includes(v));
          if (!shouldShow) return;
        }
        
        seen.add(key);
        rawCount++;
        
        // Fix 1: dedupe key priority chain
        const baseKey =
          (q as any).canonical_key ||
          (q as any).dedupe_key ||
          q.label.trim().toLowerCase();

        // Fix 2: conditional questions always get pack-scoped key (skip cross-pack dedup)
        const isConditional = Boolean(q.show_if || q.dependsOn);
        let dedupeKey = isConditional ? `${pack.micro_slug}::${q.id}` : baseKey;
        
        // Fix 7: conflict detection for mismatched dedup candidates
        if (!isConditional && labelMap.has(dedupeKey)) {
          const existing = labelMap.get(dedupeKey)![0];
          const existingQ = existing.question;
          const typesMatch = normalizeType(existingQ.type) === normalizeType(q.type);
          const optionsMatch = JSON.stringify(existingQ.options) === JSON.stringify(q.options);
          
          if (!typesMatch || !optionsMatch) {
            console.warn(`Question conflict for key "${dedupeKey}": different structure`);
            dedupeKey = `${pack.micro_slug}::${q.id}`;
          }
        }
        
        // Track all pack/question pairs for this dedup key
        if (!labelMap.has(dedupeKey)) {
          labelMap.set(dedupeKey, []);
        }
        labelMap.get(dedupeKey)!.push({ packSlug: pack.micro_slug, questionId: q.id, question: q });
        
        // Patch A: build fast reverse lookup
        reverseLookup.set(`${pack.micro_slug}::${q.id}`, dedupeKey);
        
        // Only add the first occurrence to visible questions
        if (!addedLabels.has(dedupeKey)) {
          addedLabels.add(dedupeKey);
          questions.push({ pack, question: { ...q, type: normalizeType(q.type) } });
        }
      });
    });
    
    return { visibleQuestions: questions, sharedLabelMap: labelMap, totalRawCount: rawCount, pairToKey: reverseLookup };
  }, [packs, answers]);

  const handleAnswerChange = useCallback((microSlug: string, questionId: string, value: unknown) => {
    const microAnswers = (answers.microAnswers as Record<string, Record<string, unknown>>) || {};
    
    const updated = {
      ...microAnswers,
      [microSlug]: {
        ...(microAnswers[microSlug] || {}),
        [questionId]: value,
      },
    };
    
    // Patch B: constant-time cross-pack sync via pairToKey
    const pairKey = `${microSlug}::${questionId}`;
    const dedupeKey = pairToKey.get(pairKey);
    const shared = dedupeKey ? sharedLabelMap.get(dedupeKey) : null;
    if (shared && shared.length > 1) {
      for (const { packSlug, questionId: qId } of shared) {
        if (packSlug === microSlug && qId === questionId) continue;
        updated[packSlug] = {
          ...(updated[packSlug] || {}),
          [qId]: value,
        };
      }
    }
    
    onChange({ ...answers, microAnswers: updated });
  }, [answers, onChange, sharedLabelMap, pairToKey]);

  const getAnswer = useCallback((microSlug: string, questionId: string): unknown => {
    const microAnswers = answers.microAnswers as Record<string, Record<string, unknown>>;
    return microAnswers?.[microSlug]?.[questionId];
  }, [answers]);

  // Auto-advance for single-select
  const handleTileSelect = useCallback((
    pack: QuestionPack,
    question: QuestionDef,
    optionValue: string,
    isMulti: boolean
  ) => {
    if (isMulti) {
      // Toggle checkbox
      const current = (getAnswer(pack.micro_slug, question.id) as string[]) || [];
      const isChecked = current.includes(optionValue);
      const newValue = isChecked
        ? current.filter(v => v !== optionValue)
        : [...current, optionValue];
      handleAnswerChange(pack.micro_slug, question.id, newValue);
    } else {
      // Single select - set and auto-advance
      handleAnswerChange(pack.micro_slug, question.id, optionValue);
      
      // Auto-advance after short delay
      setTimeout(() => {
        if (currentIndex < visibleQuestions.length - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      }, 250);
    }
  }, [getAnswer, handleAnswerChange, currentIndex, visibleQuestions.length]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < visibleQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, visibleQuestions.length]);

  // Auto-advance when no questions (placed at top level, not inside condition)
  const noQuestionsRef = useRef(false);
  useEffect(() => {
    if (!loading && visibleQuestions.length === 0 && onComplete && !noQuestionsRef.current) {
      noQuestionsRef.current = true;
      const timer = setTimeout(onComplete, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, visibleQuestions.length, onComplete]);

  // Build per-pack question ranges for the task progress indicator
  const packRanges = useMemo(() => {
    const ranges: { slug: string; title: string; startIdx: number; endIdx: number }[] = [];
    let currentSlug = '';
    visibleQuestions.forEach((vq, idx) => {
      if (vq.pack.micro_slug !== currentSlug) {
        currentSlug = vq.pack.micro_slug;
        ranges.push({ slug: currentSlug, title: vq.pack.title, startIdx: idx, endIdx: idx });
      } else {
        ranges[ranges.length - 1].endIdx = idx;
      }
    });
    return ranges;
  }, [visibleQuestions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-muted-foreground">{t('questions.loading')}</p>
      </div>
    );
  }

  if (!visibleQuestions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold mb-1">{t('questions.allSet')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('questions.noQuestionsNeeded')}
          </p>
        </div>
        <Button onClick={onComplete} className="mt-4">
          {t('buttons.continue')}
        </Button>
      </div>
    );
  }

  const current = visibleQuestions[currentIndex];
  const { pack, question } = current;
  const isMulti = question.type === 'checkbox' || question.type === 'multi_select';
  const isNumber = question.type === 'number';
  const currentValue = getAnswer(pack.micro_slug, question.id);
  const selectedValues = isMulti 
    ? (Array.isArray(currentValue) ? currentValue as string[] : [])
    : (currentValue as string) || '';
  const hasAnswer = isNumber ? currentValue != null && currentValue !== '' : isMulti ? selectedValues.length > 0 : !!selectedValues;

  const currentPackRange = packRanges.find(
    r => currentIndex >= r.startIdx && currentIndex <= r.endIdx
  );
  const currentPackIdx = currentPackRange ? packRanges.indexOf(currentPackRange) : 0;

  return (
    <div className="flex flex-col min-h-[400px]">
      {/* Fix 6: dedup helper note */}
      {packs.length > 1 && totalRawCount > visibleQuestions.length && (
        <p className="text-xs text-muted-foreground mb-2">
          {t('questions.dedupNote', { defaultValue: "We've combined overlapping questions so you only answer once." })}
        </p>
      )}

      {/* Task context indicator — shown when multiple tasks were selected */}
      {packRanges.length > 1 && currentPackRange && (
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>
              {t('questions.taskProgress', {
                current: currentPackIdx + 1,
                total: packRanges.length,
                defaultValue: 'Task {{current}} of {{total}}'
              })}
            </span>
          </div>
          {/* Mini dots for each task */}
          <div className="flex items-center gap-1.5">
            {packRanges.map((range, idx) => (
              <div key={range.slug} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    idx === currentPackIdx
                      ? 'bg-primary w-6'
                      : idx < currentPackIdx
                        ? 'bg-primary/40 w-2'
                        : 'bg-muted-foreground/20 w-2'
                  )}
                />
              </div>
            ))}
            <span className="ml-2 text-xs text-muted-foreground truncate max-w-[200px]">
              {txMicro(currentPackRange.slug, t, currentPackRange.title)}
            </span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {t('questions.questionOf', { current: currentIndex + 1, total: visibleQuestions.length })}
          </span>
          {currentIndex > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('questions.back')}
            </button>
          )}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
            style={{ width: `${((currentIndex + 1) / visibleQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 animate-fade-in" key={question.id}>
        {/* Single-pack service label (when only 1 task but questions exist) */}
        {packRanges.length === 1 && (
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
            {txMicro(pack.micro_slug, t, pack.title)}
          </p>
        )}
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          {tLabel(question.label)}
          {question.required && <span className="text-destructive ml-1">*</span>}
        </h3>
        
        {question.help && (
          <p className="text-sm text-muted-foreground mb-4">{question.help}</p>
        )}
        
        {isMulti && (
          <p className="text-sm text-muted-foreground mb-4">
            {t('questions.selectAll')}
          </p>
        )}

        {/* Tile options (for select types) */}
        {question.type !== 'number' && (
          <div className="grid gap-3 mt-4">
            {question.options?.map((opt) => {
              const option = normalizeOption(opt);
              const isSelected = isMulti
                ? selectedValues.includes(option.value)
                : selectedValues === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTileSelect(pack, question, option.value, isMulti)}
                  className={cn(
                    'relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200',
                    'min-h-[60px] flex items-center gap-4',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    'active:scale-[0.98]',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                      isMulti && 'rounded-lg',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground scale-110'
                        : 'border-muted-foreground/30 bg-background'
                    )}
                  >
                    {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                  </div>
                  <span
                    className={cn(
                      'flex-1 text-base font-medium transition-colors',
                      isSelected ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {tOptionLabel(option)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Number input (Fix 3) */}
        {question.type === 'number' && (
          <div className="mt-4">
            <input
              type="number"
              value={currentValue != null ? String(currentValue) : ''}
              onChange={(e) => {
                const val = e.target.value === '' ? undefined : Number(e.target.value);
                handleAnswerChange(pack.micro_slug, question.id, val);
              }}
              min={(question as any).min}
              max={(question as any).max}
              step={(question as any).step || 1}
              placeholder={question.placeholder || ''}
              className="w-full p-4 rounded-xl border-2 border-border bg-card text-foreground text-lg font-medium focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        )}

        {/* Error display */}
        {errors?.[pack.micro_slug]?.[question.id] && (
          <p className="text-sm text-destructive mt-3 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            {errors[pack.micro_slug][question.id]}
          </p>
        )}
      </div>

      {/* Continue button for multi-select, number inputs, or last question */}
      {((isMulti && hasAnswer && currentIndex < visibleQuestions.length - 1) ||
        (isNumber && hasAnswer) ||
        (currentIndex === visibleQuestions.length - 1 && hasAnswer)) && (
        <div className="mt-6 pt-4 border-t">
          <Button
            onClick={currentIndex < visibleQuestions.length - 1 ? goNext : onComplete}
            className="w-full"
            size="lg"
            data-wizard-questions-complete={currentIndex === visibleQuestions.length - 1}
          >
            {currentIndex === visibleQuestions.length - 1 ? `✓ ${t('questions.continueToNext')}` : t('buttons.continue')}
          </Button>
        </div>
      )}
    </div>
  );
}

export default QuestionsStep;
