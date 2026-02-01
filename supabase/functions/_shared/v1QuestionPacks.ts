/**
 * V1 Question Packs Aggregator
 * 
 * Central export of all canonical V1 question packs.
 * Add new category imports here as they're migrated.
 */

import { transportQuestionPacks, MicroservicePack } from './transportQuestionPacks.ts';
import { constructionQuestionPacks } from './constructionQuestionPacks.ts';

// Aggregate all V1 packs for seeder import
export const ALL_V1_QUESTION_PACKS = [
  ...transportQuestionPacks,
  ...constructionQuestionPacks,
  // Add more categories here as they're migrated:
  // ...hvacQuestionPacks,
  // ...electricalQuestionPacks,
  // etc.
];

// Re-export types for convenience
export type { MicroservicePack, Question, QuestionOption } from './transportQuestionPacks.ts';
