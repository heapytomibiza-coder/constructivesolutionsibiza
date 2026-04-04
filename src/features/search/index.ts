/**
 * Search Feature Module
 * 
 * DOMAIN: Universal search across services and forum
 */

export { UniversalSearchBar } from '@/components/search/UniversalSearchBar';
export * from '@/components/search/types';

// Search lib utilities
export { expandQuery, buildSearchOrClause, SEARCH_SYNONYMS } from './lib/searchSynonyms';
export { classifyIntent, getIntentBoosts } from './lib/searchIntent';
export type { SearchIntent, IntentBoosts } from './lib/searchIntent';
