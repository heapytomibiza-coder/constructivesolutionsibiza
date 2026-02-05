/**
 * Review Step
 * Final review before submission with dispatch mode selection
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Edit2, Users, User } from 'lucide-react';
import { WizardState, WizardStep, DispatchMode } from '../types';

interface ReviewStepProps {
  wizardState: WizardState;
  onEdit: (step: WizardStep) => void;
  onDispatchModeChange: (mode: DispatchMode) => void;
  isAuthenticated: boolean;
}

export function ReviewStep({ wizardState, onEdit, onDispatchModeChange, isAuthenticated }: ReviewStepProps) {
  const { mainCategory, subcategory, microNames, logistics, extras, dispatchMode, targetProfessionalId, targetProfessionalName } = wizardState;

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
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-2 flex-1">
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
            className="self-start min-h-[44px] md:min-h-0"
          >
            <Edit2 className="h-4 w-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">Edit</span>
          </Button>
        </div>
      </div>

      {/* Photos & Notes */}
      {(extras.photos.length > 0 || extras.notes) && (
        <div className="p-4 rounded-lg border border-border space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-2 flex-1">
              {extras.photos.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    Photos
                  </span>
                  {/* Larger thumbnails on mobile */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {extras.photos.slice(0, 4).map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        className="w-16 h-16 sm:w-12 sm:h-12 rounded object-cover border border-border"
                      />
                    ))}
                    {extras.photos.length > 4 && (
                      <div className="w-16 h-16 sm:w-12 sm:h-12 rounded bg-muted flex items-center justify-center text-sm text-muted-foreground">
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
              className="self-start min-h-[44px] md:min-h-0"
            >
              <Edit2 className="h-4 w-4 mr-2 sm:mr-0" />
              <span className="sm:hidden">Edit</span>
            </Button>
          </div>
        </div>
      )}

      {/* Dispatch Mode Selection */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          How would you like to send this job?
        </span>
        
        <RadioGroup 
          value={dispatchMode} 
          onValueChange={(value) => onDispatchModeChange(value as DispatchMode)}
          className="space-y-3"
        >
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors">
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
          
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors">
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
        
        {/* Show selected professional if in direct mode */}
        {dispatchMode === 'direct' && (
          <div className="mt-3 pt-3 border-t border-border">
            {targetProfessionalId ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{targetProfessionalName || 'Professional'}</p>
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
      </div>

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
