/**
 * Logistics Step
 * Location, timing, contact preference, completion date, and budget information
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectLabel,
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { WizardState, ConsultationType } from '../types';

interface LogisticsStepProps {
  logistics: WizardState['logistics'];
  onChange: (logistics: Partial<WizardState['logistics']>) => void;
}

type LocationOption = { value: string; label: string; group: string };

const LOCATION_OPTIONS: LocationOption[] = [
  // Main Towns (Municipalities)
  { value: 'ibiza_town', label: 'Ibiza Town (Eivissa)', group: 'Main Towns' },
  { value: 'san_antonio', label: 'San Antonio (Sant Antoni)', group: 'Main Towns' },
  { value: 'santa_eulalia', label: 'Santa Eulalia', group: 'Main Towns' },
  { value: 'san_jose', label: 'San José (Sant Josep)', group: 'Main Towns' },
  { value: 'san_juan', label: 'San Juan (Sant Joan)', group: 'Main Towns' },

  // Popular Areas
  { value: 'playa_den_bossa', label: "Playa d'en Bossa", group: 'Popular Areas' },
  { value: 'talamanca', label: 'Talamanca', group: 'Popular Areas' },
  { value: 'jesus', label: 'Jesús', group: 'Popular Areas' },
  { value: 'cala_llonga', label: 'Cala Llonga', group: 'Popular Areas' },
  { value: 'es_cana', label: 'Es Caná', group: 'Popular Areas' },
  { value: 'portinatx', label: 'Portinatx', group: 'Popular Areas' },
  { value: 'san_carlos', label: 'San Carlos', group: 'Popular Areas' },
  { value: 'cala_vadella', label: 'Cala Vadella', group: 'Popular Areas' },
  { value: 'cala_tarida', label: 'Cala Tarida', group: 'Popular Areas' },
  { value: 'cala_conta', label: 'Cala Conta', group: 'Popular Areas' },
  { value: 'es_cubells', label: 'Es Cubells', group: 'Popular Areas' },
  { value: 'sant_jordi', label: 'Sant Jordi', group: 'Popular Areas' },
  { value: 'san_rafael', label: 'San Rafael', group: 'Popular Areas' },
  { value: 'sant_mateu', label: 'Sant Mateu', group: 'Popular Areas' },
  { value: 'san_miguel', label: 'San Miguel', group: 'Popular Areas' },
  { value: 'santa_gertrudis', label: 'Santa Gertrudis', group: 'Popular Areas' },

  // Fallback
  { value: 'other', label: 'Other area (specify)', group: 'Other' },
];

const TIMING_OPTIONS = [
  { value: 'asap', label: 'As soon as possible' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'flexible', label: 'Flexible' },
  { value: 'specific', label: 'Specific date' },
];

const CONTACT_OPTIONS: { value: ConsultationType; label: string }[] = [
  { value: 'site_visit', label: 'Site visit — I want them to see the work first' },
  { value: 'phone_call', label: 'Phone call — quick discussion' },
  { value: 'message', label: 'Message — I prefer writing first' },
];

const BUDGET_OPTIONS = [
  { value: 'under_500', label: 'Under €500', description: 'Small repairs, quick fixes' },
  { value: '500_1000', label: '€500 – €1,000', description: 'Medium jobs' },
  { value: '1000_2500', label: '€1,000 – €2,500', description: 'Larger projects' },
  { value: '2500_5000', label: '€2,500 – €5,000', description: 'Major work' },
  { value: 'over_5000', label: 'Over €5,000', description: 'Large-scale projects' },
  { value: 'need_quote', label: 'I need a quote first', description: "Not sure yet" },
] as const;

function groupLocations(options: LocationOption[]): Record<string, LocationOption[]> {
  return options.reduce<Record<string, LocationOption[]>>((acc, opt) => {
    acc[opt.group] = acc[opt.group] || [];
    acc[opt.group].push(opt);
    return acc;
  }, {});
}

export function LogisticsStep({ logistics, onChange }: LogisticsStepProps) {
  const grouped = groupLocations(LOCATION_OPTIONS);

  return (
    <div className="space-y-6 md:space-y-6">
      <h3 className="font-display text-lg font-semibold">
        Logistics
      </h3>

      {/* Location */}
      <div className="space-y-2">
        <Label>Where is the work needed?</Label>
        <Select
          value={logistics.location}
          onValueChange={(value) => onChange({ location: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(grouped).map(([groupName, options]) => (
              <SelectGroup key={groupName}>
                <SelectLabel>{groupName}</SelectLabel>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
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

      {/* Timeline */}
      <div className="space-y-2">
        <Label>When do you want this started?</Label>
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

      {logistics.startDatePreset === 'specific' && (
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            type="date"
            value={logistics.startDate instanceof Date 
              ? logistics.startDate.toISOString().split('T')[0] 
              : ''}
            onChange={(e) => onChange({ 
              startDate: e.target.value ? new Date(e.target.value) : undefined 
            })}
          />
        </div>
      )}

      {/* Completion date */}
      <div className="space-y-2">
        <Label htmlFor="completionDate">When should this be completed?</Label>
        <Input
          id="completionDate"
          type="date"
          value={logistics.completionDate instanceof Date 
            ? logistics.completionDate.toISOString().split('T')[0] 
            : ''}
          onChange={(e) => onChange({ 
            completionDate: e.target.value ? new Date(e.target.value) : undefined 
          })}
        />
        <p className="text-xs text-muted-foreground">Leave blank if flexible</p>
      </div>

      {/* First contact preference */}
      <div className="space-y-3">
        <Label>How would you like to be contacted first?</Label>
        <RadioGroup
          value={logistics.consultationType || ''}
          onValueChange={(val) => onChange({ consultationType: val as ConsultationType })}
          className="space-y-3 md:space-y-2"
        >
          {CONTACT_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center space-x-3 min-h-[48px] md:min-h-0 py-1">
              <RadioGroupItem value={opt.value} id={`contact-${opt.value}`} />
              <Label htmlFor={`contact-${opt.value}`} className="font-normal cursor-pointer flex-1">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Budget (structured, required) */}
      <div className="space-y-3">
        <Label>Budget range</Label>
        <RadioGroup
          value={logistics.budgetRange || ''}
          onValueChange={(val) => onChange({ budgetRange: val })}
          className="space-y-3 md:space-y-2"
        >
          {BUDGET_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-start space-x-3 min-h-[48px] md:min-h-0 py-1">
              <RadioGroupItem value={opt.value} id={`budget-${opt.value}`} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={`budget-${opt.value}`} className="font-normal cursor-pointer">
                  {opt.label}
                </Label>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          This helps professionals decide quickly if the job is a fit.
        </p>
      </div>

      {/* Access details */}
      <div className="space-y-2">
        <Label htmlFor="access">Access details (optional)</Label>
        <Textarea
          id="access"
          value={logistics.accessDetails?.join('\n') || ''}
          onChange={(e) => onChange({
            accessDetails: e.target.value.split('\n').filter(Boolean),
          })}
          placeholder="Any special access instructions, parking info, etc."
          rows={3}
        />
      </div>
    </div>
  );
}
