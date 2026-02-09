/**
 * Ibiza zone taxonomy - centralized data for service area selection
 * Used in onboarding, profile management, AND job wizard logistics
 * This is the SINGLE SOURCE OF TRUTH for all location IDs
 */

export type IbizaZoneTier = 'main' | 'popular';

export type IbizaZone = { 
  id: string;           // kebab-case slug (single canonical format)
  label: string;        // human label
  tier?: IbizaZoneTier; // optional, defaults to popular
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

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/** Get all zones as a flat array */
export const getAllZones = (): IbizaZone[] => 
  IBIZA_ZONES.flatMap(g => g.zones);

/** Get all zone IDs as a flat array */
export const allZoneIds = (): string[] => 
  IBIZA_ZONES.flatMap(g => g.zones.map(z => z.id));

/** Main towns for wizard dropdown (first tier) */
export const getMainZones = (): IbizaZone[] => 
  IBIZA_ZONES.flatMap(g => g.zones.filter(z => z.tier === 'main'));

/** Popular areas for wizard expanded view */
export const getPopularZones = (): IbizaZone[] => 
  IBIZA_ZONES.flatMap(g => g.zones.filter(z => z.tier !== 'main'));

/** Get zone by ID (for display lookups) */
export const getZoneById = (id: string): IbizaZone | undefined => 
  getAllZones().find(z => z.id === id);

// ─────────────────────────────────────────────────────────────────────────────
// Legacy Alias Map (for backwards compatibility with snake_case DB values)
// TODO: Run migration to normalize all values, then remove this
// ─────────────────────────────────────────────────────────────────────────────

const ZONE_ALIASES: Record<string, string> = {
  // snake_case → kebab-case
  'san_antonio': 'san-antonio',
  'santa_eulalia': 'santa-eulalia',
  'san_jose': 'san-jose',
  'san_juan': 'san-juan',
  'playa_den_bossa': 'playa-den-bossa',
  'san_rafael': 'san-rafael',
  'santa_gertrudis': 'santa-gertrudis',
  'cala_llonga': 'cala-llonga',
  'san_carlos': 'san-carlos',
  'san_miguel': 'san-miguel',
  'san_mateo': 'san-mateo',
  'cala_san_vicente': 'cala-san-vicente',
  'cala_vadella': 'cala-vadella',
  'cala_tarida': 'cala-tarida',
  'cala_conta': 'cala-conta',
  'es_cana': 'es-cana',
  'es_cubells': 'es-cubells',
  'sant_jordi': 'sant-jordi',
  'ibiza_town': 'ibiza-town',
};

/** Normalize legacy snake_case zone IDs to kebab-case */
export const normalizeZoneId = (id: string | null | undefined): string | undefined => {
  if (!id) return undefined;
  return ZONE_ALIASES[id] ?? id;
};

/** Get zone by ID with legacy alias support */
export const getZoneByIdSafe = (id: string | null | undefined): IbizaZone | undefined => {
  const normalized = normalizeZoneId(id);
  return normalized ? getZoneById(normalized) : undefined;
};

// ─────────────────────────────────────────────────────────────────────────────
// Wizard Constants
// ─────────────────────────────────────────────────────────────────────────────

/** "Other area" option for wizard (not a real zone) */
export const OTHER_LOCATION = { 
  id: 'other', 
  label: 'Other area',
} as const;
