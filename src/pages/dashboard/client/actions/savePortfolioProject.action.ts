import { supabase } from '@/integrations/supabase/client';

interface SavePortfolioInput {
  userId: string;
  jobId: string;
  title: string;
  description: string | null;
  photoUrls: string[];
}

export async function savePortfolioProject(input: SavePortfolioInput) {
  const { error } = await supabase.from('portfolio_projects').insert({
    user_id: input.userId,
    job_id: input.jobId,
    title: input.title,
    description: input.description,
    photo_urls: input.photoUrls,
    is_published: true,
  });

  if (error) {
    if (error.message?.includes('PORTFOLIO_LIMIT_REACHED')) {
      return { success: false as const, error: 'portfolio_limit' };
    }
    return { success: false as const, error: error.message };
  }
  return { success: true as const };
}
