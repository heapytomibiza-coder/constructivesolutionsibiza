/**
 * Carpentry Question Packs - V2 Format (i18n-based)
 * Uses key-based question identifiers and i18n keys for labels
 * Format: Ready for seed function with normalization
 */

export interface QuestionOptionV2 {
  i18nKey: string;
  value: string;
  order: number;
}

export interface QuestionDefV2 {
  key: string;
  type: 'single' | 'multi' | 'text' | 'textarea' | 'number' | 'file';
  i18nKey: string;
  required: boolean;
  options?: QuestionOptionV2[];
  placeholder?: string;
}

export interface MicroservicePackV2 {
  microSlug: string;
  subcategorySlug: string;
  categorySlug: string;
  questions: QuestionDefV2[];
}

export const newCarpentryQuestionPacks: MicroservicePackV2[] = [
  {
    microSlug: 'cabinet-installation',
    subcategorySlug: 'cabinetry-storage',
    categorySlug: 'carpentry',
    questions: [
      {
        key: 'location',
        type: 'single',
        i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q1.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q1.options.kitchen', value: 'kitchen', order: 0 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q1.options.bathroom', value: 'bathroom', order: 1 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q1.options.utility-room', value: 'utility-room', order: 2 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q1.options.living-room', value: 'living-room', order: 3 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q1.options.bedroom', value: 'bedroom', order: 4 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q1.options.hallway', value: 'hallway', order: 5 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q1.options.multiple-areas', value: 'multiple-areas', order: 6 }
        ]
      },
      {
        key: 'cabinet_type',
        type: 'single',
        i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q2.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q2.options.flat-pack', value: 'flat-pack', order: 0 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q2.options.pre-assembled', value: 'pre-assembled', order: 1 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q2.options.custom-made', value: 'custom-made', order: 2 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q2.options.not-sure', value: 'not-sure', order: 3 }
        ]
      },
      {
        key: 'count',
        type: 'single',
        i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q3.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q3.options.1-3', value: '1-3', order: 0 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q3.options.4-6', value: '4-6', order: 1 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q3.options.7-10', value: '7-10', order: 2 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q3.options.10-plus', value: '10-plus', order: 3 }
        ]
      },
      {
        key: 'removal_needed',
        type: 'single',
        i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q4.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q4.options.yes-remove', value: 'yes-remove', order: 0 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q4.options.no-removal', value: 'no-removal', order: 1 }
        ]
      },
      {
        key: 'walls',
        type: 'single',
        i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q5.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q5.options.plasterboard', value: 'plasterboard', order: 0 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q5.options.block', value: 'block', order: 1 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q5.options.concrete', value: 'concrete', order: 2 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q5.options.mixed-unsure', value: 'mixed-unsure', order: 3 }
        ]
      },
      {
        key: 'extras',
        type: 'multi',
        i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q6.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q6.options.worktop-fitting', value: 'worktop-fitting', order: 0 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q6.options.plumbing-connection', value: 'plumbing-connection', order: 1 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q6.options.electrical-adjustments', value: 'electrical-adjustments', order: 2 },
          { i18nKey: 'carpentry.cabinetry-storage.cabinet-installation.q6.options.none', value: 'none', order: 3 }
        ]
      }
    ]
  },
  {
    microSlug: 'deck-construction',
    subcategorySlug: 'decking',
    categorySlug: 'carpentry',
    questions: [
      {
        key: 'deck_size',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-construction.q1.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-construction.q1.options.small', value: 'small', order: 0 },
          { i18nKey: 'carpentry.decking.deck-construction.q1.options.medium', value: 'medium', order: 1 },
          { i18nKey: 'carpentry.decking.deck-construction.q1.options.large', value: 'large', order: 2 },
          { i18nKey: 'carpentry.decking.deck-construction.q1.options.extra-large', value: 'extra-large', order: 3 }
        ]
      },
      {
        key: 'material',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-construction.q2.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-construction.q2.options.softwood', value: 'softwood', order: 0 },
          { i18nKey: 'carpentry.decking.deck-construction.q2.options.hardwood', value: 'hardwood', order: 1 },
          { i18nKey: 'carpentry.decking.deck-construction.q2.options.composite', value: 'composite', order: 2 },
          { i18nKey: 'carpentry.decking.deck-construction.q2.options.pvc', value: 'pvc', order: 3 },
          { i18nKey: 'carpentry.decking.deck-construction.q2.options.not-sure', value: 'not-sure', order: 4 }
        ]
      },
      {
        key: 'height',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-construction.q3.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-construction.q3.options.ground-level', value: 'ground-level', order: 0 },
          { i18nKey: 'carpentry.decking.deck-construction.q3.options.low-raised', value: 'low-raised', order: 1 },
          { i18nKey: 'carpentry.decking.deck-construction.q3.options.raised', value: 'raised', order: 2 },
          { i18nKey: 'carpentry.decking.deck-construction.q3.options.high-deck', value: 'high-deck', order: 3 }
        ]
      },
      {
        key: 'features',
        type: 'multi',
        i18nKey: 'carpentry.decking.deck-construction.q4.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.decking.deck-construction.q4.options.steps', value: 'steps', order: 0 },
          { i18nKey: 'carpentry.decking.deck-construction.q4.options.railing', value: 'railing', order: 1 },
          { i18nKey: 'carpentry.decking.deck-construction.q4.options.built-in-seating', value: 'built-in-seating', order: 2 },
          { i18nKey: 'carpentry.decking.deck-construction.q4.options.lighting', value: 'lighting', order: 3 },
          { i18nKey: 'carpentry.decking.deck-construction.q4.options.none', value: 'none', order: 4 }
        ]
      },
      {
        key: 'access',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-construction.q5.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-construction.q5.options.easy', value: 'easy', order: 0 },
          { i18nKey: 'carpentry.decking.deck-construction.q5.options.moderate', value: 'moderate', order: 1 },
          { i18nKey: 'carpentry.decking.deck-construction.q5.options.poor', value: 'poor', order: 2 },
          { i18nKey: 'carpentry.decking.deck-construction.q5.options.unsure', value: 'unsure', order: 3 }
        ]
      },
      {
        key: 'old_deck',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-construction.q6.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-construction.q6.options.yes', value: 'yes', order: 0 },
          { i18nKey: 'carpentry.decking.deck-construction.q6.options.no', value: 'no', order: 1 },
          { i18nKey: 'carpentry.decking.deck-construction.q6.options.no-deck-currently', value: 'no-deck-currently', order: 2 }
        ]
      }
    ]
  },
  {
    microSlug: 'deck-repair',
    subcategorySlug: 'decking',
    categorySlug: 'carpentry',
    questions: [
      {
        key: 'issues',
        type: 'multi',
        i18nKey: 'carpentry.decking.deck-repair.q1.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-repair.q1.options.loose-broken-boards', value: 'loose-broken-boards', order: 0 },
          { i18nKey: 'carpentry.decking.deck-repair.q1.options.rotten-wood', value: 'rotten-wood', order: 1 },
          { i18nKey: 'carpentry.decking.deck-repair.q1.options.wobbly-railing', value: 'wobbly-railing', order: 2 },
          { i18nKey: 'carpentry.decking.deck-repair.q1.options.structural-issues', value: 'structural-issues', order: 3 },
          { i18nKey: 'carpentry.decking.deck-repair.q1.options.general-wear', value: 'general-wear', order: 4 }
        ]
      },
      {
        key: 'deck_size',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-repair.q2.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-repair.q2.options.small', value: 'small', order: 0 },
          { i18nKey: 'carpentry.decking.deck-repair.q2.options.medium', value: 'medium', order: 1 },
          { i18nKey: 'carpentry.decking.deck-repair.q2.options.large', value: 'large', order: 2 },
          { i18nKey: 'carpentry.decking.deck-repair.q2.options.unsure', value: 'unsure', order: 3 }
        ]
      },
      {
        key: 'material',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-repair.q3.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-repair.q3.options.softwood', value: 'softwood', order: 0 },
          { i18nKey: 'carpentry.decking.deck-repair.q3.options.hardwood', value: 'hardwood', order: 1 },
          { i18nKey: 'carpentry.decking.deck-repair.q3.options.composite', value: 'composite', order: 2 },
          { i18nKey: 'carpentry.decking.deck-repair.q3.options.pvc', value: 'pvc', order: 3 },
          { i18nKey: 'carpentry.decking.deck-repair.q3.options.unsure', value: 'unsure', order: 4 }
        ]
      },
      {
        key: 'age',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-repair.q4.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.decking.deck-repair.q4.options.0-5-years', value: '0-5-years', order: 0 },
          { i18nKey: 'carpentry.decking.deck-repair.q4.options.5-10-years', value: '5-10-years', order: 1 },
          { i18nKey: 'carpentry.decking.deck-repair.q4.options.10-20-years', value: '10-20-years', order: 2 },
          { i18nKey: 'carpentry.decking.deck-repair.q4.options.20-plus-years', value: '20-plus-years', order: 3 },
          { i18nKey: 'carpentry.decking.deck-repair.q4.options.not-sure', value: 'not-sure', order: 4 }
        ]
      },
      {
        key: 'urgent',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-repair.q5.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-repair.q5.options.emergency', value: 'emergency', order: 0 },
          { i18nKey: 'carpentry.decking.deck-repair.q5.options.within-week', value: 'within-week', order: 1 },
          { i18nKey: 'carpentry.decking.deck-repair.q5.options.not-urgent', value: 'not-urgent', order: 2 }
        ]
      }
    ]
  },
  {
    microSlug: 'deck-replacement',
    subcategorySlug: 'decking',
    categorySlug: 'carpentry',
    questions: [
      {
        key: 'reason',
        type: 'multi',
        i18nKey: 'carpentry.decking.deck-replacement.q1.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-replacement.q1.options.rotten-wood', value: 'rotten-wood', order: 0 },
          { i18nKey: 'carpentry.decking.deck-replacement.q1.options.unsafe-structure', value: 'unsafe-structure', order: 1 },
          { i18nKey: 'carpentry.decking.deck-replacement.q1.options.old-worn', value: 'old-worn', order: 2 },
          { i18nKey: 'carpentry.decking.deck-replacement.q1.options.design-change', value: 'design-change', order: 3 }
        ]
      },
      {
        key: 'size',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-replacement.q2.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-replacement.q2.options.small', value: 'small', order: 0 },
          { i18nKey: 'carpentry.decking.deck-replacement.q2.options.medium', value: 'medium', order: 1 },
          { i18nKey: 'carpentry.decking.deck-replacement.q2.options.large', value: 'large', order: 2 },
          { i18nKey: 'carpentry.decking.deck-replacement.q2.options.extra-large', value: 'extra-large', order: 3 },
          { i18nKey: 'carpentry.decking.deck-replacement.q2.options.unsure', value: 'unsure', order: 4 }
        ]
      },
      {
        key: 'material',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-replacement.q3.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-replacement.q3.options.softwood', value: 'softwood', order: 0 },
          { i18nKey: 'carpentry.decking.deck-replacement.q3.options.hardwood', value: 'hardwood', order: 1 },
          { i18nKey: 'carpentry.decking.deck-replacement.q3.options.composite', value: 'composite', order: 2 },
          { i18nKey: 'carpentry.decking.deck-replacement.q3.options.pvc', value: 'pvc', order: 3 },
          { i18nKey: 'carpentry.decking.deck-replacement.q3.options.not-sure', value: 'not-sure', order: 4 }
        ]
      },
      {
        key: 'features',
        type: 'multi',
        i18nKey: 'carpentry.decking.deck-replacement.q4.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.decking.deck-replacement.q4.options.steps', value: 'steps', order: 0 },
          { i18nKey: 'carpentry.decking.deck-replacement.q4.options.railing', value: 'railing', order: 1 },
          { i18nKey: 'carpentry.decking.deck-replacement.q4.options.lighting', value: 'lighting', order: 2 },
          { i18nKey: 'carpentry.decking.deck-replacement.q4.options.built-seating', value: 'built-seating', order: 3 },
          { i18nKey: 'carpentry.decking.deck-replacement.q4.options.same-as-existing', value: 'same-as-existing', order: 4 }
        ]
      }
    ]
  },
  {
    microSlug: 'deck-staining-sealing',
    subcategorySlug: 'decking',
    categorySlug: 'carpentry',
    questions: [
      {
        key: 'service_type',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-staining-sealing.q1.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q1.options.staining', value: 'staining', order: 0 },
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q1.options.sealing', value: 'sealing', order: 1 },
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q1.options.both', value: 'both', order: 2 }
        ]
      },
      {
        key: 'deck_condition',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-staining-sealing.q2.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q2.options.good', value: 'good', order: 0 },
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q2.options.minor-wear', value: 'minor-wear', order: 1 },
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q2.options.damaged', value: 'damaged', order: 2 },
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q2.options.grey-weathered', value: 'grey-weathered', order: 3 }
        ]
      },
      {
        key: 'deck_size',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-staining-sealing.q3.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q3.options.small', value: 'small', order: 0 },
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q3.options.medium', value: 'medium', order: 1 },
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q3.options.large', value: 'large', order: 2 },
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q3.options.extra-large', value: 'extra-large', order: 3 }
        ]
      },
      {
        key: 'cleaning_needed',
        type: 'single',
        i18nKey: 'carpentry.decking.deck-staining-sealing.q4.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q4.options.yes-pressure-wash', value: 'yes-pressure-wash', order: 0 },
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q4.options.no', value: 'no', order: 1 },
          { i18nKey: 'carpentry.decking.deck-staining-sealing.q4.options.not-sure', value: 'not-sure', order: 2 }
        ]
      }
    ]
  },
  {
    microSlug: 'door-frame-replacement',
    subcategorySlug: 'doors',
    categorySlug: 'carpentry',
    questions: [
      {
        key: 'door_location',
        type: 'single',
        i18nKey: 'carpentry.doors.door-frame-replacement.q1.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-frame-replacement.q1.options.front-door', value: 'front-door', order: 0 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q1.options.back-door', value: 'back-door', order: 1 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q1.options.internal-door', value: 'internal-door', order: 2 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q1.options.patio-balcony', value: 'patio-balcony', order: 3 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q1.options.garage-side', value: 'garage-side', order: 4 }
        ]
      },
      {
        key: 'door_count',
        type: 'single',
        i18nKey: 'carpentry.doors.door-frame-replacement.q2.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-frame-replacement.q2.options.1', value: '1', order: 0 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q2.options.2-3', value: '2-3', order: 1 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q2.options.4-6', value: '4-6', order: 2 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q2.options.more-than-6', value: 'more-than-6', order: 3 }
        ]
      },
      {
        key: 'frame_issue',
        type: 'single',
        i18nKey: 'carpentry.doors.door-frame-replacement.q3.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-frame-replacement.q3.options.rotten-damaged', value: 'rotten-damaged', order: 0 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q3.options.misaligned-twisted', value: 'misaligned-twisted', order: 1 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q3.options.water-damage', value: 'water-damage', order: 2 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q3.options.security-upgrade', value: 'security-upgrade', order: 3 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q3.options.other-not-sure', value: 'other-not-sure', order: 4 }
        ]
      },
      {
        key: 'material_preference',
        type: 'single',
        i18nKey: 'carpentry.doors.door-frame-replacement.q4.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-frame-replacement.q4.options.softwood', value: 'softwood', order: 0 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q4.options.hardwood', value: 'hardwood', order: 1 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q4.options.metal', value: 'metal', order: 2 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q4.options.upvc', value: 'upvc', order: 3 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q4.options.match-existing', value: 'match-existing', order: 4 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q4.options.not-sure', value: 'not-sure', order: 5 }
        ]
      },
      {
        key: 'wall_type',
        type: 'single',
        i18nKey: 'carpentry.doors.door-frame-replacement.q5.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-frame-replacement.q5.options.block-brick', value: 'block-brick', order: 0 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q5.options.stud-plasterboard', value: 'stud-plasterboard', order: 1 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q5.options.concrete', value: 'concrete', order: 2 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q5.options.stone', value: 'stone', order: 3 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q5.options.unsure', value: 'unsure', order: 4 }
        ]
      },
      {
        key: 'decoration',
        type: 'single',
        i18nKey: 'carpentry.doors.door-frame-replacement.q6.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.doors.door-frame-replacement.q6.options.yes-painting', value: 'yes-painting', order: 0 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q6.options.yes-plastering', value: 'yes-plastering', order: 1 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q6.options.both', value: 'both', order: 2 },
          { i18nKey: 'carpentry.doors.door-frame-replacement.q6.options.no-just-frame', value: 'no-just-frame', order: 3 }
        ]
      }
    ]
  },
  {
    microSlug: 'door-hanging',
    subcategorySlug: 'doors',
    categorySlug: 'carpentry',
    questions: [
      {
        key: 'door_type',
        type: 'single',
        i18nKey: 'carpentry.doors.door-hanging.q1.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-hanging.q1.options.internal', value: 'internal', order: 0 },
          { i18nKey: 'carpentry.doors.door-hanging.q1.options.front-door', value: 'front-door', order: 1 },
          { i18nKey: 'carpentry.doors.door-hanging.q1.options.back-door', value: 'back-door', order: 2 },
          { i18nKey: 'carpentry.doors.door-hanging.q1.options.patio-hinged', value: 'patio-hinged', order: 3 },
          { i18nKey: 'carpentry.doors.door-hanging.q1.options.other', value: 'other', order: 4 }
        ]
      },
      {
        key: 'door_count',
        type: 'single',
        i18nKey: 'carpentry.doors.door-hanging.q2.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-hanging.q2.options.1', value: '1', order: 0 },
          { i18nKey: 'carpentry.doors.door-hanging.q2.options.2-3', value: '2-3', order: 1 },
          { i18nKey: 'carpentry.doors.door-hanging.q2.options.4-6', value: '4-6', order: 2 },
          { i18nKey: 'carpentry.doors.door-hanging.q2.options.more-than-6', value: 'more-than-6', order: 3 }
        ]
      },
      {
        key: 'door_supplied',
        type: 'single',
        i18nKey: 'carpentry.doors.door-hanging.q3.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-hanging.q3.options.yes-on-site', value: 'yes-on-site', order: 0 },
          { i18nKey: 'carpentry.doors.door-hanging.q3.options.no-supply-needed', value: 'no-supply-needed', order: 1 },
          { i18nKey: 'carpentry.doors.door-hanging.q3.options.some-supplied', value: 'some-supplied', order: 2 }
        ]
      },
      {
        key: 'frame_condition',
        type: 'single',
        i18nKey: 'carpentry.doors.door-hanging.q4.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-hanging.q4.options.good', value: 'good', order: 0 },
          { i18nKey: 'carpentry.doors.door-hanging.q4.options.minor-adjustments', value: 'minor-adjustments', order: 1 },
          { i18nKey: 'carpentry.doors.door-hanging.q4.options.repair-replacement', value: 'repair-replacement', order: 2 },
          { i18nKey: 'carpentry.doors.door-hanging.q4.options.no-frames-yet', value: 'no-frames-yet', order: 3 },
          { i18nKey: 'carpentry.doors.door-hanging.q4.options.not-sure', value: 'not-sure', order: 4 }
        ]
      },
      {
        key: 'hardware',
        type: 'single',
        i18nKey: 'carpentry.doors.door-hanging.q5.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.doors.door-hanging.q5.options.hinges-only', value: 'hinges-only', order: 0 },
          { i18nKey: 'carpentry.doors.door-hanging.q5.options.hinges-handles', value: 'hinges-handles', order: 1 },
          { i18nKey: 'carpentry.doors.door-hanging.q5.options.lock-latch', value: 'lock-latch', order: 2 },
          { i18nKey: 'carpentry.doors.door-hanging.q5.options.all-hardware', value: 'all-hardware', order: 3 },
          { i18nKey: 'carpentry.doors.door-hanging.q5.options.unsure', value: 'unsure', order: 4 }
        ]
      },
      {
        key: 'trimming',
        type: 'single',
        i18nKey: 'carpentry.doors.door-hanging.q6.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.doors.door-hanging.q6.options.yes-most', value: 'yes-most', order: 0 },
          { i18nKey: 'carpentry.doors.door-hanging.q6.options.maybe-one-two', value: 'maybe-one-two', order: 1 },
          { i18nKey: 'carpentry.doors.door-hanging.q6.options.no-pre-sized', value: 'no-pre-sized', order: 2 },
          { i18nKey: 'carpentry.doors.door-hanging.q6.options.not-sure', value: 'not-sure', order: 3 }
        ]
      }
    ]
  },
  {
    microSlug: 'door-installation',
    subcategorySlug: 'doors',
    categorySlug: 'carpentry',
    questions: [
      {
        key: 'door_location',
        type: 'single',
        i18nKey: 'carpentry.doors.door-installation.q1.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-installation.q1.options.new-opening', value: 'new-opening', order: 0 },
          { i18nKey: 'carpentry.doors.door-installation.q1.options.replacing-old', value: 'replacing-old', order: 1 },
          { i18nKey: 'carpentry.doors.door-installation.q1.options.window-to-door', value: 'window-to-door', order: 2 },
          { i18nKey: 'carpentry.doors.door-installation.q1.options.other-not-sure', value: 'other-not-sure', order: 3 }
        ]
      },
      {
        key: 'door_position',
        type: 'single',
        i18nKey: 'carpentry.doors.door-installation.q2.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-installation.q2.options.internal', value: 'internal', order: 0 },
          { i18nKey: 'carpentry.doors.door-installation.q2.options.front-entrance', value: 'front-entrance', order: 1 },
          { i18nKey: 'carpentry.doors.door-installation.q2.options.back-side', value: 'back-side', order: 2 },
          { i18nKey: 'carpentry.doors.door-installation.q2.options.patio-terrace', value: 'patio-terrace', order: 3 }
        ]
      },
      {
        key: 'door_style',
        type: 'single',
        i18nKey: 'carpentry.doors.door-installation.q3.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-installation.q3.options.solid-timber', value: 'solid-timber', order: 0 },
          { i18nKey: 'carpentry.doors.door-installation.q3.options.glazed-timber', value: 'glazed-timber', order: 1 },
          { i18nKey: 'carpentry.doors.door-installation.q3.options.composite', value: 'composite', order: 2 },
          { i18nKey: 'carpentry.doors.door-installation.q3.options.upvc', value: 'upvc', order: 3 },
          { i18nKey: 'carpentry.doors.door-installation.q3.options.metal', value: 'metal', order: 4 },
          { i18nKey: 'carpentry.doors.door-installation.q3.options.not-sure', value: 'not-sure', order: 5 }
        ]
      },
      {
        key: 'door_supplied',
        type: 'single',
        i18nKey: 'carpentry.doors.door-installation.q4.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-installation.q4.options.have-both', value: 'have-both', order: 0 },
          { i18nKey: 'carpentry.doors.door-installation.q4.options.door-only', value: 'door-only', order: 1 },
          { i18nKey: 'carpentry.doors.door-installation.q4.options.need-both', value: 'need-both', order: 2 },
          { i18nKey: 'carpentry.doors.door-installation.q4.options.not-sure-yet', value: 'not-sure-yet', order: 3 }
        ]
      },
      {
        key: 'security_level',
        type: 'single',
        i18nKey: 'carpentry.doors.door-installation.q5.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.doors.door-installation.q5.options.standard-domestic', value: 'standard-domestic', order: 0 },
          { i18nKey: 'carpentry.doors.door-installation.q5.options.high-security', value: 'high-security', order: 1 },
          { i18nKey: 'carpentry.doors.door-installation.q5.options.fire-rated', value: 'fire-rated', order: 2 },
          { i18nKey: 'carpentry.doors.door-installation.q5.options.not-sure', value: 'not-sure', order: 3 }
        ]
      },
      {
        key: 'finishing',
        type: 'single',
        i18nKey: 'carpentry.doors.door-installation.q6.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.doors.door-installation.q6.options.just-install', value: 'just-install', order: 0 },
          { i18nKey: 'carpentry.doors.door-installation.q6.options.trim-architrave', value: 'trim-architrave', order: 1 },
          { i18nKey: 'carpentry.doors.door-installation.q6.options.painting-varnishing', value: 'painting-varnishing', order: 2 },
          { i18nKey: 'carpentry.doors.door-installation.q6.options.plaster-paint', value: 'plaster-paint', order: 3 }
        ]
      }
    ]
  },
  {
    microSlug: 'door-repair',
    subcategorySlug: 'doors',
    categorySlug: 'carpentry',
    questions: [
      {
        key: 'problem_type',
        type: 'multi',
        i18nKey: 'carpentry.doors.door-repair.q1.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-repair.q1.options.sticking-scraping', value: 'sticking-scraping', order: 0 },
          { i18nKey: 'carpentry.doors.door-repair.q1.options.wont-close', value: 'wont-close', order: 1 },
          { i18nKey: 'carpentry.doors.door-repair.q1.options.loose-broken-hinges', value: 'loose-broken-hinges', order: 2 },
          { i18nKey: 'carpentry.doors.door-repair.q1.options.damaged-frame', value: 'damaged-frame', order: 3 },
          { i18nKey: 'carpentry.doors.door-repair.q1.options.lock-handle-problem', value: 'lock-handle-problem', order: 4 },
          { i18nKey: 'carpentry.doors.door-repair.q1.options.other', value: 'other', order: 5 }
        ]
      },
      {
        key: 'door_type',
        type: 'single',
        i18nKey: 'carpentry.doors.door-repair.q2.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-repair.q2.options.internal', value: 'internal', order: 0 },
          { i18nKey: 'carpentry.doors.door-repair.q2.options.front-door', value: 'front-door', order: 1 },
          { i18nKey: 'carpentry.doors.door-repair.q2.options.back-door', value: 'back-door', order: 2 },
          { i18nKey: 'carpentry.doors.door-repair.q2.options.patio-balcony', value: 'patio-balcony', order: 3 },
          { i18nKey: 'carpentry.doors.door-repair.q2.options.sliding-door', value: 'sliding-door', order: 4 }
        ]
      },
      {
        key: 'material',
        type: 'single',
        i18nKey: 'carpentry.doors.door-repair.q3.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-repair.q3.options.timber', value: 'timber', order: 0 },
          { i18nKey: 'carpentry.doors.door-repair.q3.options.composite', value: 'composite', order: 1 },
          { i18nKey: 'carpentry.doors.door-repair.q3.options.upvc', value: 'upvc', order: 2 },
          { i18nKey: 'carpentry.doors.door-repair.q3.options.aluminium', value: 'aluminium', order: 3 },
          { i18nKey: 'carpentry.doors.door-repair.q3.options.glass', value: 'glass', order: 4 },
          { i18nKey: 'carpentry.doors.door-repair.q3.options.not-sure', value: 'not-sure', order: 5 }
        ]
      },
      {
        key: 'frame_condition',
        type: 'single',
        i18nKey: 'carpentry.doors.door-repair.q4.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.door-repair.q4.options.good', value: 'good', order: 0 },
          { i18nKey: 'carpentry.doors.door-repair.q4.options.minor-damage', value: 'minor-damage', order: 1 },
          { i18nKey: 'carpentry.doors.door-repair.q4.options.rotten-severe', value: 'rotten-severe', order: 2 },
          { i18nKey: 'carpentry.doors.door-repair.q4.options.not-sure', value: 'not-sure', order: 3 }
        ]
      },
      {
        key: 'hardware',
        type: 'multi',
        i18nKey: 'carpentry.doors.door-repair.q5.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.doors.door-repair.q5.options.hinges', value: 'hinges', order: 0 },
          { i18nKey: 'carpentry.doors.door-repair.q5.options.handle-latch', value: 'handle-latch', order: 1 },
          { i18nKey: 'carpentry.doors.door-repair.q5.options.lock-cylinder', value: 'lock-cylinder', order: 2 },
          { i18nKey: 'carpentry.doors.door-repair.q5.options.door-closer', value: 'door-closer', order: 3 },
          { i18nKey: 'carpentry.doors.door-repair.q5.options.no-just-door', value: 'no-just-door', order: 4 }
        ]
      }
    ]
  },
  {
    microSlug: 'fence-installation',
    subcategorySlug: 'fencing-gates',
    categorySlug: 'carpentry',
    questions: [
      {
        key: 'fence_purpose',
        type: 'single',
        i18nKey: 'carpentry.fencing-gates.fence-installation.q1.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q1.options.privacy', value: 'privacy', order: 0 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q1.options.security', value: 'security', order: 1 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q1.options.garden-boundary', value: 'garden-boundary', order: 2 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q1.options.pet-child-containment', value: 'pet-child-containment', order: 3 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q1.options.decorative', value: 'decorative', order: 4 }
        ]
      },
      {
        key: 'fence_length',
        type: 'single',
        i18nKey: 'carpentry.fencing-gates.fence-installation.q2.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q2.options.up-to-10m', value: 'up-to-10m', order: 0 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q2.options.10-25m', value: '10-25m', order: 1 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q2.options.25-50m', value: '25-50m', order: 2 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q2.options.50m-plus', value: '50m-plus', order: 3 }
        ]
      },
      {
        key: 'fence_height',
        type: 'single',
        i18nKey: 'carpentry.fencing-gates.fence-installation.q3.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q3.options.up-to-1m', value: 'up-to-1m', order: 0 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q3.options.1-1.5m', value: '1-1.5m', order: 1 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q3.options.1.5-2m', value: '1.5-2m', order: 2 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q3.options.over-2m', value: 'over-2m', order: 3 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q3.options.not-sure', value: 'not-sure', order: 4 }
        ]
      },
      {
        key: 'material',
        type: 'single',
        i18nKey: 'carpentry.fencing-gates.fence-installation.q4.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q4.options.timber-panels', value: 'timber-panels', order: 0 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q4.options.timber-post-rail', value: 'timber-post-rail', order: 1 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q4.options.composite', value: 'composite', order: 2 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q4.options.metal-mesh', value: 'metal-mesh', order: 3 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q4.options.stone-brick-panels', value: 'stone-brick-panels', order: 4 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q4.options.not-sure', value: 'not-sure', order: 5 }
        ]
      },
      {
        key: 'ground_type',
        type: 'single',
        i18nKey: 'carpentry.fencing-gates.fence-installation.q5.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q5.options.soil-grass', value: 'soil-grass', order: 0 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q5.options.concrete-paving', value: 'concrete-paving', order: 1 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q5.options.mixed-ground', value: 'mixed-ground', order: 2 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q5.options.raised-wall', value: 'raised-wall', order: 3 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q5.options.not-sure', value: 'not-sure', order: 4 }
        ]
      },
      {
        key: 'old_fence',
        type: 'single',
        i18nKey: 'carpentry.fencing-gates.fence-installation.q6.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q6.options.yes-remove-dispose', value: 'yes-remove-dispose', order: 0 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q6.options.yes-i-remove', value: 'yes-i-remove', order: 1 },
          { i18nKey: 'carpentry.fencing-gates.fence-installation.q6.options.no-existing', value: 'no-existing', order: 2 }
        ]
      }
    ]
  },
  {
    microSlug: 'french-doors-installation',
    subcategorySlug: 'doors',
    categorySlug: 'carpentry',
    questions: [
      {
        key: 'situation',
        type: 'single',
        i18nKey: 'carpentry.doors.french-doors-installation.q1.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.french-doors-installation.q1.options.replacing-existing', value: 'replacing-existing', order: 0 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q1.options.replacing-window', value: 'replacing-window', order: 1 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q1.options.new-opening', value: 'new-opening', order: 2 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q1.options.replacing-other-door', value: 'replacing-other-door', order: 3 }
        ]
      },
      {
        key: 'door_size',
        type: 'single',
        i18nKey: 'carpentry.doors.french-doors-installation.q2.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.doors.french-doors-installation.q2.options.standard-double', value: 'standard-double', order: 0 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q2.options.extra-wide', value: 'extra-wide', order: 1 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q2.options.not-standard-custom', value: 'not-standard-custom', order: 2 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q2.options.not-sure', value: 'not-sure', order: 3 }
        ]
      },
      {
        key: 'material',
        type: 'single',
        i18nKey: 'carpentry.doors.french-doors-installation.q3.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.doors.french-doors-installation.q3.options.timber', value: 'timber', order: 0 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q3.options.upvc', value: 'upvc', order: 1 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q3.options.aluminium', value: 'aluminium', order: 2 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q3.options.composite', value: 'composite', order: 3 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q3.options.not-sure', value: 'not-sure', order: 4 }
        ]
      },
      {
        key: 'glazing',
        type: 'single',
        i18nKey: 'carpentry.doors.french-doors-installation.q4.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.doors.french-doors-installation.q4.options.standard-double', value: 'standard-double', order: 0 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q4.options.high-efficiency', value: 'high-efficiency', order: 1 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q4.options.acoustic', value: 'acoustic', order: 2 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q4.options.not-sure', value: 'not-sure', order: 3 }
        ]
      },
      {
        key: 'threshold',
        type: 'single',
        i18nKey: 'carpentry.doors.french-doors-installation.q5.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.doors.french-doors-installation.q5.options.standard-step', value: 'standard-step', order: 0 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q5.options.low-flush', value: 'low-flush', order: 1 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q5.options.wheelchair-accessible', value: 'wheelchair-accessible', order: 2 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q5.options.not-sure', value: 'not-sure', order: 3 }
        ]
      },
      {
        key: 'finishing',
        type: 'multi',
        i18nKey: 'carpentry.doors.french-doors-installation.q6.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.doors.french-doors-installation.q6.options.internal-plaster', value: 'internal-plaster', order: 0 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q6.options.external-render', value: 'external-render', order: 1 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q6.options.painting-decorating', value: 'painting-decorating', order: 2 },
          { i18nKey: 'carpentry.doors.french-doors-installation.q6.options.no-additional-work', value: 'no-additional-work', order: 3 }
        ]
      }
    ]
  },
  {
    microSlug: 'gazebo-construction',
    subcategorySlug: 'outdoor-structures',
    categorySlug: 'carpentry',
    questions: [
      {
        key: 'gazebo_type',
        type: 'single',
        i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q1.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q1.options.pre-made-kit', value: 'pre-made-kit', order: 0 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q1.options.custom-built', value: 'custom-built', order: 1 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q1.options.metal-aluminium', value: 'metal-aluminium', order: 2 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q1.options.not-sure-yet', value: 'not-sure-yet', order: 3 }
        ]
      },
      {
        key: 'size',
        type: 'single',
        i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q2.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q2.options.small', value: 'small', order: 0 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q2.options.medium', value: 'medium', order: 1 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q2.options.large', value: 'large', order: 2 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q2.options.very-large-bespoke', value: 'very-large-bespoke', order: 3 }
        ]
      },
      {
        key: 'roof_style',
        type: 'single',
        i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q3.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q3.options.flat', value: 'flat', order: 0 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q3.options.pitched', value: 'pitched', order: 1 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q3.options.hipped', value: 'hipped', order: 2 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q3.options.thatched-look', value: 'thatched-look', order: 3 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q3.options.open-pergola-style', value: 'open-pergola-style', order: 4 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q3.options.not-sure', value: 'not-sure', order: 5 }
        ]
      },
      {
        key: 'base_prepared',
        type: 'single',
        i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q4.title',
        required: true,
        options: [
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q4.options.yes-solid-level', value: 'yes-solid-level', order: 0 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q4.options.rough-base', value: 'rough-base', order: 1 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q4.options.grass-soil-only', value: 'grass-soil-only', order: 2 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q4.options.not-sure', value: 'not-sure', order: 3 }
        ]
      },
      {
        key: 'features',
        type: 'multi',
        i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q5.title',
        required: false,
        options: [
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q5.options.balustrades-railings', value: 'balustrades-railings', order: 0 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q5.options.built-in-seating', value: 'built-in-seating', order: 1 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q5.options.lighting-cabling', value: 'lighting-cabling', order: 2 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q5.options.cladding-screening', value: 'cladding-screening', order: 3 },
          { i18nKey: 'carpentry.outdoor-structures.gazebo-construction.q5.options.no-extras', value: 'no-extras', order: 4 }
        ]
      }
    ]
  }
  // More packs to be added - file was cut off at pergola-installation
];
