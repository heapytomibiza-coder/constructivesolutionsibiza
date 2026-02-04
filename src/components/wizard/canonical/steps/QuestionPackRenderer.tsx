/**
 * QuestionPackRenderer - Renders a single question pack with dedupe protection
 * Extracted for proper useMemo usage and cleaner separation
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

// Question definition from the pack
interface QuestionDef {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'file';
  options?: OptionType[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  accept?: string;
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

export function QuestionPackRenderer({ pack, getAnswer, onAnswerChange }: Props) {
  // UI protection: dedupe questions by id or label (memoized for performance)
  const uniqueQuestions = useMemo(() => {
    const seen = new Set<string>();
    return (pack.questions || []).filter((q) => {
      const key = q?.id?.trim() || q?.label?.trim()?.toLowerCase();
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [pack.questions]);

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

    switch (question.type) {
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
            value={(value as number) || ''}
            onChange={(e) => onAnswerChange(pack.micro_slug, question.id, e.target.valueAsNumber)}
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

      case 'file':
        return (
          <Input
            id={key}
            type="file"
            accept={question.accept || 'image/*'}
            onChange={(e) => {
              const files = e.target.files;
              onAnswerChange(pack.micro_slug, question.id, files ? Array.from(files).map(f => f.name) : []);
            }}
            className="cursor-pointer"
          />
        );

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
