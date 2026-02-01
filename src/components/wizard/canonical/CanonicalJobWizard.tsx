/**
 * Canonical Job Wizard
 * V2 clean architecture - 6-step flow with string enum steps
 * 
 * Flow: Category → Subcategory → Micro → Logistics → Extras → Review
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Canonical modules
import { 
  WizardState, 
  WizardStep, 
  EMPTY_WIZARD_STATE, 
  STEP_TITLES,
  STEP_ORDER,
  getStepIndex,
  getNextStep,
  getPrevStep,
  isValidStep,
} from './types';
import { useWizardUrlStep } from './hooks/useWizardUrlStep';
import { useWizardDraft } from './hooks/useWizardDraft';
import { buildJobInsert, validateWizardState } from './lib/buildJobPayload';

// DB-powered selectors
import CategorySelector from '@/components/wizard/db-powered/CategorySelector';
import SubcategorySelector from '@/components/wizard/db-powered/SubcategorySelector';
import MicroStep from '@/components/wizard/db-powered/MicroStep';

// Step components
import { LogisticsStep } from './steps/LogisticsStep';
import { ExtrasStep } from './steps/ExtrasStep';
import { ReviewStep } from './steps/ReviewStep';

interface CanonicalJobWizardProps {
  className?: string;
}

export function CanonicalJobWizard({ className }: CanonicalJobWizardProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSession();
  
  // Core wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.Category);
  const [wizardState, setWizardState] = useState<WizardState>(EMPTY_WIZARD_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // URL sync
  useWizardUrlStep(currentStep, setCurrentStep);
  
  // Draft management
  const { isDirty, checkForDraft, getPendingDraft, clearDraft, resetSession } = useWizardDraft(wizardState);
  
  // Draft recovery modal state
  const [showDraftModal, setShowDraftModal] = useState(false);
  
  // Check for draft on mount
  useEffect(() => {
    const result = checkForDraft();
    if (result.status === 'found') {
      setShowDraftModal(true);
    }
  }, []);
  
  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // === STEP HANDLERS ===
  
  const handleCategorySelect = useCallback((categoryName: string, categoryId: string) => {
    flushSync(() => {
      setWizardState(prev => ({
        ...prev,
        mainCategory: categoryName,
        mainCategoryId: categoryId,
        // Reset downstream selections
        subcategory: '',
        subcategoryId: '',
        microNames: [],
        microIds: [],
        microSlugs: [],
        answers: {},
      }));
    });
    setCurrentStep(WizardStep.Subcategory);
  }, []);

  const handleSubcategorySelect = useCallback((subcategoryName: string, subcategoryId: string) => {
    flushSync(() => {
      setWizardState(prev => ({
        ...prev,
        subcategory: subcategoryName,
        subcategoryId: subcategoryId,
        // Reset downstream selections
        microNames: [],
        microIds: [],
        microSlugs: [],
        answers: {},
      }));
    });
    setCurrentStep(WizardStep.Micro);
  }, []);

  const handleMicroSelect = useCallback((microNames: string[], microIds: string[], microSlugs: string[]) => {
    setWizardState(prev => ({
      ...prev,
      microNames,
      microIds,
      microSlugs,
    }));
  }, []);

  const handleLogisticsChange = useCallback(
    (patch: Partial<WizardState['logistics']>) => {
      setWizardState(prev => ({
        ...prev,
        logistics: { ...prev.logistics, ...patch },
      }));
    },
    []
  );

  const handleExtrasChange = useCallback(
    (patch: Partial<WizardState['extras']>) => {
      setWizardState(prev => ({
        ...prev,
        extras: { ...prev.extras, ...patch },
      }));
    },
    []
  );

  // === NAVIGATION ===
  
  const canAdvance = useCallback((): boolean => {
    switch (currentStep) {
      case WizardStep.Category:
        return !!wizardState.mainCategoryId;
      case WizardStep.Subcategory:
        return !!wizardState.subcategoryId;
      case WizardStep.Micro:
        return wizardState.microIds.length > 0;
      case WizardStep.Logistics:
        return !!wizardState.logistics.location;
      case WizardStep.Extras:
        return true; // Extras are optional
      case WizardStep.Review:
        return true;
      default:
        return false;
    }
  }, [currentStep, wizardState]);

  const handleNext = useCallback(() => {
    if (currentStep !== WizardStep.Review && canAdvance()) {
      const nextStep = getNextStep(currentStep);
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    }
  }, [currentStep, canAdvance]);

  const handleBack = useCallback(() => {
    const prevStep = getPrevStep(currentStep);
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  }, [currentStep]);

  const handleJumpToStep = useCallback((step: WizardStep) => {
    // Only allow jumping to completed steps or current
    const currentIndex = getStepIndex(currentStep);
    const targetIndex = getStepIndex(step);
    if (targetIndex <= currentIndex) {
      setCurrentStep(step);
    }
  }, [currentStep]);

  // === DRAFT RECOVERY ===
  
  const handleResumeDraft = useCallback(() => {
    const draft = getPendingDraft();
    if (draft) {
      setWizardState(draft);
      // Jump to the furthest completed step
      if (draft.logistics.location) {
        setCurrentStep(WizardStep.Review);
      } else if (draft.microIds.length > 0) {
        setCurrentStep(WizardStep.Logistics);
      } else if (draft.subcategoryId) {
        setCurrentStep(WizardStep.Micro);
      } else if (draft.mainCategoryId) {
        setCurrentStep(WizardStep.Subcategory);
      }
    }
    setShowDraftModal(false);
  }, [getPendingDraft]);

  const handleStartFresh = useCallback(() => {
    clearDraft();
    setWizardState(EMPTY_WIZARD_STATE);
    setCurrentStep(WizardStep.Category);
    setShowDraftModal(false);
  }, [clearDraft]);

  // === SUBMISSION ===
  
  const handleSubmit = useCallback(async () => {
    // Auth check
    if (!isAuthenticated || !user) {
      // Save current state and redirect to auth
      sessionStorage.setItem('wizardState', JSON.stringify(wizardState));
      navigate('/auth?returnUrl=/post');
      return;
    }

    // Validate
    const validation = validateWizardState(wizardState);
    if (!validation.valid) {
      validation.errors.forEach(err => toast.error(err));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildJobInsert(user.id, wizardState);
      
      const { data, error } = await supabase
        .from('jobs')
        .insert([payload])
        .select('id')
        .single();

      if (error) {
        // Check for duplicate
        if (error.code === '23505') {
          toast.info('This job was already submitted');
          navigate('/dashboard');
          return;
        }
        throw error;
      }

      // Success - clear draft and navigate
      clearDraft();
      resetSession();
      toast.success('Job posted successfully!');
      navigate(`/dashboard?highlight=${data.id}`);
      
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, user, wizardState, navigate, clearDraft, resetSession]);

  // === RENDER ===
  
  const stepIndex = getStepIndex(currentStep);
  const totalSteps = STEP_ORDER.length;
  const progress = (stepIndex / (totalSteps - 1)) * 100;

  return (
    <div className={className}>
      {/* Draft Recovery Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <h3 className="font-display text-lg font-semibold mb-2">
                Resume your draft?
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                We found an unfinished job posting. Would you like to continue where you left off?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleStartFresh} className="flex-1">
                  Start Fresh
                </Button>
                <Button onClick={handleResumeDraft} className="flex-1">
                  Resume Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Step {stepIndex + 1} of {totalSteps}
          </span>
          <span className="text-sm text-muted-foreground">
            {STEP_TITLES[currentStep]}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === WizardStep.Category && (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold">
                What type of service do you need?
              </h3>
              <CategorySelector
                selectedCategory={wizardState.mainCategory}
                onSelect={handleCategorySelect}
              />
            </div>
          )}

          {currentStep === WizardStep.Subcategory && (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold">
                What kind of {wizardState.mainCategory.toLowerCase()} work?
              </h3>
              <SubcategorySelector
                categoryId={wizardState.mainCategoryId}
                categoryName={wizardState.mainCategory}
                selectedSubcategoryId={wizardState.subcategoryId}
                onSelect={handleSubcategorySelect}
              />
            </div>
          )}

          {currentStep === WizardStep.Micro && (
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold">
                Select the specific tasks you need
              </h3>
              <MicroStep
                subcategoryId={wizardState.subcategoryId}
                selectedMicroIds={wizardState.microIds}
                onSelect={handleMicroSelect}
              />
            </div>
          )}

          {currentStep === WizardStep.Logistics && (
            <LogisticsStep
              logistics={wizardState.logistics}
              onChange={handleLogisticsChange}
            />
          )}

          {currentStep === WizardStep.Extras && (
            <ExtrasStep
              extras={wizardState.extras}
              onChange={handleExtrasChange}
            />
          )}

          {currentStep === WizardStep.Review && (
            <ReviewStep
              wizardState={wizardState}
              onEdit={handleJumpToStep}
              isAuthenticated={isAuthenticated}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === WizardStep.Category}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep === WizardStep.Review ? (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : isAuthenticated ? (
              <>
                Post Job
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Sign In to Post
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          // Show Continue button for Micro step and later
          currentStep !== WizardStep.Category && currentStep !== WizardStep.Subcategory && (
            <Button
              onClick={handleNext}
              disabled={!canAdvance()}
              className="gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )
        )}
      </div>
    </div>
  );
}

export default CanonicalJobWizard;
