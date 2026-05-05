/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

// Track 1 — Email Recovery: platform notifications continue to be rendered
// in `send-notifications` / `send-job-notification` and enqueued directly to
// the Lovable `transactional_emails` pgmq queue. This registry exists so the
// scaffolded `send-transactional-email` function deploys; future React Email
// templates will be registered here.
export const TEMPLATES: Record<string, TemplateEntry> = {}
