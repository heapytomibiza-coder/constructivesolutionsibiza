/**
 * Review Step
 * Final review before submission
 */

import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import { WizardState, WizardStep } from '../types';

interface ReviewStepProps {
  wizardState: WizardState;
  onEdit: (step: WizardStep) => void;
  isAuthenticated: boolean;
}

export function ReviewStep({ wizardState, onEdit, isAuthenticated }: ReviewStepProps) {
  const { mainCategory, subcategory, microNames, logistics, extras } = wizardState;

  return (
    <div className="space-y-6">
      <h3 className="font-display text-lg font-semibold">
        Review Your Job
      </h3>

      {/* Category & Services */}
      <div className="p-4 rounded-lg border border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Category
            </span>
            <p className="font-medium">{mainCategory || '—'}</p>
            <p className="text-sm text-muted-foreground">{subcategory}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(WizardStep.Category)}
            className="self-start min-h-[44px] md:min-h-0"
          >
            <Edit2 className="h-4 w-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">Edit</span>
          </Button>
        </div>
      </div>

      {/* Selected Tasks */}
      <div className="p-4 rounded-lg border border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Selected Tasks
            </span>
            {microNames.length > 0 ? (
              <ul className="mt-1 space-y-1">
                {microNames.map((name, i) => (
                  <li key={i} className="font-medium">• {name}</li>
                ))}
              </ul>
            ) : (
              <p className="font-medium text-muted-foreground">No tasks selected</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(WizardStep.Micro)}
            className="self-start min-h-[44px] md:min-h-0"
          >
            <Edit2 className="h-4 w-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">Edit</span>
          </Button>
        </div>
      </div>

      {/* Location & Timing */}
      <div className="p-4 rounded-lg border border-border space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Location
              </span>
              <p className="font-medium">
                {logistics.location === 'other' 
                  ? logistics.customLocation || 'Custom location'
                  : logistics.location?.replace(/_/g, ' ') || '—'
                }
              </p>
            </div>
            {logistics.startDatePreset && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Timing
                </span>
                <p className="font-medium">
                  {logistics.startDatePreset.replace(/_/g, ' ')}
                </p>
              </div>
            )}
            {logistics.budgetRange && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Budget
                </span>
                <p className="font-medium">{logistics.budgetRange}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(WizardStep.Logistics)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Photos & Notes */}
      {(extras.photos.length > 0 || extras.notes) && (
        <div className="p-4 rounded-lg border border-border space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              {extras.photos.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    Photos
                  </span>
                  <div className="flex gap-2 mt-2">
                    {extras.photos.slice(0, 4).map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        className="w-12 h-12 rounded object-cover border border-border"
                      />
                    ))}
                    {extras.photos.length > 4 && (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-sm text-muted-foreground">
                        +{extras.photos.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {extras.notes && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    Notes
                  </span>
                  <p className="font-medium line-clamp-2">{extras.notes}</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(WizardStep.Extras)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Auth notice */}
      {!isAuthenticated && (
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            You'll need to sign in to post this job. Your progress will be saved.
          </p>
        </div>
      )}
    </div>
  );
}
