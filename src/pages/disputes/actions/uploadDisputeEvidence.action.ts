import { supabase } from '@/integrations/supabase/client';

export async function uploadDisputeEvidence(
  disputeId: string,
  file: File,
  description?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop();
  const filePath = `${user.id}/${disputeId}/${crypto.randomUUID()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('dispute-evidence')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Determine file type
  let fileType = 'document';
  if (file.type.startsWith('image/')) fileType = 'image';
  else if (file.type.startsWith('video/')) fileType = 'video';

  // Record in database
  const { data, error } = await supabase
    .from('dispute_evidence' as any)
    .insert({
      dispute_id: disputeId,
      user_id: user.id,
      file_path: filePath,
      file_type: fileType,
      file_name: file.name,
      file_size_bytes: file.size,
      description,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}
