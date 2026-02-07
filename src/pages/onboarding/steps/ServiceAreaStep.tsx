import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';

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

  return (
    <Card className="card-grounded">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Where do you work?
        </CardTitle>
        <CardDescription>
          Select the areas of Ibiza where you're available for jobs. You can update this anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Island-wide toggle */}
          <div className="flex items-center space-x-3 p-4 rounded-md bg-primary/5 border border-primary/20">
            <Checkbox
              id="island-wide"
              checked={islandWide}
              onCheckedChange={handleIslandWide}
            />
            <Label htmlFor="island-wide" className="font-medium cursor-pointer">
              I cover the entire island
            </Label>
          </div>

          {/* Zone groups */}
          <div className="space-y-6">
            {IBIZA_ZONES.map((group) => (
              <div key={group.group} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">{group.group}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectGroup(group.zones)}
                    className="text-xs"
                  >
                    {group.zones.every(z => selectedZones.includes(z.id)) ? 'Deselect all' : 'Select all'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {group.zones.map((zone) => (
                    <div 
                      key={zone.id} 
                      className={`flex items-center space-x-3 p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedZones.includes(zone.id)
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-muted/30 border-border hover:bg-muted/50'
                      }`}
                      onClick={() => handleZoneToggle(zone.id)}
                    >
                      <Checkbox
                        id={zone.id}
                        checked={selectedZones.includes(zone.id)}
                        onCheckedChange={() => handleZoneToggle(zone.id)}
                      />
                      <Label htmlFor={zone.id} className="cursor-pointer text-sm">
                        {zone.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Selection summary */}
          {selectedZones.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {islandWide 
                ? '🏝️ You\'ll receive jobs from across Ibiza' 
                : `📍 ${selectedZones.length} zone${selectedZones.length > 1 ? 's' : ''} selected`}
            </p>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
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
              className="flex-1"
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
