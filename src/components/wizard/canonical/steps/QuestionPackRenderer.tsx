/**
 * QuestionPackRenderer - Renders a single question pack with dedupe protection
 * V2-compatible with type aliases, question ordering, and improved validation
 */

import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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

// Normalize V2 type aliases to renderer types
const normalizeQuestionType = (type: string): QuestionDef['type'] => {
  switch (type) {
    case 'single_select': return 'radio';
    case 'multi_select': return 'checkbox';
    case 'long_text': return 'textarea';
    default: return type as QuestionDef['type'];
  }
};

// Normalize accept attribute (can be string or array in V2)
const normalizeAccept = (accept?: string | string[]): string => {
  if (!accept) return 'image/*';
  return Array.isArray(accept) ? accept.join(',') : accept;
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
  question_order?: string[];
}

interface Props {
  pack: QuestionPack;
  getAnswer: (microSlug: string, questionId: string) => unknown;
  onAnswerChange: (microSlug: string, questionId: string, value: unknown) => void;
}

// Question IDs that are handled by Step 5 (Logistics) and should not appear in Step 4
// This prevents duplicate timing/urgency questions across wizard steps
const LOGISTICS_HANDLED_QUESTION_IDS = new Set([
  'timeline',           // "When would you like X done?"
  'timing',             // "When do you need X?"
  'urgency',            // "How urgent is this job?"
  'preferred_timing',   // "Preferred timing for servicing?"
  'start_timeline',     // Variant timing question
]);

// Get ordered questions respecting question_order if present
const getOrderedQuestions = (pack: QuestionPack): QuestionDef[] => {
  const questions = pack.questions || [];
  const order = pack.question_order;
  
  if (!order?.length) return questions;
  
  const byId = new Map(questions.map(q => [q.id, q]));
  const ordered = order.map(id => byId.get(id)).filter(Boolean) as QuestionDef[];
  const unordered = questions.filter(q => !order.includes(q.id));
  
  return [...ordered, ...unordered];
};

export function QuestionPackRenderer({ pack, getAnswer, onAnswerChange }: Props) {
  // UI protection: dedupe questions by id or label, respecting question_order
  const uniqueQuestions = useMemo(() => {
    const orderedQuestions = getOrderedQuestions(pack);
    const seen = new Set<string>();
    return orderedQuestions.filter((q) => {
      const key = q?.id?.trim() || q?.label?.trim()?.toLowerCase();
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [pack]);

  // Conditional visibility check - handles both single and multi-select answers
  const shouldShowQuestion = (question: QuestionDef): boolean => {
    const dep = question.show_if || question.dependsOn;
    if (!dep?.questionId) return true;

    const depValue = getAnswer(pack.micro_slug, dep.questionId);
    
    // Normalize both sides to arrays of strings for robust comparison
    const depValueArr = Array.isArray(depValue) ? depValue : depValue != null ? [String(depValue)] : [];
    const requiredArr = Array.isArray(dep.value) ? dep.value.map(String) : [String(dep.value)];

    // Show if ANY required value is present in the answer
    return requiredArr.some(v => depValueArr.includes(v));
  };

  const renderQuestion = (question: QuestionDef) => {
    const value = getAnswer(pack.micro_slug, question.id);
    const key = `${pack.micro_slug}-${question.id}`;
    // Normalize V2 type aliases
    const normalizedType = normalizeQuestionType(question.type);

    switch (normalizedType) {
      case 'text':
        return (
          <Input
            id={key}
            type="text"
            placeholder={question.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onAnswerChange(pack.micro_slug, question.id, e.target.value)}
          />
        );

      case 'number':
        return (
          <Input
            id={key}
            type="number"
            placeholder={question.placeholder}
            value={value ?? ''}
            min={question.min}
            max={question.max}
            step={question.step}
            onChange={(e) => {
              const num = e.target.valueAsNumber;
              onAnswerChange(pack.micro_slug, question.id, Number.isNaN(num) ? null : num);
            }}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={key}
            placeholder={question.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onAnswerChange(pack.micro_slug, question.id, e.target.value)}
            rows={3}
          />
        );

      case 'file': {
        const fileNames = (value as string[]) || [];
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
                  files ? Array.from(files).map(f => f.name) : []
                );
              }}
              className="cursor-pointer"
            />
            {fileNames.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selected: {fileNames.join(', ')}
                <span className="italic"> (uploads after job is posted)</span>
              </p>
            )}
          </div>
        );
      }

      case 'radio':
      case 'select':
        return (
          <RadioGroup
            value={(value as string) || ''}
            onValueChange={(val) => onAnswerChange(pack.micro_slug, question.id, val)}
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

      case 'checkbox': {
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
                      onAnswerChange(pack.micro_slug, question.id, newSelected);
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
      }

      default:
        return null;
    }
  };

  // Filter out logistics-handled questions AND apply conditional visibility
  const visibleQuestions = uniqueQuestions
    .filter(q => !LOGISTICS_HANDLED_QUESTION_IDS.has(q.id))
    .filter(shouldShowQuestion);

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-foreground border-b pb-2">
        {pack.title}
      </h4>
      
      {visibleQuestions.map((question) => (
        <div key={question.id} className="space-y-2">
          <Label htmlFor={`${pack.micro_slug}-${question.id}`}>
            {question.label}
            {question.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {question.help && (
            <p className="text-sm text-muted-foreground">{question.help}</p>
          )}
          {renderQuestion(question)}
        </div>
      ))}
    </div>
  );
}
