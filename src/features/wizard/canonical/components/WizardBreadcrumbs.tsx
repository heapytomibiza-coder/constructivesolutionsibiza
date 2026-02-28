/**
 * WizardBreadcrumbs
 * Accumulating tag strip showing selections from prior wizard steps.
 * Tappable tags navigate back to the corresponding step.
 */

import { useTranslation } from 'react-i18next';
import { Check, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { txCategory, txSubcategory } from '@/i18n/taxonomyTranslations';
import { WizardStep, getStepIndex, type WizardState } from '../types';

interface WizardBreadcrumbsProps {
  wizardState: WizardState;
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
}

interface Crumb {
  step: WizardStep;
  label: string;
  completed: boolean;
}

export function WizardBreadcrumbs({ wizardState, currentStep, onStepClick }: WizardBreadcrumbsProps) {
  const { t } = useTranslation('wizard');
  const currentIdx = getStepIndex(currentStep);

  const crumbs: Crumb[] = [];

  // Category crumb — show from step 2 onward if selected
  if (wizardState.mainCategory && currentIdx >= getStepIndex(WizardStep.Subcategory)) {
    const label = txCategory(wizardState.mainCategory, t) ?? wizardState.mainCategory;
    crumbs.push({
      step: WizardStep.Category,
      label,
      completed: currentIdx > getStepIndex(WizardStep.Category),
    });
  }

  // Subcategory crumb — show from step 3 onward if selected
  if (wizardState.subcategory && currentIdx >= getStepIndex(WizardStep.Micro)) {
    const label = txSubcategory(wizardState.subcategory, t) ?? wizardState.subcategory;
    crumbs.push({
      step: WizardStep.Subcategory,
      label,
      completed: currentIdx > getStepIndex(WizardStep.Subcategory),
    });
  }

  // Micro crumb — show from step 4 onward if tasks selected
  if (wizardState.microNames.length > 0 && currentIdx >= getStepIndex(WizardStep.Questions)) {
    const count = wizardState.microNames.length;
    const label = t('breadcrumbs.tasksSelected', { count });
    crumbs.push({
      step: WizardStep.Micro,
      label,
      completed: currentIdx > getStepIndex(WizardStep.Micro),
    });
  }

  if (crumbs.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mb-1">
      {crumbs.map((crumb, idx) => (
        <div key={crumb.step} className="flex items-center gap-1.5 shrink-0">
          {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
          <Badge
            variant={crumb.completed ? 'default' : 'accent'}
            className="cursor-pointer text-[11px] py-0.5 px-2 gap-1 whitespace-nowrap font-medium transition-all hover:opacity-80"
            onClick={() => onStepClick(crumb.step)}
          >
            {crumb.completed && <Check className="h-3 w-3 shrink-0" />}
            {crumb.label}
          </Badge>
        </div>
      ))}
    </div>
  );
}
