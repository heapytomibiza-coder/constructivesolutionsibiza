/**
 * Ibiza zone taxonomy - centralized data for service area selection
 * Used in onboarding and profile management
 */

export type IbizaZone = { id: string; label: string };
export type IbizaZoneGroup = { group: string; zones: IbizaZone[] };

export const IBIZA_ZONES: IbizaZoneGroup[] = [
  {
    group: 'Central',
    zones: [
      { id: 'ibiza-town', label: 'Ibiza Town (Eivissa)' },
      { id: 'jesus', label: 'Jesús' },
      { id: 'talamanca', label: 'Talamanca' },
      { id: 'figueretas', label: 'Figueretas' },
    ],
  },
  {
    group: 'West',
    zones: [
      { id: 'san-antonio', label: 'San Antonio' },
      { id: 'san-jose', label: 'San José' },
      { id: 'sant-jordi', label: 'Sant Jordi' },
      { id: 'cala-vadella', label: 'Cala Vadella' },
      { id: 'cala-tarida', label: 'Cala Tarida' },
      { id: 'cala-conta', label: 'Cala Conta' },
    ],
  },
  {
    group: 'North',
    zones: [
      { id: 'san-juan', label: 'San Juan' },
      { id: 'portinatx', label: 'Portinatx' },
      { id: 'san-miguel', label: 'San Miguel' },
      { id: 'san-mateo', label: 'San Mateo' },
      { id: 'cala-san-vicente', label: 'Cala San Vicente' },
    ],
  },
  {
    group: 'East',
    zones: [
      { id: 'santa-eulalia', label: 'Santa Eulalia' },
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
