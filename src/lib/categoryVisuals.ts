/**
 * CATEGORY VISUAL SYSTEM
 * 
 * 3-layer visual hierarchy for marketplace cards:
 * - Main Category: gradient background + color mood
 * - Subcategory: icon (from categoryIcons.tsx)
 * - Micro: templated card using category visuals
 * 
 * Each category has a gradient pair (HSL) and an icon color.
 * Used by CategoryPlaceholder and all card components.
 */

export interface CategoryVisual {
  /** Gradient start HSL (without hsl() wrapper) */
  gradientFrom: string;
  /** Gradient end HSL */
  gradientTo: string;
  /** Foreground icon/text color on the gradient */
  iconColor: string;
  /** Human label for debugging */
  label: string;
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  // Construction — slate grey / steel
  'construction': {
    gradientFrom: '220 15% 35%',
    gradientTo: '220 20% 25%',
    iconColor: 'hsl(220 10% 85%)',
    label: 'Construction',
  },
  // Carpentry — warm oak
  'carpentry': {
    gradientFrom: '30 45% 40%',
    gradientTo: '25 50% 30%',
    iconColor: 'hsl(35 30% 90%)',
    label: 'Carpentry',
  },
  // Electrical — amber / charcoal
  'electrical': {
    gradientFrom: '45 80% 45%',
    gradientTo: '40 70% 35%',
    iconColor: 'hsl(45 10% 95%)',
    label: 'Electrical',
  },
  // Plumbing — deep blue / copper
  'plumbing': {
    gradientFrom: '210 50% 40%',
    gradientTo: '215 55% 30%',
    iconColor: 'hsl(25 60% 75%)',
    label: 'Plumbing',
  },
  // HVAC — cool silver / ice blue
  'hvac': {
    gradientFrom: '200 30% 55%',
    gradientTo: '205 35% 42%',
    iconColor: 'hsl(200 20% 92%)',
    label: 'HVAC',
  },
  // Painting & Decorating — soft neutral
  'painting-decorating': {
    gradientFrom: '30 20% 60%',
    gradientTo: '25 25% 48%',
    iconColor: 'hsl(30 15% 95%)',
    label: 'Painting & Decorating',
  },
  // Cleaning — aqua / bright
  'cleaning': {
    gradientFrom: '175 40% 50%',
    gradientTo: '180 45% 38%',
    iconColor: 'hsl(175 20% 95%)',
    label: 'Cleaning',
  },
  // Gardening & Landscaping — deep green
  'gardening-landscaping': {
    gradientFrom: '140 40% 38%',
    gradientTo: '145 45% 28%',
    iconColor: 'hsl(90 30% 88%)',
    label: 'Gardening & Landscaping',
  },
  // Pool & Spa — turquoise
  'pool-spa': {
    gradientFrom: '185 55% 48%',
    gradientTo: '190 60% 36%',
    iconColor: 'hsl(185 20% 93%)',
    label: 'Pool & Spa',
  },
  // Architects, Design & Management — blueprint / charcoal
  'architects-design': {
    gradientFrom: '215 30% 32%',
    gradientTo: '220 35% 22%',
    iconColor: 'hsl(200 40% 75%)',
    label: 'Architects & Design',
  },
  // Transport & Logistics — dark navy
  'transport-logistics': {
    gradientFrom: '225 35% 35%',
    gradientTo: '230 40% 25%',
    iconColor: 'hsl(225 15% 82%)',
    label: 'Transport & Logistics',
  },
  // Kitchen & Bathroom — marble white / steel
  'kitchen-bathroom': {
    gradientFrom: '220 10% 50%',
    gradientTo: '215 15% 38%',
    iconColor: 'hsl(220 8% 92%)',
    label: 'Kitchen & Bathroom',
  },
  // Floors, Doors & Windows — warm beige
  'floors-doors-windows': {
    gradientFrom: '35 30% 48%',
    gradientTo: '30 35% 38%',
    iconColor: 'hsl(35 20% 92%)',
    label: 'Floors, Doors & Windows',
  },
  // Handyman & General — neutral grey / orange accent
  'handyman-general': {
    gradientFrom: '20 40% 45%',
    gradientTo: '15 45% 35%',
    iconColor: 'hsl(20 20% 92%)',
    label: 'Handyman & General',
  },
  // Commercial & Industrial — dark steel / hazard yellow
  'commercial-industrial': {
    gradientFrom: '220 15% 30%',
    gradientTo: '225 20% 22%',
    iconColor: 'hsl(45 80% 65%)',
    label: 'Commercial & Industrial',
  },
  // Legal & Regulatory — deep navy / gold accent
  'legal-regulatory': {
    gradientFrom: '230 30% 28%',
    gradientTo: '235 35% 20%',
    iconColor: 'hsl(42 70% 65%)',
    label: 'Legal & Regulatory',
  },
};

// Also map by category name
const NAME_TO_SLUG: Record<string, string> = {
  'Construction': 'construction',
  'Carpentry': 'carpentry',
  'Electrical': 'electrical',
  'Plumbing': 'plumbing',
  'HVAC': 'hvac',
  'Painting & Decorating': 'painting-decorating',
  'Cleaning': 'cleaning',
  'Gardening & Landscaping': 'gardening-landscaping',
  'Pool & Spa': 'pool-spa',
  'Architects, Design & Management': 'architects-design',
  'Transport & Logistics': 'transport-logistics',
  'Kitchen & Bathroom': 'kitchen-bathroom',
  'Floors, Doors & Windows': 'floors-doors-windows',
  'Handyman & General': 'handyman-general',
  'Commercial & Industrial': 'commercial-industrial',
  'Legal & Regulatory': 'legal-regulatory',
};

const DEFAULT_VISUAL: CategoryVisual = {
  gradientFrom: '220 15% 40%',
  gradientTo: '220 20% 30%',
  iconColor: 'hsl(220 10% 85%)',
  label: 'General',
};

/** Get category visual by slug */
export function getCategoryVisual(slug: string | null | undefined): CategoryVisual {
  if (!slug) return DEFAULT_VISUAL;
  return CATEGORY_VISUALS[slug] ?? DEFAULT_VISUAL;
}

/** Get category visual by display name */
export function getCategoryVisualByName(name: string | null | undefined): CategoryVisual {
  if (!name) return DEFAULT_VISUAL;
  const slug = NAME_TO_SLUG[name];
  if (slug) return CATEGORY_VISUALS[slug] ?? DEFAULT_VISUAL;
  return DEFAULT_VISUAL;
}

/** Generate inline style for gradient background */
export function categoryGradientStyle(visual: CategoryVisual): React.CSSProperties {
  return {
    background: `linear-gradient(135deg, hsl(${visual.gradientFrom}) 0%, hsl(${visual.gradientTo}) 100%)`,
  };
}
