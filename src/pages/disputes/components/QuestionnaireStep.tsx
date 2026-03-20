import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { OUTCOME_OPTIONS, COMPLETION_OPTIONS, SCOPE_AGREEMENT_OPTIONS } from '../types';

interface Props {
  answers: Record<string, string>;
  onChange: (answers: Record<string, string>) => void;
}

const QUESTIONS = [
  {
    key: 'desired_outcome',
    label: 'What outcome do you want?',
    options: OUTCOME_OPTIONS,
  },
  {
    key: 'completion_status',
    label: 'Has any work been completed?',
    options: COMPLETION_OPTIONS,
  },
  {
    key: 'scope_agreement',
    label: 'Was the scope of work agreed?',
    options: SCOPE_AGREEMENT_OPTIONS,
  },
];

export function QuestionnaireStep({ answers, onChange }: Props) {
  const update = (key: string, value: string) => {
    onChange({ ...answers, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground">Help us understand the situation</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Your answers help structure the case fairly for both sides
        </p>
      </div>

      {QUESTIONS.map((q) => (
        <div key={q.key} className="space-y-3">
          <Label className="text-sm font-medium">{q.label}</Label>
          <RadioGroup
            value={answers[q.key] || ''}
            onValueChange={(val) => update(q.key, val)}
            className="grid gap-2"
          >
            {q.options.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  answers[q.key] === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value={opt.value} />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
      ))}
    </div>
  );
}
