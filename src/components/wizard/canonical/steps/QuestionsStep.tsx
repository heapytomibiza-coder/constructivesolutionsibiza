/**
 * QuestionsStep - Dynamic question rendering based on selected micro-services
 * Fetches question packs from DB by micro_slug and renders them
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { QuestionPackRenderer } from './QuestionPackRenderer';

// Question definition from the pack
interface QuestionDef {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'file';
  options?: (string | { value: string; label: string })[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  show_if?: {
    questionId: string;
    value: string | string[];
  };
}

interface QuestionPack {
  id: string;
  micro_slug: string;
  title: string;
  questions: QuestionDef[];
}

type QualityTier = 'strong' | 'generic' | 'fallback';

// Banned phrases that indicate generic pack content
const GENERIC_PHRASES = [
  'briefly describe',
  'describe your project',
  'please describe',
  'what do you need help with',
  'tell us about',
];

function getPackQualityTier(pack: QuestionPack): QualityTier {
  if (pack.micro_slug === 'general-project') return 'fallback';
  
  // Check for generic openers in first question
  const firstQ = pack.questions[0];
  const label = (firstQ?.label || '').toLowerCase();
  
  if (GENERIC_PHRASES.some(phrase => label.includes(phrase))) {
    return 'generic';
  }
  
  // Strong = 5+ questions and no generic opener
  return pack.questions.length >= 5 ? 'strong' : 'generic';
}

/**
 * Determine pack tracking metadata for analytics
 * Only marks 'fallback' when general-project pack was actually used
 */
function determinePackTracking(
  primarySlug: string | null,
  packs: QuestionPack[]
): { source: 'strong' | 'generic' | 'fallback'; missing: boolean } {
  const usedFallback = packs.some(p => p.micro_slug === 'general-project');

  // Fallback: explicitly used general-project or no packs at all
  if (usedFallback || packs.length === 0) {
    return { source: 'fallback', missing: true };
  }

  // Find the pack for primary slug
  const primaryPack = packs.find(p => p.micro_slug === primarySlug);
  if (!primaryPack) {
    return { source: 'fallback', missing: true };
  }

  // Check quality tier
  const tier = getPackQualityTier(primaryPack);
  if (tier === 'fallback') {
    return { source: 'fallback', missing: true };
  }

  return { source: tier, missing: false };
}

interface Props {
  microSlugs: string[];
  answers: Record<string, unknown>;
  onChange: (answers: Record<string, unknown>) => void;
  onPacksLoaded?: (packs: QuestionPack[]) => void;
  errors?: Record<string, Record<string, string>>; // micro_slug -> question_id -> error
}

export function QuestionsStep({ microSlugs, answers, onChange, onPacksLoaded, errors }: Props) {
  const [packs, setPacks] = useState<QuestionPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingPacks, setMissingPacks] = useState<string[]>([]);
  
  // Use refs to avoid stale closures and prevent infinite loops
  const answersRef = useRef(answers);
  const onChangeRef = useRef(onChange);
  const trackingInjectedRef = useRef(false);
  
  // Keep refs updated
  useEffect(() => {
    answersRef.current = answers;
    onChangeRef.current = onChange;
  }, [answers, onChange]);
  
  // Reset tracking flag when microSlugs change
  useEffect(() => {
    trackingInjectedRef.current = false;
  }, [microSlugs]);

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
      
      // Inject pack tracking metadata for analytics (only once per microSlugs change)
      if (!trackingInjectedRef.current) {
        const primarySlug = microSlugs[0] || null;
        const { source, missing: isMissing } = determinePackTracking(primarySlug, parsedPacks);
        
        // Only update if values actually changed (prevents unnecessary renders)
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

      {packs.map((pack) => {
        const tier = getPackQualityTier(pack);
        return (
          <div key={pack.id}>
            {tier === 'fallback' && (
              <p className="text-sm text-muted-foreground mb-3 bg-muted/50 px-3 py-2 rounded-md">
                General briefing — we're upgrading this service with trade-specific questions
              </p>
            )}
            {tier === 'generic' && (
              <p className="text-xs text-muted-foreground mb-2">
                General briefing
              </p>
            )}
            <QuestionPackRenderer
              pack={pack}
              getAnswer={getAnswer}
              onAnswerChange={handleAnswerChange}
            />
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
