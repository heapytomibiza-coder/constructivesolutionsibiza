/**
 * Logistics Step
 * Tile-based UI for location, timing, budget, and contact preference
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { WizardState, ConsultationType } from '../types';
import { TileOption, LogisticsSection } from './logistics';
import {
  MAIN_LOCATIONS,
  POPULAR_LOCATIONS,
  OTHER_LOCATION,
  TIMING_OPTIONS,
  BUDGET_OPTIONS,
  CONTACT_OPTIONS,
} from './logistics/constants';

interface LogisticsStepProps {
  logistics: WizardState['logistics'];
  onChange: (logistics: Partial<WizardState['logistics']>) => void;
}

export function LogisticsStep({ logistics, onChange }: LogisticsStepProps) {
  const { t } = useTranslation('wizard');
  const [showMoreLocations, setShowMoreLocations] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Check if selected location is in the "more" section
  const selectedInMore = POPULAR_LOCATIONS.some(loc => loc.value === logistics.location);
  const shouldShowMore = showMoreLocations || selectedInMore;

  const handleLocationSelect = (value: string) => {
    onChange({ location: value });
    // Clear custom location if not "other"
    if (value !== 'other') {
      onChange({ location: value, customLocation: undefined });
    }
  };

  const handleTimingSelect = (value: string) => {
    onChange({ startDatePreset: value });
    // Open calendar if "specific" is selected
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
    <div className="space-y-8">
      {/* Section 1: WHERE */}
      <LogisticsSection title={t('logistics.where')}>
        <div className="grid grid-cols-2 gap-3">
          {MAIN_LOCATIONS.map((loc) => (
            <TileOption
              key={loc.value}
              selected={logistics.location === loc.value}
              onClick={() => handleLocationSelect(loc.value)}
            >
              {loc.label}
            </TileOption>
          ))}
        </div>

        {/* Expandable popular areas */}
        {shouldShowMore && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {POPULAR_LOCATIONS.map((loc) => (
              <TileOption
                key={loc.value}
                selected={logistics.location === loc.value}
                onClick={() => handleLocationSelect(loc.value)}
              >
                {loc.label}
              </TileOption>
            ))}
          </div>
        )}

        {/* Other option */}
        <div className="mt-3">
          <TileOption
            selected={logistics.location === 'other'}
            onClick={() => handleLocationSelect('other')}
          >
            {OTHER_LOCATION.label}
          </TileOption>
        </div>

        {/* Toggle more areas */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 text-muted-foreground"
          onClick={() => setShowMoreLocations(!shouldShowMore)}
        >
          {shouldShowMore ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              {t('logistics.fewerAreas')}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              {t('logistics.moreAreas')}
            </>
          )}
        </Button>

        {/* Custom location input */}
        {logistics.location === 'other' && (
          <div className="mt-3 space-y-2">
            <label className="text-sm font-medium">{t('logistics.otherAreaLabel')}</label>
            <Input
              value={logistics.customLocation || ''}
              onChange={(e) => onChange({ customLocation: e.target.value })}
              placeholder={t('logistics.otherAreaPlaceholder')}
            />
          </div>
        )}
      </LogisticsSection>

      {/* Section 2: WHEN */}
      <LogisticsSection title={t('logistics.when')}>
        <div className="grid grid-cols-2 gap-3">
          {TIMING_OPTIONS.map((opt) => (
            <TileOption
              key={opt.value}
              selected={logistics.startDatePreset === opt.value}
              onClick={() => handleTimingSelect(opt.value)}
            >
              {t(opt.labelKey)}
            </TileOption>
          ))}
        </div>

        {/* Date picker for specific date */}
        {logistics.startDatePreset === 'specific' && (
          <div className="mt-3">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
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
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={logistics.startDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </LogisticsSection>

      {/* Section 3: BUDGET */}
      <LogisticsSection title={t('logistics.budget')}>
        <div className="grid grid-cols-2 gap-3">
          {BUDGET_OPTIONS.map((opt) => (
            <TileOption
              key={opt.value}
              selected={logistics.budgetRange === opt.value}
              onClick={() => onChange({ budgetRange: opt.value })}
            >
              {t(opt.labelKey)}
            </TileOption>
          ))}
        </div>
      </LogisticsSection>

      {/* Section 4: CONTACT */}
      <LogisticsSection title={t('logistics.contact')}>
        <div className="grid grid-cols-3 gap-3">
          {CONTACT_OPTIONS.map((opt) => (
            <TileOption
              key={opt.value}
              selected={logistics.consultationType === opt.value}
              onClick={() => onChange({ consultationType: opt.value })}
            >
              {t(opt.labelKey)}
            </TileOption>
          ))}
        </div>

        {/* Optional access notes */}
        <div className="mt-4 space-y-2">
          <label className="text-sm text-muted-foreground">
            {t('logistics.accessNotes')}
          </label>
          <Textarea
            value={logistics.accessDetails?.join('\n') || ''}
            onChange={(e) => onChange({
              accessDetails: e.target.value.split('\n').filter(Boolean),
            })}
            placeholder={t('logistics.accessPlaceholder')}
            rows={2}
            className="resize-none"
          />
        </div>
      </LogisticsSection>
    </div>
  );
}
