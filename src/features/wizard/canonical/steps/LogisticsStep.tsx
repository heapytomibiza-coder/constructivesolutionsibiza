/**
 * Logistics Step
 * Optimized layout with clear visual hierarchy
 * - Location: Grouped dropdown (from centralized zones.ts)
 * - Timing: Compact tile grid
 * - Budget: Radio options with context + smart suggestion
 * - Contact: Horizontal selection
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Clock, Wallet, MessageSquare, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { trackEvent } from '@/lib/trackEvent';
import { EVENTS } from '@/lib/eventTaxonomy';

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
import { useBudgetSuggestion, mapRangeToBudgetChip } from './logistics/useBudgetSuggestion';

interface LogisticsStepProps {
  logistics: WizardState['logistics'];
  onChange: (logistics: Partial<WizardState['logistics']>) => void;
  showValidation?: boolean;
  microSlugs?: string[];
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

export function LogisticsStep({ logistics, onChange, showValidation = false, microSlugs = [] }: LogisticsStepProps) {
  const { t } = useTranslation('wizard');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const suggestionTrackedRef = useRef(false);

  // Budget suggestion from historical data
  const { data: budgetSuggestion } = useBudgetSuggestion(microSlugs);

  // Track when suggestion is shown (once)
  useEffect(() => {
    if (budgetSuggestion?.suggested_min != null && !suggestionTrackedRef.current) {
      suggestionTrackedRef.current = true;
      trackEvent(EVENTS.AGENT_BUDGET_SUGGESTION_SHOWN, 'client', {
        suggested_min: budgetSuggestion.suggested_min,
        suggested_max: budgetSuggestion.suggested_max,
        confidence: budgetSuggestion.confidence,
        sample_size: budgetSuggestion.sample_size,
      });
    }
  }, [budgetSuggestion]);

  // Validation state for highlighting missing fields
  const missingLocation = showValidation && (!logistics.location?.trim() || (logistics.location === 'other' && !logistics.customLocation?.trim()));
  const missingTiming = showValidation && !logistics.startDatePreset?.trim() && !logistics.startDate;
  const missingBudget = showValidation && !logistics.budgetRange?.trim();
  const missingContact = showValidation && !logistics.consultationType?.trim();

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
      <section className={cn("space-y-3 rounded-lg p-3 -mx-3 transition-colors", missingLocation && "bg-destructive/5 ring-1 ring-destructive/30")}>
        <div className="flex items-center gap-2">
          <MapPin className={cn("h-4 w-4", missingLocation ? "text-destructive" : "text-primary")} />
          <Label className="text-sm font-semibold">{t('logistics.whereTitle')}</Label>
          {missingLocation && <span className="text-xs text-destructive font-medium ml-auto">{t('logistics.required', 'Required')}</span>}
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
      <section className={cn("space-y-3 rounded-lg p-3 -mx-3 transition-colors", missingTiming && "bg-destructive/5 ring-1 ring-destructive/30")}>
        <div className="flex items-center gap-2">
          <Clock className={cn("h-4 w-4", missingTiming ? "text-destructive" : "text-primary")} />
          <Label className="text-sm font-semibold">{t('logistics.whenTitle')}</Label>
          {missingTiming && <span className="text-xs text-destructive font-medium ml-auto">{t('logistics.required', 'Required')}</span>}
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

      {/* Section 3: BUDGET - Quick chips + radio fallback */}
      <section className={cn("space-y-3 rounded-lg p-3 -mx-3 transition-colors", missingBudget && "bg-destructive/5 ring-1 ring-destructive/30")}>
        <div className="flex items-center gap-2">
          <Wallet className={cn("h-4 w-4", missingBudget ? "text-destructive" : "text-primary")} />
          <Label className="text-sm font-semibold">{t('logistics.budgetTitle')}</Label>
          {missingBudget && <span className="text-xs text-destructive font-medium ml-auto">{t('logistics.required', 'Required')}</span>}
        </div>

        {/* Smart budget suggestion */}
        {budgetSuggestion?.suggested_min != null && budgetSuggestion?.suggested_max != null && !suggestionDismissed && (
          <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3">
            <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {t('logistics.budget.suggestion', { min: budgetSuggestion.suggested_min.toLocaleString(), max: budgetSuggestion.suggested_max.toLocaleString() })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('logistics.budget.suggestionBasis', { count: budgetSuggestion.basis ?? budgetSuggestion.sample_size })}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => {
                  onChange({ budgetRange: mapRangeToBudgetChip(budgetSuggestion.suggested_min!, budgetSuggestion.suggested_max!) });
                  setSuggestionDismissed(true);
                  trackEvent(EVENTS.AGENT_BUDGET_SUGGESTION_ACCEPTED, 'client', {
                    chip: mapRangeToBudgetChip(budgetSuggestion.suggested_min!, budgetSuggestion.suggested_max!),
                  });
                }}
              >
                {t('logistics.budget.useSuggestion')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2 text-muted-foreground"
                onClick={() => {
                  setSuggestionDismissed(true);
                  trackEvent(EVENTS.AGENT_BUDGET_SUGGESTION_DISMISSED, 'client');
                }}
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {/* Quick-select budget chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BUDGET_KEYS.filter(o => o.value !== 'need_quote').map((opt) => (
            <TileOption
              key={opt.value}
              selected={logistics.budgetRange === opt.value}
              onClick={() => onChange({ budgetRange: opt.value })}
              className="text-sm py-3"
            >
              {t(opt.labelKey)}
            </TileOption>
          ))}
        </div>

        {/* Secondary "Not sure" option */}
        <button
          type="button"
          onClick={() => onChange({ budgetRange: 'need_quote' })}
          className={cn(
            'text-xs transition-colors',
            logistics.budgetRange === 'need_quote'
              ? 'text-primary font-medium underline'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('logistics.budget.needQuote')} →
        </button>
      </section>

      {/* Section 4: CONTACT PREFERENCE */}
      <section className={cn("space-y-3 rounded-lg p-3 -mx-3 transition-colors", missingContact && "bg-destructive/5 ring-1 ring-destructive/30")}>
        <div className="flex items-center gap-2">
          <MessageSquare className={cn("h-4 w-4", missingContact ? "text-destructive" : "text-primary")} />
          <Label className="text-sm font-semibold">{t('logistics.contactTitle')}</Label>
          {missingContact && <span className="text-xs text-destructive font-medium ml-auto">{t('logistics.required', 'Required')}</span>}
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
