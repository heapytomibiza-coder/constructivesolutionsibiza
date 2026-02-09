/**
 * Logistics Step
 * Optimized layout with clear visual hierarchy
 * - Location: Grouped dropdown (from centralized zones.ts)
 * - Timing: Compact tile grid
 * - Budget: Radio options with context
 * - Contact: Horizontal selection
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Clock, Wallet, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { WizardState } from '../types';
import { TileOption } from './logistics';
import { TIMING_OPTIONS, CONTACT_OPTIONS } from './logistics/constants';
import { getMainZones, getPopularZones, OTHER_LOCATION } from '@/shared/components/professional/zones';

interface LogisticsStepProps {
  logistics: WizardState['logistics'];
  onChange: (logistics: Partial<WizardState['logistics']>) => void;
}

// Budget option keys for i18n lookup
const BUDGET_KEYS = [
  { value: 'under_500', labelKey: 'logistics.budget.under500', hintKey: 'logistics.budget.under500Hint' },
  { value: '500_1000', labelKey: 'logistics.budget.500to1k', hintKey: 'logistics.budget.500to1kHint' },
  { value: '1000_2500', labelKey: 'logistics.budget.1kto2_5k', hintKey: 'logistics.budget.1kto2_5kHint' },
  { value: '2500_5000', labelKey: 'logistics.budget.2_5kto5k', hintKey: 'logistics.budget.2_5kto5kHint' },
  { value: 'over_5000', labelKey: 'logistics.budget.over5k', hintKey: 'logistics.budget.over5kHint' },
  { value: 'need_quote', labelKey: 'logistics.budget.needQuote', hintKey: 'logistics.budget.needQuoteHint' },
] as const;

export function LogisticsStep({ logistics, onChange }: LogisticsStepProps) {
  const { t } = useTranslation('wizard');
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Derive location options from centralized zones
  const mainLocations = useMemo(() => 
    getMainZones().map(z => ({ value: z.id, label: z.label })), 
    []
  );
  const popularLocations = useMemo(() => 
    getPopularZones().map(z => ({ value: z.id, label: z.label })), 
    []
  );

  const handleLocationSelect = (value: string) => {
    onChange({ location: value });
    if (value !== 'other') {
      onChange({ location: value, customLocation: undefined });
    }
  };

  const handleTimingSelect = (value: string) => {
    onChange({ startDatePreset: value });
    if (value === 'specific') {
      setCalendarOpen(true);
    } else {
      onChange({ startDatePreset: value, startDate: undefined });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    onChange({ startDate: date });
    setCalendarOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Section 1: LOCATION */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <Label className="text-sm font-semibold">{t('logistics.whereTitle')}</Label>
        </div>
        <Select
          value={logistics.location}
          onValueChange={handleLocationSelect}
        >
          <SelectTrigger className="w-full h-12 text-base">
            <SelectValue placeholder="Select area..." />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50 max-h-[300px]">
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wide">Main Towns</SelectLabel>
              {mainLocations.map((loc) => (
                <SelectItem key={loc.value} value={loc.value} className="py-2.5">
                  {loc.label}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wide">Popular Areas</SelectLabel>
              {popularLocations.map((loc) => (
                <SelectItem key={loc.value} value={loc.value} className="py-2.5">
                  {loc.label}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wide">Other</SelectLabel>
              <SelectItem value={OTHER_LOCATION.id} className="py-2.5">
                {OTHER_LOCATION.label}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {logistics.location === 'other' && (
          <Input
            value={logistics.customLocation || ''}
            onChange={(e) => onChange({ customLocation: e.target.value })}
            placeholder={t('logistics.otherAreaPlaceholder')}
            className="h-12"
          />
        )}
      </section>

      {/* Section 2: TIMING */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <Label className="text-sm font-semibold">{t('logistics.whenTitle')}</Label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TIMING_OPTIONS.map((opt) => (
            <TileOption
              key={opt.value}
              selected={logistics.startDatePreset === opt.value}
              onClick={() => handleTimingSelect(opt.value)}
              className="text-sm py-3"
            >
              {t(opt.labelKey)}
            </TileOption>
          ))}
        </div>

        {logistics.startDatePreset === 'specific' && (
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-12 justify-start text-left font-normal',
                  !logistics.startDate && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {logistics.startDate 
                  ? format(logistics.startDate, 'PPP')
                  : t('logistics.specificDate')
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
              <CalendarComponent
                mode="single"
                selected={logistics.startDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
      </section>

      {/* Section 3: BUDGET - Radio Options */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <Label className="text-sm font-semibold">{t('logistics.budgetTitle')}</Label>
        </div>
        <RadioGroup
          value={logistics.budgetRange || ''}
          onValueChange={(val) => onChange({ budgetRange: val })}
          className="grid gap-2"
        >
          {BUDGET_KEYS.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`budget-${opt.value}`}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                'hover:border-primary/50 hover:bg-accent/30',
                logistics.budgetRange === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              )}
            >
              <RadioGroupItem 
                value={opt.value} 
                id={`budget-${opt.value}`}
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm">{t(opt.labelKey)}</span>
                <span className="text-xs text-muted-foreground ml-2">{t(opt.hintKey)}</span>
              </div>
            </label>
          ))}
        </RadioGroup>
      </section>

      {/* Section 4: CONTACT PREFERENCE */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <Label className="text-sm font-semibold">{t('logistics.contactTitle')}</Label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {CONTACT_OPTIONS.map((opt) => (
            <TileOption
              key={opt.value}
              selected={logistics.consultationType === opt.value}
              onClick={() => onChange({ consultationType: opt.value })}
              className="text-xs sm:text-sm py-3 text-center"
            >
              {t(opt.labelKey)}
            </TileOption>
          ))}
        </div>

        {/* Access notes - collapsible feel */}
        <div className="pt-2">
          <Textarea
            value={logistics.accessDetails?.join('\n') || ''}
            onChange={(e) => onChange({
              accessDetails: e.target.value.split('\n').filter(Boolean),
            })}
            placeholder={t('logistics.accessPlaceholder')}
            rows={2}
            className="resize-none text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('logistics.accessNotes')}
          </p>
        </div>
      </section>
    </div>
  );
}
