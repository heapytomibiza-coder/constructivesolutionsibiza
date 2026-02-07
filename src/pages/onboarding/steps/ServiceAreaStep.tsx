import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, MapPin, ArrowRight, ArrowLeft, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceAreaStepProps {
  onComplete: () => void;
  onBack: () => void;
}

// Ibiza zones taxonomy - matching the location system
const IBIZA_ZONES = [
  { group: 'Central', zones: [
    { id: 'ibiza-town', label: 'Ibiza Town (Eivissa)' },
    { id: 'jesus', label: 'Jesús' },
    { id: 'talamanca', label: 'Talamanca' },
    { id: 'figueretas', label: 'Figueretas' },
  ]},
  { group: 'West', zones: [
    { id: 'san-antonio', label: 'San Antonio' },
    { id: 'san-jose', label: 'San José' },
    { id: 'sant-jordi', label: 'Sant Jordi' },
    { id: 'cala-vadella', label: 'Cala Vadella' },
    { id: 'cala-tarida', label: 'Cala Tarida' },
    { id: 'cala-conta', label: 'Cala Conta' },
  ]},
  { group: 'North', zones: [
    { id: 'san-juan', label: 'San Juan' },
    { id: 'portinatx', label: 'Portinatx' },
    { id: 'san-miguel', label: 'San Miguel' },
    { id: 'san-mateo', label: 'San Mateo' },
    { id: 'cala-san-vicente', label: 'Cala San Vicente' },
  ]},
  { group: 'East', zones: [
    { id: 'santa-eulalia', label: 'Santa Eulalia' },
    { id: 'es-cana', label: 'Es Caná' },
    { id: 'san-carlos', label: 'San Carlos' },
    { id: 'cala-llonga', label: 'Cala Llonga' },
  ]},
  { group: 'South', zones: [
    { id: 'playa-den-bossa', label: 'Playa d\'en Bossa' },
    { id: 'salinas', label: 'Salinas' },
    { id: 'es-cubells', label: 'Es Cubells' },
  ]},
];

/**
 * ZoneTile - Touch-friendly zone selection tile
 * Builder-friendly: Larger, clearer, higher contrast
 */
function ZoneTile({ 
  selected, 
  onClick, 
  label,
}: { 
  selected: boolean; 
  onClick: () => void; 
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Base styles - 56px min touch target
        'relative flex items-center justify-between',
        'min-h-[56px] px-4 py-3.5 rounded-xl',
        'text-left text-base font-medium',
        'border-2 transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        // Unselected state
        !selected && 'border-border bg-card hover:border-primary/50 hover:bg-primary/5',
        // Selected state - high contrast
        selected && 'border-primary bg-primary/15 shadow-md',
      )}
    >
      <span className="flex-1">{label}</span>
      <span className={cn(
        'ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full transition shrink-0',
        selected 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground'
      )}>
        {selected ? <Check className="h-4 w-4" /> : <span className="text-sm">+</span>}
      </span>
    </button>
  );
}

export function ServiceAreaStep({ onComplete, onBack }: ServiceAreaStepProps) {
  const { user, refresh } = useSession();
  const queryClient = useQueryClient();
  
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [islandWide, setIslandWide] = useState(false);

  // Load existing data
  const { data: existingData, isLoading } = useQuery({
    queryKey: ['professional-service-area', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('professional_profiles')
        .select('service_zones, service_area_type')
        .eq('user_id', user!.id)
        .single();

      return {
        service_zones: (data as { service_zones?: string[] })?.service_zones || [],
        service_area_type: (data as { service_area_type?: string })?.service_area_type || 'zones',
      };
    },
  });

  useEffect(() => {
    if (existingData) {
      const zones = existingData.service_zones || [];
      if (zones.includes('island-wide') || zones.length === IBIZA_ZONES.flatMap(g => g.zones).length) {
        setIslandWide(true);
        setSelectedZones(IBIZA_ZONES.flatMap(g => g.zones.map(z => z.id)));
      } else {
        setSelectedZones(zones);
      }
    }
  }, [existingData]);

  const saveMutation = useMutation({
    mutationFn: async (zones: string[]) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('professional_profiles')
        .update({
          service_zones: zones,
          service_area_type: 'zones',
          onboarding_phase: 'verification',
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['professional-service-area'] });
      await refresh();
      toast.success('Saved!');
      onComplete();
    },
    onError: (error) => {
      console.error('Error saving service area:', error);
      toast.error('Something went wrong. Please try again.');
    },
  });

  const handleZoneToggle = (zoneId: string) => {
    setSelectedZones(prev => 
      prev.includes(zoneId)
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
    setIslandWide(false);
  };

  const handleIslandWide = () => {
    if (islandWide) {
      setIslandWide(false);
      setSelectedZones([]);
    } else {
      setIslandWide(true);
      setSelectedZones(IBIZA_ZONES.flatMap(g => g.zones.map(z => z.id)));
    }
  };

  const handleSelectGroup = (groupZones: { id: string }[]) => {
    const groupIds = groupZones.map(z => z.id);
    const allSelected = groupIds.every(id => selectedZones.includes(id));
    
    if (allSelected) {
      setSelectedZones(prev => prev.filter(id => !groupIds.includes(id)));
    } else {
      setSelectedZones(prev => [...new Set([...prev, ...groupIds])]);
    }
    setIslandWide(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedZones.length === 0) {
      toast.error('Please select at least one area');
      return;
    }

    saveMutation.mutate(selectedZones);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <Card className="card-grounded animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          {/* Icon container */}
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-steel shadow-md">
            <MapPin className="h-7 w-7 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">Where do you work?</CardTitle>
            <CardDescription className="text-base">
              Tap the areas of Ibiza where you're happy to take jobs.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Island-wide toggle - Featured tile */}
          <button
            type="button"
            onClick={handleIslandWide}
            className={cn(
              'w-full flex items-center justify-between',
              'min-h-[64px] px-5 py-4 rounded-xl',
              'text-left text-lg font-semibold',
              'border-2 transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              !islandWide && 'border-accent/50 bg-accent/10 hover:border-accent hover:bg-accent/15',
              islandWide && 'border-accent bg-accent/20 shadow-lg',
            )}
          >
            <div className="flex items-center gap-4">
              <Globe className={cn(
                'h-6 w-6 transition-colors',
                islandWide ? 'text-accent' : 'text-accent/70'
              )} />
              <span>I cover the entire island</span>
            </div>
            <span className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-full transition shrink-0',
              islandWide 
                ? 'bg-accent text-accent-foreground' 
                : 'bg-accent/20 text-accent/70'
            )}>
              {islandWide ? <Check className="h-5 w-5" /> : <span className="text-base">+</span>}
            </span>
          </button>

          {/* Zone groups */}
          <div className="space-y-6">
            {IBIZA_ZONES.map((group) => (
              <div key={group.group} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-foreground">{group.group}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectGroup(group.zones)}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    {group.zones.every(z => selectedZones.includes(z.id)) ? 'Deselect all' : 'Select all'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.zones.map((zone) => (
                    <ZoneTile
                      key={zone.id}
                      selected={selectedZones.includes(zone.id)}
                      onClick={() => handleZoneToggle(zone.id)}
                      label={zone.label}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Selection summary */}
          {selectedZones.length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 text-base text-foreground animate-fade-in">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <span>
                {islandWide 
                  ? "Great! You'll receive jobs from across Ibiza" 
                  : `${selectedZones.length} area${selectedZones.length > 1 ? 's' : ''} selected`}
              </span>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 pt-2">
            <Button 
              type="button" 
              variant="outline"
              size="lg"
              onClick={onBack}
              className="flex-1"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go Back
            </Button>
            <Button 
              type="submit" 
              size="lg"
              className="flex-1"
              disabled={saveMutation.isPending || selectedZones.length === 0}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-5 w-5 mr-2" />
              )}
              Next Step
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
