/**
 * INTERACTION TEST — Wizard state progression
 *
 * Simulates a user moving through Category → Subcategory → Micro → Questions
 * by driving WizardState directly (no DOM coupling to wizard UI internals).
 *
 * This validates the state machine, not the rendered UI.
 */
import { describe, it, expect } from 'vitest';
import {
  EMPTY_WIZARD_STATE,
  WizardStep,
  getNextStep,
  getPrevStep,
  isValidStep,
  type WizardState,
} from '@/features/wizard/canonical/types';
import { checkAccess } from '@/guard/access';

/** Helper: simulate progressive wizard state hydration */
function hydrateWizardState(overrides: Partial<WizardState>): WizardState {
  return { ...EMPTY_WIZARD_STATE, ...overrides };
}

describe('Wizard interaction: category → micro progression', () => {
  it('starts at category with empty state', () => {
    const state = hydrateWizardState({});
    expect(state.mainCategory).toBe('');
    expect(state.mainCategoryId).toBe('');
    expect(state.wizardMode).toBe('structured');
  });

  it('selecting a category populates mainCategory fields', () => {
    const state = hydrateWizardState({
      mainCategory: 'Plumbing',
      mainCategoryId: 'cat-plumbing',
    });
    expect(state.mainCategory).toBe('Plumbing');
    expect(state.mainCategoryId).toBe('cat-plumbing');
    // Next step should be subcategory
    expect(getNextStep(WizardStep.Category)).toBe(WizardStep.Subcategory);
  });

  it('selecting a subcategory populates subcategory fields', () => {
    const state = hydrateWizardState({
      mainCategory: 'Plumbing',
      mainCategoryId: 'cat-plumbing',
      subcategory: 'Leak Repair',
      subcategoryId: 'sub-leak',
    });
    expect(state.subcategory).toBe('Leak Repair');
    expect(getNextStep(WizardStep.Subcategory)).toBe(WizardStep.Micro);
  });

  it('selecting micro services populates micro arrays', () => {
    const state = hydrateWizardState({
      mainCategory: 'Plumbing',
      mainCategoryId: 'cat-plumbing',
      subcategory: 'Leak Repair',
      subcategoryId: 'sub-leak',
      microNames: ['Sink Leak Repair'],
      microIds: ['micro-sink-leak'],
      microSlugs: ['sink-leak-repair'],
    });
    expect(state.microNames).toHaveLength(1);
    expect(state.microSlugs[0]).toBe('sink-leak-repair');
    expect(getNextStep(WizardStep.Micro)).toBe(WizardStep.Questions);
  });

  it('full forward progression walks all 7 steps in order', () => {
    let step: WizardStep | undefined = WizardStep.Category;
    const visited: WizardStep[] = [];

    while (step) {
      visited.push(step);
      step = getNextStep(step);
    }

    expect(visited).toEqual([
      WizardStep.Category,
      WizardStep.Subcategory,
      WizardStep.Micro,
      WizardStep.Questions,
      WizardStep.Logistics,
      WizardStep.Extras,
      WizardStep.Review,
    ]);
  });

  it('backward from Questions returns to Micro', () => {
    expect(getPrevStep(WizardStep.Questions)).toBe(WizardStep.Micro);
  });

  it('answers container is correctly structured after question step', () => {
    const state = hydrateWizardState({
      microSlugs: ['sink-leak-repair'],
      answers: {
        microAnswers: {
          'sink-leak-repair': { leak_location: 'kitchen', severity: 'moderate' },
        },
        _pack_source: 'strong',
        _pack_slug: 'sink-leak-repair',
      },
    });

    expect(state.answers._pack_source).toBe('strong');
    expect(state.answers.microAnswers['sink-leak-repair']).toEqual({
      leak_location: 'kitchen',
      severity: 'moderate',
    });
  });

  it('custom mode bypasses taxonomy but preserves structure', () => {
    const state = hydrateWizardState({
      wizardMode: 'custom',
      customRequest: {
        jobTitle: 'Custom renovation project',
        description: 'Full bathroom remodel',
        specs: 'Premium fixtures',
      },
    });

    expect(state.wizardMode).toBe('custom');
    expect(state.customRequest?.jobTitle).toBe('Custom renovation project');
    // Even custom mode still has valid step utilities
    expect(isValidStep('review')).toBe(true);
  });

  it('multi-micro selection accumulates correctly', () => {
    const state = hydrateWizardState({
      microNames: ['Sink Leak', 'Pipe Burst'],
      microIds: ['m1', 'm2'],
      microSlugs: ['sink-leak', 'pipe-burst'],
    });
    expect(state.microNames).toHaveLength(2);
    expect(state.microSlugs).toContain('pipe-burst');
  });
});
