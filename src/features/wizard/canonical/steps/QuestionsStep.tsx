/**
 * QuestionsStep - One question at a time, tile-based selection
 * Mobile-first: no scrolling, quick taps, animated transitions
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Check, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

// Types that show as tappable tiles
const TILE_TYPES = new Set(['radio', 'select', 'checkbox', 'single_select', 'multi_select']);

interface Props {
  microSlugs: string[];
  answers: Record<string, unknown>;
  onChange: (answers: Record<string, unknown>) => void;
  onPacksLoaded?: (packs: QuestionPack[]) => void;
  onComplete?: () => void; // Called when user finishes all questions
  errors?: Record<string, Record<string, string>>;
}

export function QuestionsStep({ microSlugs, answers, onChange, onPacksLoaded, onComplete, errors }: Props) {
  const { t } = useTranslation('wizard');
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

  // Fetch packs
  useEffect(() => {
    if (!microSlugs.length) {
      setLoading(false);
      return;
    }

    const fetchPacks = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('question_packs')
        .select('id, micro_slug, title, questions')
        .in('micro_slug', microSlugs)
        .eq('is_active', true)
        .order('micro_slug');

      if (error) {
        console.error('Failed to fetch question packs:', error);
        setLoading(false);
        return;
      }

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
    };

    fetchPacks();
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

  // Get flattened list of visible questions
  const visibleQuestions = useMemo(() => {
    const questions: { pack: QuestionPack; question: QuestionDef }[] = [];
    
    packs.forEach(pack => {
      const packQuestions = pack.questions || [];
      
      // Dedupe and normalize
      const seen = new Set<string>();
      packQuestions.forEach(q => {
        const key = q.id?.trim();
        if (!key || seen.has(key)) return;
        if (isLogisticsHandled(q.id)) return;
        
        // Skip text/textarea types (we want tile-only flow)
        const normalizedType = normalizeType(q.type);
        if (!TILE_TYPES.has(normalizedType) && !TILE_TYPES.has(q.type)) return;
        
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
        questions.push({ pack, question: { ...q, type: normalizeType(q.type) } });
      });
    });
    
    return questions;
  }, [packs, answers]);

  const handleAnswerChange = useCallback((microSlug: string, questionId: string, value: unknown) => {
    const microAnswers = (answers.microAnswers as Record<string, Record<string, unknown>>) || {};
    
    onChange({
      ...answers,
      microAnswers: {
        ...microAnswers,
        [microSlug]: {
          ...(microAnswers[microSlug] || {}),
          [questionId]: value,
        },
      },
    });
  }, [answers, onChange]);

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
        {/* Manual continue button as fallback */}
        <Button onClick={onComplete} className="mt-4">
          {t('buttons.continue')}
        </Button>
      </div>
    );
  }

  const current = visibleQuestions[currentIndex];
  const { pack, question } = current;
  const isMulti = question.type === 'checkbox' || question.type === 'multi_select';
  const currentValue = getAnswer(pack.micro_slug, question.id);
  const selectedValues = isMulti 
    ? (Array.isArray(currentValue) ? currentValue as string[] : [])
    : (currentValue as string) || '';

  return (
    <div className="flex flex-col min-h-[400px]">
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
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          {question.label}
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

        {/* Tile options */}
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
                {/* Selection indicator */}
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
          })}
        </div>

        {/* Error display */}
        {errors?.[pack.micro_slug]?.[question.id] && (
          <p className="text-sm text-destructive mt-3 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            {errors[pack.micro_slug][question.id]}
          </p>
        )}
      </div>

      {/* Continue button for multi-select, or when on last question with answer */}
      {((isMulti && selectedValues.length > 0 && currentIndex < visibleQuestions.length - 1) || 
        (currentIndex === visibleQuestions.length - 1 && (isMulti ? selectedValues.length > 0 : !!selectedValues))) && (
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
