/**
 * QuestionsStep - Dynamic question rendering based on selected micro-services
 * Fetches question packs from DB by micro_slug and renders them
 */

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

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

// Question definition from the pack
interface QuestionDef {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number';
  options?: OptionType[];
  required?: boolean;
  placeholder?: string;
}

interface QuestionPack {
  id: string;
  micro_slug: string;
  title: string;
  questions: QuestionDef[];
}

interface Props {
  microSlugs: string[];
  answers: Record<string, unknown>;
  onChange: (answers: Record<string, unknown>) => void;
}

export function QuestionsStep({ microSlugs, answers, onChange }: Props) {
  const [packs, setPacks] = useState<QuestionPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingPacks, setMissingPacks] = useState<string[]>([]);

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
      
      // Parse questions from JSONB - cast through unknown for type safety
      const parsedPacks: QuestionPack[] = (data || []).map(p => ({
        id: p.id,
        micro_slug: p.micro_slug,
        title: p.title,
        questions: (p.questions as unknown as QuestionDef[]) || [],
      }));
      
      setPacks(parsedPacks);
      setMissingPacks(missing);
      setLoading(false);
    };

    fetchPacks();
  }, [microSlugs]);

  // Initialize answers structure for new packs
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

  const handleAnswerChange = (microSlug: string, questionId: string, value: unknown) => {
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
  };

  const getAnswer = (microSlug: string, questionId: string): unknown => {
    const microAnswers = answers.microAnswers as Record<string, Record<string, unknown>>;
    return microAnswers?.[microSlug]?.[questionId];
  };

  const renderQuestion = (pack: QuestionPack, question: QuestionDef) => {
    const value = getAnswer(pack.micro_slug, question.id);
    const key = `${pack.micro_slug}-${question.id}`;

    switch (question.type) {
      case 'text':
        return (
          <Input
            id={key}
            type="text"
            placeholder={question.placeholder}
            value={(value as string) || ''}
            onChange={(e) => handleAnswerChange(pack.micro_slug, question.id, e.target.value)}
          />
        );

      case 'number':
        return (
          <Input
            id={key}
            type="number"
            placeholder={question.placeholder}
            value={(value as number) || ''}
            onChange={(e) => handleAnswerChange(pack.micro_slug, question.id, e.target.valueAsNumber)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={key}
            placeholder={question.placeholder}
            value={(value as string) || ''}
            onChange={(e) => handleAnswerChange(pack.micro_slug, question.id, e.target.value)}
            rows={3}
          />
        );

      case 'radio':
      case 'select':
        return (
          <RadioGroup
            value={(value as string) || ''}
            onValueChange={(val) => handleAnswerChange(pack.micro_slug, question.id, val)}
          >
            {question.options?.map((opt) => {
              const option = normalizeOption(opt);
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${key}-${option.value}`} />
                  <Label htmlFor={`${key}-${option.value}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        );

      case 'checkbox':
        const selectedOptions = (value as string[]) || [];
        return (
          <div className="space-y-2">
            {question.options?.map((opt) => {
              const option = normalizeOption(opt);
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${key}-${option.value}`}
                    checked={selectedOptions.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const newSelected = checked
                        ? [...selectedOptions, option.value]
                        : selectedOptions.filter((o) => o !== option.value);
                      handleAnswerChange(pack.micro_slug, question.id, newSelected);
                    }}
                  />
                  <Label htmlFor={`${key}-${option.value}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="font-display text-lg font-semibold">
          Loading questions...
        </h3>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      </div>
    );
  }

  // No packs found for any selected micro
  if (!packs.length) {
    return (
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold">
          Additional Details
        </h3>
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">
              No specific questions for your selected services yet. 
              You can add more details in the next step.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h3 className="font-display text-lg font-semibold">
        Tell us more about your project
      </h3>

      {packs.map((pack) => {
        // UI protection: dedupe questions by id or label
        const uniqueQuestions = (() => {
          const seen = new Set<string>();
          return (pack.questions || []).filter((q) => {
            const key = q?.id?.trim() || q?.label?.trim()?.toLowerCase();
            if (!key) return false;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        })();

        return (
          <div key={pack.id} className="space-y-4">
            <h4 className="font-medium text-foreground border-b pb-2">
              {pack.title}
            </h4>
            
            {uniqueQuestions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label htmlFor={`${pack.micro_slug}-${question.id}`}>
                  {question.label}
                  {question.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderQuestion(pack, question)}
              </div>
            ))}
          </div>
        );
      })}

      {missingPacks.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {missingPacks.length} service{missingPacks.length !== 1 ? 's' : ''} without specific questions yet.
        </p>
      )}
    </div>
  );
}

export default QuestionsStep;
