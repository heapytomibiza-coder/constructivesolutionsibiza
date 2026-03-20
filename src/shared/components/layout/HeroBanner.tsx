import * as React from "react";
import { cn } from "@/lib/utils";

interface HeroBannerProps {
  imageSrc: string;
  /** Responsive variants: { "400w": url, "800w": url } */
  imageSrcSet?: Record<string, string>;
  title: string;
  subtitle?: string;
  trustBadge?: React.ReactNode;
  action?: React.ReactNode;
  /** 
   * Height variant: 'full' for homepage (70vh), 'medium' for inner pages (50vh), 'compact' (40vh) 
   */
  height?: "full" | "medium" | "compact";
  className?: string;
  children?: React.ReactNode;
}

/**
 * HeroBanner - Full-bleed photographic hero section
 * 
 * Used across public pages for consistent Mediterranean construction vibes.
 * Features a dark gradient overlay for text readability.
 */
export function HeroBanner({
  imageSrc,
  imageSrcSet,
  title,
  subtitle,
  trustBadge,
  action,
  height = "medium",
  className,
  children,
}: HeroBannerProps) {
  // Build srcset string from variants map
  const srcSetStr = imageSrcSet
    ? Object.entries(imageSrcSet)
        .map(([size, url]) => `${url} ${size}`)
        .join(', ')
    : undefined;
  const heightClasses = {
    full: "min-h-[60vh] lg:min-h-[70vh]",
    medium: "min-h-[45vh] lg:min-h-[50vh]",
    compact: "min-h-[35vh] lg:min-h-[40vh]",
  };

  return (
    <section
      className={cn(
        "hero-banner relative flex items-center justify-center overflow-hidden",
        heightClasses[height],
        className
      )}
    >
      {/* Background Image — uses <img> for browser-native lazy/eager + decoding */}
      <img
        src={imageSrc}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Gradient Overlay */}
      <div className="hero-overlay absolute inset-0" />
      
      {/* Content */}
      <div className="hero-content container relative z-10 text-center">
        <div className="mx-auto max-w-3xl">
          {/* Children render above title (e.g., brand lockup) */}
          {children}
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-lg">
            {title}
          </h1>
          
          {subtitle && (
            <p className="mt-4 text-lg sm:text-xl text-white/90 drop-shadow-md max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
          
          {trustBadge && (
            <div className="mt-4">
              {trustBadge}
            </div>
          )}
          
          {action && (
            <div className="mt-8">
          {action}
        </div>
      )}
    </div>
  </div>
</section>
  );
}
