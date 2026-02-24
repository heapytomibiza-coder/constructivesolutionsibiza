/**
 * Taxonomy Translation Helpers
 * 
 * Maps English category/subcategory display names (stored in DB)
 * to i18n translation keys in the "common" namespace.
 * 
 * Categories use: common:categories.<camelKey>
 * Subcategories use: common:subcategories.<slug>
 */

import { CATEGORY_KEYS } from "./categoryTranslations";

/**
 * Maps English subcategory display names → slug keys used in common.json subcategories.
 * This allows looking up translations from the English labels stored in job records.
 */
export const SUBCATEGORY_KEYS: Record<string, string> = {
  // Construction
  "General Building": "general-building",
  "Masonry": "masonry",
  "Foundation Work": "foundation-work",
  "Structural Repairs": "structural-repairs",
  "Extensions": "extensions",
  "Brickwork, Masonry & Concrete": "brickwork-masonry-concrete",
  "Metalwork & Welding": "metalwork-welding",
  "Roofing": "roofing",
  "Solar & Renewable Energy": "solar-renewable-energy",
  "Tiling & Waterproofing": "tiling-waterproofing",
  "Outdoor Construction": "outdoor-construction",
  "Renovations & Home Upgrades": "renovations-home-upgrades",
  // Carpentry
  "Bespoke Joinery": "bespoke-joinery",
  "Fitted Wardrobes": "fitted-wardrobes",
  "Custom Furniture": "custom-furniture",
  "Doors & Windows": "doors-windows",
  "Structural Carpentry": "structural-carpentry",
  "Decking & Pergolas": "decking-pergolas",
  "Restoration": "restoration",
  // Electrical
  "Installations": "installations",
  "Repairs": "electrical-repairs",
  "Lighting": "lighting",
  "Faults, Repairs & Safety": "faults-repairs-safety",
  "Rewiring & New Circuits": "rewiring-new-circuits",
  "Fuse Boxes & Consumer Units": "fuse-boxes-consumer-units",
  "Lighting & Power": "lighting-power",
  "Outdoor & External Electrics": "outdoor-external-electrics",
  // Plumbing
  "Hot Water Systems": "hot-water-systems",
  "Drainage": "drainage",
  "Emergency Plumbing": "emergency-plumbing",
  "Leak Repairs": "leak-repairs",
  "Bathroom": "bathroom",
  "Kitchen": "kitchen-plumbing",
  "General Plumbing": "general-plumbing",
  "Bathroom Fitting": "bathroom-fitting",
  "Water Systems": "water-systems",
  "Leak Detection & Repair": "leak-detection-repair",
  "Heating & Boilers": "heating-boilers",
  // HVAC
  "Air Conditioning": "air-conditioning",
  "Heating Systems": "heating-systems",
  "Ventilation": "ventilation",
  "Maintenance": "hvac-maintenance",
  "AC Installation & Upgrade": "ac-installation-upgrade",
  "AC Servicing & Repairs": "ac-servicing-repairs",
  "Ventilation & Air Quality": "ventilation-air-quality",
  "Controls & Efficiency": "controls-efficiency",
  // Painting & Decorating
  "Interior Painting": "interior-painting",
  "Interior": "interior-painting",
  "Exterior Painting": "exterior-painting",
  "Exterior": "exterior-painting",
  "Decorative Finishes": "decorative-finishes",
  "Wallpapering": "wallpapering",
  "Restoration Specialist": "restoration-specialist",
  "Property Staging": "property-staging",
  // Cleaning
  "Residential Cleaning": "residential-cleaning",
  "Commercial Cleaning": "commercial-cleaning",
  "Deep Cleaning": "deep-cleaning",
  "Post-Construction": "post-construction-cleaning",
  "Window Cleaning": "window-cleaning",
  "Domestic Cleaning": "domestic-cleaning",
  "End of Tenancy": "end-of-tenancy",
  "Specialist Cleaning": "specialist-cleaning",
  // Gardening & Landscaping
  "Garden Design": "garden-design",
  "Lawn Care": "lawn-care",
  "Tree & Hedge Care": "tree-hedge-care",
  "Irrigation Systems": "irrigation-systems",
  "Irrigation": "irrigation",
  "Landscaping": "landscaping",
  "Tree Surgery": "tree-surgery",
  "Outdoor Living Spaces": "outdoor-living-spaces",
  "Maintenance": "garden-maintenance",
  // Pool & Spa
  "Pool Construction": "pool-construction",
  "Pool Maintenance": "pool-maintenance",
  "Pool Renovation": "pool-renovation",
  "Spa & Hot Tub": "spa-hot-tub",
  "Pool Repairs": "pool-repairs",
  "Spa & Jacuzzi": "spa-jacuzzi",
  // Architects, Design & Management
  "Architectural Design": "architectural-design",
  "Interior Design": "interior-design",
  "Project Management": "project-management",
  "3D Visualization": "3d-visualization",
  // Kitchen & Bathroom
  "Kitchen Fitting": "kitchen-fitting",
  "Kitchen Installation": "kitchen-installation",
  "Bathroom Installation": "bathroom-installation",
  "Worktops & Surfaces": "worktops-surfaces",
  "Worktops & Counters": "worktops-counters",
  "Fixtures & Fittings": "fixtures-fittings",
  "Refurbishment": "refurbishment",
  // Floors, Doors & Windows
  "Flooring": "flooring",
  "Flooring Installation": "flooring-installation",
  "Door Installation": "door-installation",
  "Window Installation": "window-installation",
  "Windows": "windows",
  "Doors": "doors",
  "Glazing": "glazing",
  // Transport & Logistics
  "Moving Services": "moving-services",
  "Delivery": "delivery",
  "Delivery Services": "delivery-services",
  "Vehicle Hire": "vehicle-hire",
  "Equipment Transport": "equipment-transport",
  "Equipment Rental": "equipment-rental",
  "Waste Removal": "waste-removal",
  // Handyman & General
  "General Repairs": "general-repairs",
  "Assembly Services": "assembly-services",
  "Home Maintenance": "home-maintenance",
  "Odd Jobs": "odd-jobs",
  // Commercial & Industrial
  "Commercial Fit-Out": "commercial-fit-out",
  "Industrial Construction": "industrial-construction",
  "Retail & Hospitality": "retail-hospitality",
  "Office Renovation": "office-renovation",
  // Legal & Regulatory
  "Building Permits": "building-permits",
  "Planning Applications": "planning-applications",
  "Inspections": "inspections",
  "Compliance": "compliance",
};

/**
 * Translate a category display name using i18n.
 * Falls back to the original English label if no translation key is found.
 */
export function txCategory(
  label: string | null | undefined,
  t: (key: string) => string
): string | null {
  if (!label) return null;
  const key = CATEGORY_KEYS[label];
  if (key) {
    const translated = t(`common:${key}`);
    if (translated !== `common:${key}` && translated !== key) return translated;
  }
  return label;
}

/**
 * Translate a subcategory display name using i18n.
 * Falls back to the original English label if no translation key is found.
 */
export function txSubcategory(
  label: string | null | undefined,
  t: (key: string) => string
): string | null {
  if (!label) return null;
  const slug = SUBCATEGORY_KEYS[label];
  if (slug) {
    const key = `common:subcategories.${slug}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return label;
}

/**
 * Translate a micro-service name by its slug using i18n.
 * Looks up micros:<slug> namespace. Falls back to the provided fallback or humanized slug.
 */
export function txMicro(
  slug: string | null | undefined,
  t: (key: string, opts?: Record<string, unknown>) => string,
  fallback?: string | null
): string {
  if (!slug) return fallback ?? "";
  const key = `micros:${slug}`;
  const translated = t(key, { defaultValue: '' });
  if (translated && translated !== key && translated !== slug) return translated;
  return fallback ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
