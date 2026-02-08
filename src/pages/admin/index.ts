/**
 * Admin domain exports
 */

export { default as AdminDashboard } from "./AdminDashboard";
export * from "./types";

// Named re-exports to avoid conflicts
export { useAdminStats, useAdminUsers, useAdminJobs, useAdminContent } from "./hooks";
export type { AdminJobsFilter } from "./hooks/useAdminJobs";
export type { ContentFilter, AdminContentItem } from "./hooks/useAdminContent";

export { suspendUser, unsuspendUser } from "./actions/suspendUser.action";
export { verifyProfessional } from "./actions/verifyProfessional.action";
export { forceCompleteJob } from "./actions/forceCompleteJob.action";
export { archiveJob } from "./actions/archiveJob.action";
export { removeContent } from "./actions/removeContent.action";
export type { ContentType } from "./actions/removeContent.action";

export { UsersSection, JobsSection, ContentSection } from "./sections";
