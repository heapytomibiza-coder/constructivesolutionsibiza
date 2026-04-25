/**
 * Job Photo Persistence Helpers
 *
 * Centralizes the storage-backed photo pipeline for the Job Wizard.
 *
 * Storage layout:
 *   bucket: job-photos (public read)
 *   path:   {auth.uid()}/{uuid}.{ext}
 *
 * Wizard state contract:
 *   `extras.photos: string[]` may contain three kinds of values:
 *     1. Storage paths        e.g. "abc-123/uuid.jpg"   ← canonical going forward
 *     2. Pending markers      e.g. "pending:local-1"    ← in-memory only, never persisted
 *     3. Legacy values        e.g. "[photo]" or "data:image/..."  ← read-only display support
 *
 * Pre-submit guard rejects (1) markers and (2) legacy values.
 */

import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'job-photos';

// Module-level map keyed by "pending:<localId>" → File
// Survives in-page navigation (e.g. auth resume in same tab) but not new tabs.
const pendingFiles = new Map<string, File>();

export const PENDING_PREFIX = 'pending:';

export function isPendingMarker(value: string): boolean {
  return typeof value === 'string' && value.startsWith(PENDING_PREFIX);
}

export function isLegacyPlaceholder(value: string): boolean {
  return value === '[photo]';
}

export function isLegacyBase64(value: string): boolean {
  return typeof value === 'string' && value.startsWith('data:');
}

export function isHttpUrl(value: string): boolean {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

/**
 * A storage path looks like "{userId}/{uuid}.{ext}" — no protocol, no leading slash.
 * Anything not pending/legacy/http is treated as a storage path candidate.
 */
export function isStoragePath(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  if (isPendingMarker(value)) return false;
  if (isLegacyPlaceholder(value)) return false;
  if (isLegacyBase64(value)) return false;
  if (isHttpUrl(value)) return false;
  // Heuristic: must contain a '/' separating folder from filename
  return value.includes('/') && !value.startsWith('/');
}

/**
 * Register an in-memory File against a pending marker.
 * Returns the marker string to store in wizard state.
 */
export function registerPendingFile(file: File): string {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const marker = `${PENDING_PREFIX}${id}`;
  pendingFiles.set(marker, file);
  return marker;
}

export function getPendingFile(marker: string): File | undefined {
  return pendingFiles.get(marker);
}

export function clearPendingFile(marker: string): void {
  pendingFiles.delete(marker);
}

export function clearAllPendingFiles(): void {
  pendingFiles.clear();
}

function extFromFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  // Fallback from MIME type
  const fromMime = file.type.split('/').pop()?.toLowerCase();
  return fromMime && /^[a-z0-9]{2,5}$/.test(fromMime) ? fromMime : 'jpg';
}

/**
 * Upload a single File to the job-photos bucket under {userId}/{uuid}.{ext}.
 * Returns the storage path (NOT a URL).
 */
export async function uploadJobPhoto(file: File, userId: string): Promise<string> {
  if (!userId) throw new Error('uploadJobPhoto: userId is required');
  const ext = extFromFile(file);
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${userId}/${uuid}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  });

  if (error) {
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  return path;
}

/**
 * Upload all pending markers in `photos` and return a new array with markers
 * replaced by storage paths. Storage paths and http URLs pass through unchanged.
 * Legacy values ("[photo]", "data:") are dropped (not safe to write back).
 */
export async function uploadPendingPhotos(
  photos: string[],
  userId: string,
): Promise<string[]> {
  const out: string[] = [];
  for (const value of photos) {
    if (isStoragePath(value) || isHttpUrl(value)) {
      out.push(value);
      continue;
    }
    if (isPendingMarker(value)) {
      const file = getPendingFile(value);
      if (!file) {
        // Marker without backing file — pending file map was cleared (e.g. new tab)
        throw new Error('A photo could not be uploaded because the file is no longer available. Please re-add it.');
      }
      const path = await uploadJobPhoto(file, userId);
      clearPendingFile(value);
      out.push(path);
      continue;
    }
    // Legacy / unknown — silently drop, never persist
  }
  return out;
}

/**
 * Resolve a stored value to a renderable URL.
 * Returns null for unrenderable values (placeholders, missing pending files).
 * Keeps legacy `data:` blobs renderable for old jobs (read-only display support).
 */
export function resolveJobPhotoUrl(value: string): string | null {
  if (!value || typeof value !== 'string') return null;
  if (isLegacyPlaceholder(value)) return null;
  if (isHttpUrl(value)) return value;
  if (isLegacyBase64(value)) return value; // legacy display only
  if (isPendingMarker(value)) {
    const file = getPendingFile(value);
    return file ? URL.createObjectURL(file) : null;
  }
  if (isStoragePath(value)) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(value);
    return data?.publicUrl ?? null;
  }
  return null;
}

/**
 * Filter a photos array to only values that produce a valid URL,
 * returning {value, url} pairs ready for rendering.
 */
export function resolveJobPhotos(photos: string[] | null | undefined): Array<{ value: string; url: string }> {
  if (!Array.isArray(photos)) return [];
  const out: Array<{ value: string; url: string }> = [];
  for (const v of photos) {
    const url = resolveJobPhotoUrl(v);
    if (url) out.push({ value: v, url });
  }
  return out;
}

/**
 * Strip values that should NOT be persisted to draft storage.
 * Keeps storage paths + http URLs only. Drops pending markers (in-memory only)
 * and any legacy garbage. Used by draft autosave + auth-redirect snapshot.
 */
export function sanitizePhotosForDraft(photos: string[] | null | undefined): string[] {
  if (!Array.isArray(photos)) return [];
  return photos.filter((v) => isStoragePath(v) || isHttpUrl(v));
}

/**
 * Pre-submit assertion. Throws a user-friendly error if any value is unsafe.
 */
export function assertPhotosReadyForSubmit(photos: string[] | null | undefined): void {
  if (!Array.isArray(photos) || photos.length === 0) return;
  for (const v of photos) {
    if (isStoragePath(v) || isHttpUrl(v)) continue;
    if (isPendingMarker(v)) {
      throw new Error('Some photos are still uploading. Please wait for them to finish, or remove them.');
    }
    throw new Error('Some photos could not be uploaded. Please remove them and add again.');
  }
}
