/**
 * DOMAIN MODEL - The Core Loop
 * 
 * Problem → Asker → CS → Tasker → Solution
 * 
 * These types are the contracts that bind the system together.
 * They represent the canonical abstractions that all features must respect.
 */

// ============================================================================
// LOCATION & TIMING SPECS
// ============================================================================

export interface LocationSpec {
  area: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  zone?: string;
}

export interface TimingSpec {
  urgency: 'flexible' | 'soon' | 'urgent' | 'emergency';
  startDate?: string;
  startTiming?: string;
}

export interface BudgetSpec {
  type: 'fixed' | 'hourly' | 'daily' | 'unsure';
  min?: number;
  max?: number;
  value?: number;
}

// ============================================================================
// PROBLEM CARD - What the wizard compiles
// ============================================================================

/**
 * A structured problem (what the wizard compiles into)
 * 
 * The wizard's job is to transform messy human input into this
 * predictable, machine-readable schema.
 */
export interface ProblemCard {
  id: string;
  asker_id: string;
  
  // What - the service taxonomy selection
  micros: {
    ids: string[];
    slugs: string[];
    names: string[];
  };
  
  // The structured answers from question packs
  answers: Record<string, unknown>;
  
  // Where/When - logistics
  logistics: {
    location: LocationSpec;
    timing: TimingSpec;
    budget?: BudgetSpec;
  };
  
  // Computed by rules engine
  flags: string[];
  inspection_bias?: 'low' | 'medium' | 'high' | 'mandatory';
  safety?: 'green' | 'amber' | 'red';
  
  // Extras
  has_photos: boolean;
  description?: string;
  
  // State machine
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TASKER PROFILE - A professional's capability profile
// ============================================================================

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface MicroStat {
  micro_id: string;
  completed_jobs_count: number;
  avg_rating: number | null;
  rating_count: number;
  verification_level: string;
}

/**
 * A Tasker's capability profile
 * 
 * This represents what a professional can do, where they work,
 * and their capability signals (stats, verification).
 */
export interface TaskerProfile {
  user_id: string;
  
  // Identity
  display_name: string;
  business_name?: string;
  bio?: string;
  avatar_url?: string;
  
  // What they do - micro_ids they've unlocked
  micros: string[];
  
  // Where they work
  zones: string[];
  service_radius_km?: number;
  
  // Capability signals
  verification: VerificationStatus;
  stats: Record<string, MicroStat>;
  
  // Ready state - can they receive jobs?
  is_live: boolean;
  onboarding_phase: 'not_started' | 'basic_info' | 'service_setup' | 'complete';
  
  // Pricing signals
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  day_rate?: number;
  
  // Availability
  accepts_emergency: boolean;
}

// ============================================================================
// MATCH - The bridge between problem and solution
// ============================================================================

/**
 * A match between a problem and a Tasker
 * 
 * The matching algorithm produces these, explaining *why*
 * a particular Tasker is being shown to an Asker.
 */
export interface Match {
  problem_id: string;
  tasker_id: string;
  
  // Ranking
  score: number;
  
  // Explainability - why this match?
  reasons: string[];
  // e.g., ["Matched micro: Sink Leak Repair", "In your zone: Santa Eulalia"]
  
  // Match metadata
  matched_at: string;
  micro_ids: string[];
}

// ============================================================================
// CORE LOOP STAGES
// ============================================================================

/**
 * The stages of the CS Ibiza core loop.
 * Every feature should map to one of these stages.
 */
export type CoreLoopStage = 
  | 'problem_definition'    // Asker describes problem (wizard)
  | 'problem_structured'    // CS produces ProblemCard
  | 'matching'              // CS matches Taskers
  | 'conversation'          // Protected messaging channel
  | 'assignment'            // Tasker assigned to job
  | 'completion'            // Work completed
  | 'review'                // Reputation updated
  | 'learning';             // System learns patterns

/**
 * Maps route paths to their core loop stage.
 * Useful for analytics and understanding user position in journey.
 */
export const ROUTE_TO_STAGE: Record<string, CoreLoopStage> = {
  '/post': 'problem_definition',
  '/jobs': 'matching',
  '/messages': 'conversation',
  '/dashboard/client': 'assignment',
  '/dashboard/pro': 'matching',
};
