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
 * Matches the TileOption pattern from LogisticsStep
 */
function ZoneTile({ 
  selected, 
  onClick, 
  label,
  animationDelay = 0,
}: { 
  selected: boolean; 
  onClick: () => void; 
  label: string;
  animationDelay?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={cn(
        // Base styles - 48px min touch target
        'relative flex items-center justify-between',
        'min-h-[48px] px-4 py-3 rounded-lg',
        'text-left text-sm font-medium',
        'border-2 transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'animate-slide-up opacity-0 [animation-fill-mode:forwards]',
        // Unselected state
        !selected && 'border-border bg-muted/30 hover:border-primary/50 hover:bg-accent/50',
        // Selected state with glow
        selected && 'border-primary bg-primary/5 shadow-glow scale-[1.02]',
      )}
    >
      <span className="flex-1">{label}</span>
      {selected && (
        <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
      )}
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
          onboarding_phase: 'verification', // Next phase
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['professional-service-area'] });
      await refresh();
      toast.success('Service area saved!');
      onComplete();
    },
    onError: (error) => {
      console.error('Error saving service area:', error);
      toast.error('Failed to save. Please try again.');
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
      toast.error('Please select at least one zone');
      return;
    }

    saveMutation.mutate(selectedZones);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calculate stagger delay for animations
  let globalZoneIndex = 0;

  return (
    <Card className="card-grounded animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-3">
          {/* Gradient icon container */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-steel shadow-md">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="font-display">Where do you work?</CardTitle>
            <CardDescription>
              Select the areas of Ibiza where you're available for jobs.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Island-wide toggle - Featured tile with accent */}
          <button
            type="button"
            onClick={handleIslandWide}
            className={cn(
              'w-full flex items-center justify-between',
              'min-h-[56px] px-4 py-3 rounded-lg',
              'text-left font-medium',
              'border-2 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'animate-slide-up',
              !islandWide && 'border-accent/50 bg-accent/10 hover:border-accent hover:bg-accent/20',
              islandWide && 'border-accent bg-accent/20 shadow-glow scale-[1.01]',
            )}
          >
            <div className="flex items-center gap-3">
              <Globe className={cn(
                'h-5 w-5 transition-colors',
                islandWide ? 'text-accent' : 'text-accent/70'
              )} />
              <span>I cover the entire island</span>
            </div>
            {islandWide && (
              <Check className="h-5 w-5 text-accent shrink-0" />
            )}
          </button>

          {/* Zone groups */}
          <div className="space-y-6">
            {IBIZA_ZONES.map((group, groupIndex) => (
              <div 
                key={group.group} 
                className="space-y-3"
                style={{ animationDelay: `${groupIndex * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">{group.group}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectGroup(group.zones)}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    {group.zones.every(z => selectedZones.includes(z.id)) ? 'Deselect all' : 'Select all'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {group.zones.map((zone) => {
                    const delay = globalZoneIndex * 30;
                    globalZoneIndex++;
                    return (
                      <ZoneTile
                        key={zone.id}
                        selected={selectedZones.includes(zone.id)}
                        onClick={() => handleZoneToggle(zone.id)}
                        label={zone.label}
                        animationDelay={delay}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Selection summary */}
          {selectedZones.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground animate-fade-in">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>
                {islandWide 
                  ? 'You\'ll receive jobs from across Ibiza' 
                  : `${selectedZones.length} zone${selectedZones.length > 1 ? 's' : ''} selected`}
              </span>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button 
              type="submit" 
              className="flex-1 hover:scale-[1.02] transition-transform"
              disabled={saveMutation.isPending || selectedZones.length === 0}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Save & Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
