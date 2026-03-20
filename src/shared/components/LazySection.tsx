import { useRef, useState, useEffect, type ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  /** Placeholder height before content loads */
  minHeight?: number;
  /** How far before visible to start rendering */
  rootMargin?: string;
  className?: string;
}

/**
 * LazySection — defers rendering of below-the-fold content
 * until the user scrolls near it. Reduces initial DOM size and paint cost.
 */
export function LazySection({
  children,
  minHeight = 200,
  rootMargin = '300px',
  className,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : <div style={{ minHeight }} />}
    </div>
  );
}
