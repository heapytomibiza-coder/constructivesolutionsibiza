/**
 * Review Step - "Job Brief" Story Format (Save-First)
 * A clean, scannable summary that reads like a confirmation page.
 * No dispatch mode selection — distribution happens post-save from dashboard.
 */

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Camera, FileText, Save } from 'lucide-react';
import { WizardState, WizardStep } from '../types';
import { formatBudgetRange, formatLocationDisplay, formatTiming } from '../lib/formatDisplay';
import { txCategory, txSubcategory, txMicro } from '@/i18n/taxonomyTranslations';

interface ReviewStepProps {
  wizardState: WizardState;
  onEdit: (step: WizardStep) => void;
  isAuthenticated: boolean;
}

function EditLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
    >
      <Pencil className="h-3 w-3" />
      {label}
    </button>
  );
}

export function ReviewStep({
  wizardState,
  onEdit,
  isAuthenticated,
}: ReviewStepProps) {
  const { t } = useTranslation(['wizard', 'jobs']);
  const {
    mainCategory,
    subcategory,
    microNames,
    logistics,
    extras,
  } = wizardState;

  const formattedLocation = formatLocationDisplay(
    logistics.location,
    logistics.customLocation,
    t
  );
  const formattedTiming = formatTiming(logistics.startDatePreset, undefined, t);
  const formattedBudget = formatBudgetRange(logistics.budgetRange, t);

  const hasPhotos = extras.photos.length > 0;
  const hasNotes = Boolean(extras.notes);

  const editLabel = t('wizard:review.edit', 'Edit');

  return (
    <div className="space-y-6">
      {/* Job Brief Card */}
      <Card className="overflow-hidden">
        {/* Header - Category */}
        <div className="bg-primary/5 px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="font-medium">
                {mainCategory || t('wizard:review.category', 'Category')}
              </Badge>
              {subcategory && (
                <span className="text-sm text-muted-foreground">→ {subcategory}</span>
              )}
            </div>
            <EditLink onClick={() => onEdit(WizardStep.Category)} label={editLabel} />
          </div>
        </div>

        {/* Content - Story Flow */}
        <CardContent className="p-5 space-y-5">
          {/* What you need */}
          <section>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {t('wizard:review.whatYouNeed', 'What you need')}
            </h4>
            {microNames.length > 0 ? (
              <ul className="space-y-1.5">
                {microNames.map((name, i) => (
                  <li key={i} className="font-medium flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">
                {t('wizard:review.noTasks', 'No tasks selected')}
              </p>
            )}
            <EditLink onClick={() => onEdit(WizardStep.Micro)} label={editLabel} />
          </section>

          {/* Where & When - Grid */}
          <section className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <span className="text-sm text-muted-foreground block mb-1">
                {t('wizard:review.where', 'Where')}
              </span>
              <p className="font-medium">{formattedLocation}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-1">
                {t('wizard:review.when', 'When')}
              </span>
              <p className="font-medium">{formattedTiming}</p>
            </div>
          </section>

          {/* Budget - Prominent */}
          <section className="pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground block mb-1">
              {t('wizard:review.budget', 'Budget')}
            </span>
            <p className="text-lg font-semibold text-primary">{formattedBudget}</p>
            <EditLink onClick={() => onEdit(WizardStep.Logistics)} label={editLabel} />
          </section>

          {/* Attachments - Compact badges */}
          {(hasPhotos || hasNotes) && (
            <section className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
              {hasPhotos && (
                <Badge variant="outline" className="gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  {t('wizard:review.photosCount', '{{count}} photo', { count: extras.photos.length })}
                </Badge>
              )}
              {hasNotes && (
                <Badge variant="outline" className="gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {t('wizard:review.notesAdded', 'Notes added')}
                </Badge>
              )}
              <EditLink onClick={() => onEdit(WizardStep.Extras)} label={editLabel} />
            </section>
          )}
        </CardContent>
      </Card>

      {/* Reassurance + Save explanation */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          <Save className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {t('wizard:review.noObligation', "You're not committing to hire anyone")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('wizard:review.noObligationDesc', 'Your job will be matched with local professionals. You can edit, cancel, or ignore replies anytime — no obligation.')}
            </p>
          </div>
        </div>
      </div>

      {/* Auth notice */}
      {!isAuthenticated && (
        <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            {t('wizard:review.authNotice', "You'll need to sign in to save this job. Your progress will be saved.")}
          </p>
        </div>
      )}
    </div>
  );
}
