/**
 * V1 Question Packs Aggregator
 * Simplified - test with one import at a time
 */

// Import one file to test
import { transportQuestionPacks } from "./transportQuestionPacks.ts";

// Test with just transport for now
export const ALL_RAW_PACKS = [
  ...transportQuestionPacks,
];
