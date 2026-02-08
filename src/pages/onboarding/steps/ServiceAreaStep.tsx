import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { 
  ZoneTile, 
  IslandWideTile, 
  GradientIconHeader,
  IBIZA_ZONES,
  allZoneIds,
} from '@/shared/components/professional';

interface ServiceAreaStepProps {
  onComplete: () => void;
  onBack: () => void;
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
      const allIds = allZoneIds();
      if (zones.includes('island-wide') || zones.length === allIds.length) {
        setIslandWide(true);
        setSelectedZones(allIds);
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
      setSelectedZones(allZoneIds());
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
        <GradientIconHeader
          icon={<MapPin className="h-5 w-5" />}
          title="Where do you work?"
          description="Tap the areas of Ibiza where you're happy to take jobs."
        />
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Island-wide toggle - Featured tile */}
          <IslandWideTile selected={islandWide} onClick={handleIslandWide} />

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
