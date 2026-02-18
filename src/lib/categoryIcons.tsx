/**
 * CATEGORY ICON MAP
 * 
 * Maps service category slugs to Lucide icon components.
 * Used everywhere categories are displayed instead of emojis.
 * 
 * Usage:
 *   import { getCategoryIcon } from '@/lib/categoryIcons';
 *   const Icon = getCategoryIcon('plumbing'); // returns Lucide component
 *   <Icon className="h-5 w-5" />
 */

import {
  HardHat,
  Hammer,
  Zap,
  Wrench,
  Snowflake,
  Paintbrush,
  SprayCan,
  TreePine,
  Waves,
  Ruler,
  Truck,
  CookingPot,
  DoorOpen,
  PenTool,
  Factory,
  FileText,
  Package,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  'construction': HardHat,
  'carpentry': Hammer,
  'electrical': Zap,
  'plumbing': Wrench,
  'hvac': Snowflake,
  'painting-decorating': Paintbrush,
  'cleaning': SprayCan,
  'gardening-landscaping': TreePine,
  'pool-spa': Waves,
  'architects-design': Ruler,
  'transport-logistics': Truck,
  'kitchen-bathroom': CookingPot,
  'floors-doors-windows': DoorOpen,
  'handyman-general': PenTool,
  'commercial-industrial': Factory,
  'legal-regulatory': FileText,
};

// Also map by category name for components that don't have slug
const CATEGORY_NAME_MAP: Record<string, LucideIcon> = {
  'Construction': HardHat,
  'Carpentry': Hammer,
  'Electrical': Zap,
  'Plumbing': Wrench,
  'HVAC': Snowflake,
  'Painting & Decorating': Paintbrush,
  'Cleaning': SprayCan,
  'Gardening & Landscaping': TreePine,
  'Pool & Spa': Waves,
  'Architects, Design & Management': Ruler,
  'Transport & Logistics': Truck,
  'Kitchen & Bathroom': CookingPot,
  'Floors, Doors & Windows': DoorOpen,
  'Handyman & General': PenTool,
  'Commercial & Industrial': Factory,
  'Legal & Regulatory': FileText,
};

/** Get icon by category slug (preferred) */
export function getCategoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICON_MAP[slug] ?? Package;
}

/** Get icon by category display name */
export function getCategoryIconByName(name: string): LucideIcon {
  return CATEGORY_NAME_MAP[name] ?? Package;
}
