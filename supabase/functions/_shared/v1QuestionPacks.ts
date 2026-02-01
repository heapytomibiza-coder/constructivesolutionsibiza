/**
 * V1 Question Packs Aggregator
 * 
 * Central export of all canonical V1 question packs.
 */

import { transportQuestionPacks, MicroservicePack } from './transportQuestionPacks.ts';
import { constructionQuestionPacks } from './constructionQuestionPacks.ts';
import { electricalQuestionPacks } from './electricalQuestionPacks.ts';
import { hvacQuestionPacks } from './hvacQuestionPacks.ts';
import { carpentryQuestionPacks } from './carpentryQuestionPacks.ts';

// Aggregate all V1 packs for seeder import
export const ALL_V1_QUESTION_PACKS = [
  ...transportQuestionPacks,
  ...constructionQuestionPacks,
  ...electricalQuestionPacks,
  ...hvacQuestionPacks,
  ...carpentryQuestionPacks,
];

// Re-export types for convenience
export type { MicroservicePack, Question, QuestionOption } from './transportQuestionPacks.ts';
