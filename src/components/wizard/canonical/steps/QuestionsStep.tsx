/**
 * QuestionsStep - Dynamic question rendering based on selected micro-services
 * Fetches question packs from DB by micro_slug and renders them
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { QuestionPackRenderer } from './QuestionPackRenderer';

// Question definition from the pack
interface QuestionDef {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number';
  options?: (string | { value: string; label: string })[];
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
      let parsedPacks: QuestionPack[] = (data || []).map(p => ({
        id: p.id,
        micro_slug: p.micro_slug,
        title: p.title,
        questions: (p.questions as unknown as QuestionDef[]) || [],
      }));

      // If no packs found at all, load fallback pack
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

      {packs.map((pack) => (
        <QuestionPackRenderer
          key={pack.id}
          pack={pack}
          getAnswer={getAnswer}
          onAnswerChange={handleAnswerChange}
        />
      ))}

      {missingPacks.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {missingPacks.length} service{missingPacks.length !== 1 ? 's' : ''} without specific questions yet.
        </p>
      )}
    </div>
  );
}

export default QuestionsStep;
