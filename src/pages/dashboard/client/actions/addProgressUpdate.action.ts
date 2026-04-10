import { supabase } from '@/integrations/supabase/client';

interface AddProgressUpdateInput {
  jobId: string;
  authorId: string;
  note: string | null;
  file: File | null;
}

/**
 * Posts a progress update (note + optional photo) for a job.
 * Handles storage upload if a file is provided.
 */
export async function addProgressUpdate(input: AddProgressUpdateInput) {
  let photoUrl: string | null = null;

  if (input.file) {
    const ext = input.file.name.split('.').pop() || 'jpg';
    const path = `${input.authorId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('progress-photos')
      .upload(path, input.file, { contentType: input.file.type });
    if (uploadError) {
      return { success: false as const, error: uploadError.message };
    }
    const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(path);
    photoUrl = urlData.publicUrl;
  }

  const { error } = await supabase.from('job_progress_updates').insert({
    job_id: input.jobId,
    author_id: input.authorId,
    note: input.note,
    photo_url: photoUrl,
  });

  if (error) {
    return { success: false as const, error: error.message };
  }
  return { success: true as const };
}
