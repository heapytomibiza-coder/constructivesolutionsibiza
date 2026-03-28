import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface PublicReviewsSectionProps {
  proUserId: string;
}

export function PublicReviewsSection({ proUserId }: PublicReviewsSectionProps) {
  const { data: reviewData } = useQuery({
    queryKey: ['public_pro_reviews', proUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_reviews')
        .select('rating, comment, created_at')
        .eq('reviewee_user_id', proUserId)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!proUserId,
  });

  const reviews = reviewData ?? [];
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  return (
    <Card className="card-grounded">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          Reviews
          {avgRating != null && (
            <span className="ml-auto flex items-center gap-1 text-sm font-normal text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              {avgRating.toFixed(1)} ({reviews.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star
                      key={si}
                      className={`h-3.5 w-3.5 ${si < r.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-sm text-foreground">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
