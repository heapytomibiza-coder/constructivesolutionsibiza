import { Checkbox } from '@/components/ui/checkbox';
import { ISSUE_TYPE_OPTIONS, type DisputeIssueType } from '../types';

interface Props {
  selected: DisputeIssueType[];
  onChange: (types: DisputeIssueType[]) => void;
}

export function IssueTypeSelector({ selected, onChange }: Props) {
  const toggle = (value: DisputeIssueType) => {
    if (selected.includes(value)) {
      onChange(selected.filter((t) => t !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">What is the issue?</h3>
      <p className="text-xs text-muted-foreground">Select all that apply</p>
      <div className="grid gap-2">
        {ISSUE_TYPE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              selected.includes(opt.value)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Checkbox
              checked={selected.includes(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
              className="mt-0.5"
            />
            <div>
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs text-muted-foreground">{opt.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
