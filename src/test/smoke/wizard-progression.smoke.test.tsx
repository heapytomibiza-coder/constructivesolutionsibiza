/**
 * SMOKE TEST — Wizard step progression (unit-level)
 *
 * Validates the core wizard state machine: step navigation,
 * state transitions, and validation logic — without full DOM rendering.
 */
import { describe, it, expect } from 'vitest';
import {
  WizardStep,
  STEP_ORDER,
  EMPTY_WIZARD_STATE,
  getStepIndex,
  getNextStep,
  getPrevStep,
  isValidStep,
} from '@/features/wizard/canonical/types';

describe('Wizard step progression', () => {
  const CANONICAL_ORDER: WizardStep[] = [
    WizardStep.Category,
    WizardStep.Subcategory,
    WizardStep.Micro,
    WizardStep.Questions,
    WizardStep.Logistics,
    WizardStep.Extras,
    WizardStep.Review,
  ];

  it('STEP_ORDER matches canonical 7-step flow', () => {
    expect(STEP_ORDER).toEqual(CANONICAL_ORDER);
  });

  it('getStepIndex returns correct indices', () => {
    CANONICAL_ORDER.forEach((step, i) => {
      expect(getStepIndex(step)).toBe(i);
    });
  });

  it('getNextStep chains through entire flow', () => {
    let current: WizardStep | undefined = WizardStep.Category;
    const visited: WizardStep[] = [current];
    while (current) {
      current = getNextStep(current);
      if (current) visited.push(current);
    }
    expect(visited).toEqual(CANONICAL_ORDER);
  });

  it('getPrevStep chains backwards through entire flow', () => {
    let current: WizardStep | undefined = WizardStep.Review;
    const visited: WizardStep[] = [current];
    while (current) {
      current = getPrevStep(current);
      if (current) visited.push(current);
    }
    expect(visited).toEqual([...CANONICAL_ORDER].reverse());
  });

  it('forward then backward returns to start', () => {
    let step: WizardStep | undefined = WizardStep.Category;
    // Go forward 3 steps
    step = getNextStep(step!);
    step = getNextStep(step!);
    step = getNextStep(step!);
    expect(step).toBe(WizardStep.Questions);
    // Go backward 3 steps
    step = getPrevStep(step!);
    step = getPrevStep(step!);
    step = getPrevStep(step!);
    expect(step).toBe(WizardStep.Category);
  });
});

describe('Wizard state defaults', () => {
  it('empty state has no selections', () => {
    const s = EMPTY_WIZARD_STATE;
    expect(s.mainCategory).toBe('');
    expect(s.mainCategoryId).toBe('');
    expect(s.subcategory).toBe('');
    expect(s.subcategoryId).toBe('');
    expect(s.microIds).toEqual([]);
    expect(s.microNames).toEqual([]);
    expect(s.microSlugs).toEqual([]);
  });

  it('empty state has safe nested objects', () => {
    const s = EMPTY_WIZARD_STATE;
    expect(s.answers).toBeDefined();
    expect(s.answers.microAnswers).toEqual({});
    expect(s.logistics).toBeDefined();
    expect(s.logistics.location).toBe('');
    expect(s.extras).toBeDefined();
    expect(s.extras.photos).toEqual([]);
  });

  it('empty state defaults to broadcast + structured', () => {
    expect(EMPTY_WIZARD_STATE.dispatchMode).toBe('broadcast');
    expect(EMPTY_WIZARD_STATE.wizardMode).toBe('structured');
    expect(EMPTY_WIZARD_STATE.customRequest).toBeUndefined();
  });
});

describe('Wizard step validation', () => {
  it('all step enum values are valid', () => {
    Object.values(WizardStep).forEach((step) => {
      expect(isValidStep(step)).toBe(true);
    });
  });

  it('rejects garbage input', () => {
    expect(isValidStep('')).toBe(false);
    expect(isValidStep('step1')).toBe(false);
    expect(isValidStep('Category')).toBe(false); // case-sensitive
    expect(isValidStep('undefined')).toBe(false);
  });
});
