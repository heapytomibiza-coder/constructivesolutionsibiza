/**
 * Logistics Step
 * Location, timing, and budget information
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WizardState } from '../types';

interface LogisticsStepProps {
  logistics: WizardState['logistics'];
  onChange: (logistics: Partial<WizardState['logistics']>) => void;
}

const LOCATION_OPTIONS = [
  { value: 'ibiza_town', label: 'Ibiza Town' },
  { value: 'san_antonio', label: 'San Antonio' },
  { value: 'santa_eulalia', label: 'Santa Eulalia' },
  { value: 'san_jose', label: 'San José' },
  { value: 'other', label: 'Other (specify)' },
];

const TIMING_OPTIONS = [
  { value: 'asap', label: 'As soon as possible' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'flexible', label: 'Flexible' },
  { value: 'specific', label: 'Specific date' },
];

export function LogisticsStep({ logistics, onChange }: LogisticsStepProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-display text-lg font-semibold">
        Location & Timing
      </h3>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Where is the work needed?</Label>
        <Select
          value={logistics.location}
          onValueChange={(value) => onChange({ location: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location..." />
          </SelectTrigger>
          <SelectContent>
            {LOCATION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {logistics.location === 'other' && (
        <div className="space-y-2">
          <Label htmlFor="customLocation">Specify location</Label>
          <Input
            id="customLocation"
            value={logistics.customLocation || ''}
            onChange={(e) => onChange({ customLocation: e.target.value })}
            placeholder="Enter address or area..."
          />
        </div>
      )}

      {/* Timing */}
      <div className="space-y-2">
        <Label>When do you need this done?</Label>
        <Select
          value={logistics.startDatePreset || ''}
          onValueChange={(value) => onChange({ startDatePreset: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timing..." />
          </SelectTrigger>
          <SelectContent>
            {TIMING_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <Label htmlFor="budget">Budget range (optional)</Label>
        <Input
          id="budget"
          value={logistics.budgetRange || ''}
          onChange={(e) => onChange({ budgetRange: e.target.value })}
          placeholder="e.g., €500-1000"
        />
        <p className="text-xs text-muted-foreground">
          This helps professionals understand your expectations
        </p>
      </div>

      {/* Access details */}
      <div className="space-y-2">
        <Label htmlFor="access">Access details (optional)</Label>
        <Textarea
          id="access"
          value={logistics.accessDetails?.join('\n') || ''}
          onChange={(e) => onChange({ 
            accessDetails: e.target.value.split('\n').filter(Boolean) 
          })}
          placeholder="Any special access instructions, parking info, etc."
          rows={3}
        />
      </div>
    </div>
  );
}
