/**
 * Ibiza zone taxonomy - centralized data for service area selection
 * Used in onboarding, profile management, AND job wizard logistics
 * This is the SINGLE SOURCE OF TRUTH for all location IDs
 */

export type IbizaZone = { 
  id: string; 
  label: string; 
  tier?: 'main' | 'popular'; // main = top 5 towns, popular = other areas
};

export type IbizaZoneGroup = { group: string; zones: IbizaZone[] };

export const IBIZA_ZONES: IbizaZoneGroup[] = [
  {
    group: 'Central',
    zones: [
      { id: 'ibiza-town', label: 'Ibiza Town (Eivissa)', tier: 'main' },
      { id: 'jesus', label: 'Jesús' },
      { id: 'talamanca', label: 'Talamanca' },
      { id: 'figueretas', label: 'Figueretas' },
    ],
  },
  {
    group: 'West',
    zones: [
      { id: 'san-antonio', label: 'San Antonio (Sant Antoni)', tier: 'main' },
      { id: 'san-jose', label: 'San José (Sant Josep)', tier: 'main' },
      { id: 'sant-jordi', label: 'Sant Jordi' },
      { id: 'san-rafael', label: 'San Rafael' },
      { id: 'cala-vadella', label: 'Cala Vadella' },
      { id: 'cala-tarida', label: 'Cala Tarida' },
      { id: 'cala-conta', label: 'Cala Conta' },
    ],
  },
  {
    group: 'North',
    zones: [
      { id: 'san-juan', label: 'San Juan (Sant Joan)', tier: 'main' },
      { id: 'portinatx', label: 'Portinatx' },
      { id: 'san-miguel', label: 'San Miguel' },
      { id: 'san-mateo', label: 'Sant Mateu' },
      { id: 'santa-gertrudis', label: 'Santa Gertrudis' },
      { id: 'cala-san-vicente', label: 'Cala San Vicente' },
    ],
  },
  {
    group: 'East',
    zones: [
      { id: 'santa-eulalia', label: 'Santa Eulalia', tier: 'main' },
      { id: 'es-cana', label: 'Es Caná' },
      { id: 'san-carlos', label: 'San Carlos' },
      { id: 'cala-llonga', label: 'Cala Llonga' },
    ],
  },
  {
    group: 'South',
    zones: [
      { id: 'playa-den-bossa', label: "Playa d'en Bossa" },
      { id: 'salinas', label: 'Salinas' },
      { id: 'es-cubells', label: 'Es Cubells' },
    ],
  },
];

/** Get all zone IDs as a flat array */
export const allZoneIds = () => IBIZA_ZONES.flatMap(g => g.zones.map(z => z.id));

/** Get all zones as a flat array */
export const allZones = () => IBIZA_ZONES.flatMap(g => g.zones);

/** Main towns for wizard dropdown (first tier) */
export const getMainZones = () => 
  IBIZA_ZONES.flatMap(g => g.zones.filter(z => z.tier === 'main'));

/** Popular areas for wizard expanded view */
export const getPopularZones = () => 
  IBIZA_ZONES.flatMap(g => g.zones.filter(z => z.tier !== 'main'));

/** Get zone by ID (for display lookups) */
export const getZoneById = (id: string) => 
  IBIZA_ZONES.flatMap(g => g.zones).find(z => z.id === id);

/** "Other area" option for wizard (not a real zone) */
export const OTHER_LOCATION = { 
  id: 'other', 
  label: 'Other area',
} as const;
