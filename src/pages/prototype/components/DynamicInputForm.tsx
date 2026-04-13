import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { AdjustmentField, EstimateInputs } from '../lib/calculateEstimate';

interface DynamicInputFormProps {
  fields: AdjustmentField[];
  values: EstimateInputs;
  onChange: (key: string, value: number | string | boolean) => void;
  errors?: Record<string, string>;
}

function fieldUnit(field: AdjustmentField): string | null {
  const key = field.key.toLowerCase();
  if (key.includes('length') || key.includes('width') || key.includes('height')) return 'metres';
  if (key.includes('area')) return 'm²';
  return null;
}

export function DynamicInputForm({ fields, values, onChange, errors = {} }: DynamicInputFormProps) {
  if (!fields.length) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No additional inputs for this service.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const error = errors[field.key];
        const unit = field.type === 'number' ? fieldUnit(field) : null;

        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
              {unit && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">({unit})</span>
              )}
            </Label>

            {field.type === 'number' && (
              <Input
                id={field.key}
                type="number"
                inputMode="decimal"
                min={field.min ?? 0}
                max={field.max}
                step="any"
                value={values[field.key] !== undefined ? String(values[field.key]) : ''}
                onChange={(e) => onChange(field.key, Number(e.target.value))}
                placeholder={field.default !== undefined ? String(field.default) : ''}
                className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
                aria-invalid={!!error}
                aria-describedby={error ? `${field.key}-error` : undefined}
              />
            )}

            {field.type === 'select' && field.options && (
              <Select
                value={values[field.key] !== undefined ? String(values[field.key]) : ''}
                onValueChange={(v) => onChange(field.key, v)}
              >
                <SelectTrigger className={error ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === 'boolean' && (
              <div className="flex items-center gap-2">
                <Switch
                  id={field.key}
                  checked={values[field.key] === true}
                  onCheckedChange={(checked) => onChange(field.key, checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {values[field.key] === true ? 'Yes' : 'No'}
                </span>
              </div>
            )}

            {error && (
              <p id={`${field.key}-error`} className="text-xs text-destructive mt-0.5">
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
