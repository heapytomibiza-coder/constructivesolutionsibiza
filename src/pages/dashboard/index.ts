/**
 * Dashboard Module
 * 
 * Role-based dashboard structure:
 * - client/ - Client-specific dashboard
 * - professional/ - Professional-specific dashboard
 * - shared/ - Shared components & hooks
 */

// Client
export { default as ClientDashboard } from './client/ClientDashboard';
export { useClientStats } from './client/hooks/useClientStats';
export { ClientJobCard } from './client/components/ClientJobCard';

// Professional
export { default as ProDashboard } from './professional/ProDashboard';
export { useProStats } from './professional/hooks/useProStats';

// Shared
export { AssignProSelector } from './shared/components/AssignProSelector';
export { PendingReviewsCard } from './shared/components/PendingReviewsCard';
export { usePendingReviews } from './shared/hooks/usePendingReviews';
