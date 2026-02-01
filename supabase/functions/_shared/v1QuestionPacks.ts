/**
 * V1 Question Packs Aggregator
 * 
 * Central export of all canonical V1 question packs.
 * Add new category imports here as they're migrated.
 */

import { transportQuestionPacks, MicroservicePack } from './transportQuestionPacks.ts';
import { constructionQuestionPacks } from './constructionQuestionPacks.ts';
import { electricalQuestionPacks } from './electricalQuestionPacks.ts';
import { hvacQuestionPacks } from './hvacQuestionPacks.ts';

// Aggregate all V1 packs for seeder import
export const ALL_V1_QUESTION_PACKS = [
  ...transportQuestionPacks,
  ...constructionQuestionPacks,
  ...electricalQuestionPacks,
  ...hvacQuestionPacks,
  // Add more categories here as they're migrated:
  // ...plumbingQuestionPacks,
  // etc.
];

// Re-export types for convenience
export type { MicroservicePack, Question, QuestionOption } from './transportQuestionPacks.ts';
