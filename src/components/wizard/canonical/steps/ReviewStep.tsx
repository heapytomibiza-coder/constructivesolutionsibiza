/**
 * Review Step - "Job Brief" Story Format
 * A clean, scannable summary that reads like a confirmation page
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Pencil, Users, User, Camera, FileText } from 'lucide-react';
import { WizardState, WizardStep, DispatchMode } from '../types';
import { formatBudgetRange, formatLocationDisplay, formatTiming } from '../lib/formatDisplay';

interface ReviewStepProps {
  wizardState: WizardState;
  onEdit: (step: WizardStep) => void;
  onDispatchModeChange: (mode: DispatchMode) => void;
  isAuthenticated: boolean;
}

function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
    >
      <Pencil className="h-3 w-3" />
      Edit
    </button>
  );
}

export function ReviewStep({
  wizardState,
  onEdit,
  onDispatchModeChange,
  isAuthenticated,
}: ReviewStepProps) {
  const {
    mainCategory,
    subcategory,
    microNames,
    logistics,
    extras,
    dispatchMode,
    targetProfessionalId,
    targetProfessionalName,
  } = wizardState;

  const formattedLocation = formatLocationDisplay(
    logistics.location,
    logistics.customLocation
  );
  const formattedTiming = formatTiming(logistics.startDatePreset);
  const formattedBudget = formatBudgetRange(logistics.budgetRange);

  const hasPhotos = extras.photos.length > 0;
  const hasNotes = Boolean(extras.notes);

  return (
    <div className="space-y-6">
      {/* Job Brief Card */}
      <Card className="overflow-hidden">
        {/* Header - Category */}
        <div className="bg-primary/5 px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="font-medium">
                {mainCategory || 'Category'}
              </Badge>
              {subcategory && (
                <span className="text-sm text-muted-foreground">→ {subcategory}</span>
              )}
            </div>
            <EditLink onClick={() => onEdit(WizardStep.Category)} />
          </div>
        </div>

        {/* Content - Story Flow */}
        <CardContent className="p-5 space-y-5">
          {/* What you need */}
          <section>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              What you need
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
              <p className="text-muted-foreground italic">No tasks selected</p>
            )}
            <EditLink onClick={() => onEdit(WizardStep.Micro)} />
          </section>

          {/* Where & When - Grid */}
          <section className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Where</span>
              <p className="font-medium">{formattedLocation}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-1">When</span>
              <p className="font-medium">{formattedTiming}</p>
            </div>
          </section>

          {/* Budget - Prominent */}
          <section className="pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground block mb-1">Budget</span>
            <p className="text-lg font-semibold text-primary">{formattedBudget}</p>
            <EditLink onClick={() => onEdit(WizardStep.Logistics)} />
          </section>

          {/* Attachments - Compact badges */}
          {(hasPhotos || hasNotes) && (
            <section className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
              {hasPhotos && (
                <Badge variant="outline" className="gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  {extras.photos.length} photo{extras.photos.length > 1 ? 's' : ''}
                </Badge>
              )}
              {hasNotes && (
                <Badge variant="outline" className="gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Notes added
                </Badge>
              )}
              <EditLink onClick={() => onEdit(WizardStep.Extras)} />
            </section>
          )}
        </CardContent>
      </Card>

      {/* Dispatch Mode Selection */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            How would you like to send this job?
          </h4>

          <RadioGroup
            value={dispatchMode}
            onValueChange={(value) => onDispatchModeChange(value as DispatchMode)}
            className="space-y-3"
          >
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-border hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="broadcast" className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <p className="font-medium">Send to available professionals</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Your job will be visible to matching professionals who can respond
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-border hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="direct" className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <p className="font-medium">Send to a specific professional</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Start a private conversation — no public listing
                </p>
              </div>
            </label>
          </RadioGroup>

          {/* Selected professional (direct mode) */}
          {dispatchMode === 'direct' && (
            <div className="pt-3 border-t border-border">
              {targetProfessionalId ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {targetProfessionalName || 'Professional'}
                    </p>
                    <p className="text-xs text-muted-foreground">Selected professional</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/professionals?select=true">Change</Link>
                  </Button>
                </div>
              ) : (
                <Button variant="outline" asChild className="w-full">
                  <Link to="/professionals?select=true">Choose a Professional</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auth notice */}
      {!isAuthenticated && (
        <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            You'll need to sign in to post this job. Your progress will be saved.
          </p>
        </div>
      )}
    </div>
  );
}
