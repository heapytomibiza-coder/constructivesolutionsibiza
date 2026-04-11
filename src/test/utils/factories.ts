/**
 * Test data factories.
 * Create consistent, minimal test data objects.
 */

export function makeUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    ...overrides,
  };
}

export function makeJob(overrides: Record<string, any> = {}) {
  return {
    id: 'job-1',
    title: 'Fix bathroom plumbing',
    description: 'Need a plumber to fix a leaky tap.',
    status: 'open',
    category: 'plumbing',
    user_id: 'user-1',
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-01T10:00:00Z',
    is_publicly_listed: true,
    ...overrides,
  };
}

export function makeQuote(overrides: Record<string, any> = {}) {
  return {
    id: 'quote-1',
    job_id: 'job-1',
    professional_id: 'pro-1',
    status: 'submitted',
    total_amount: 500,
    description: 'I can fix this in 2 hours.',
    created_at: '2026-04-02T10:00:00Z',
    ...overrides,
  };
}

export function makeListing(overrides: Record<string, any> = {}) {
  return {
    id: 'listing-1',
    user_id: 'pro-1',
    display_title: 'Expert Plumbing Service',
    short_description: 'Professional plumbing repairs.',
    status: 'published',
    published_at: '2026-03-15T10:00:00Z',
    ...overrides,
  };
}

export function makeConversation(overrides: Record<string, any> = {}) {
  return {
    id: 'conv-1',
    job_id: 'job-1',
    client_id: 'user-1',
    pro_id: 'pro-1',
    created_at: '2026-04-02T12:00:00Z',
    last_message_at: '2026-04-03T10:00:00Z',
    last_message_preview: 'When can you start?',
    ...overrides,
  };
}

export function makeMessage(overrides: Record<string, any> = {}) {
  return {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-1',
    body: 'Hello, when can you start?',
    message_type: 'text',
    created_at: '2026-04-03T10:00:00Z',
    ...overrides,
  };
}
