import { Briefcase, Users, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Lightweight activity strip — shows platform is alive */
export function ProofOfLifeStrip() {
  const { data } = useQuery({
    queryKey: ['proof-of-life'],
    queryFn: async () => {
      const [jobsRes, prosRes] = await Promise.all([
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .in('status', ['open', 'in_progress', 'published']),
        supabase
          .from('professional_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('is_publicly_listed', true)
          .eq('onboarding_phase', 'complete'),
      ]);
      return {
        activeJobs: jobsRes.count ?? 0,
        professionals: prosRes.count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const stats = [
    { icon: Briefcase, value: data?.activeJobs ?? 40, label: 'Active jobs' },
    { icon: Users, value: `${data?.professionals ?? 20}+`, label: 'Professionals' },
    { icon: Zap, value: 'Daily', label: 'New jobs posted' },
  ];

  return (
    <section className="py-3 bg-muted/50 border-b border-border">
      <div className="container">
        <div className="flex justify-center gap-8 sm:gap-12">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">{value}</span>
              <span className="text-muted-foreground hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
