/**
 * Core Module
 * 
 * Platform fundamentals - permissions, constants, and shared types.
 * Currently implemented via:
 * - src/guard/ (access control)
 * - src/domain/scope.ts (platform identity)
 * 
 * This module will expand when platform-wide invariants are extracted.
 */

// Re-export domain scope (keeps domain/scope.ts as single source)
export { PLATFORM, MAIN_CATEGORIES } from '@/domain/scope';
