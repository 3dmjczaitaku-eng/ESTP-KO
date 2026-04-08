'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useIntersectionObserver
 * Triggers callback when element enters viewport
 * Used for scroll-triggered animations and lazy loading
 */
export function useIntersectionObserver(
  options: {
    threshold?: number | number[];
    rootMargin?: string;
    onVisible?: () => void;
    onHidden?: () => void;
  } = {}
) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          options.onVisible?.();
        } else {
          setIsVisible(false);
          options.onHidden?.();
        }
      },
      {
        threshold: options.threshold ?? 0.1,
        rootMargin: options.rootMargin ?? '0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [options]);

  return { ref, isVisible };
}

/**
 * useScrollEffect
 * Provides scroll position (0–1 normalized) for animations
 * Useful for parallax, fade-in, and scroll-linked effects
 */
export function useScrollEffect(
  elementRef?: React.RefObject<HTMLElement | null>
): number {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (elementRef?.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const elementTop = rect.top;
        const elementBottom = rect.bottom;
        const windowHeight = window.innerHeight;

        // Normalize scroll progress: 0 when element exits top, 1 when exits bottom
        const progress = Math.max(
          0,
          Math.min(
            1,
            1 -
              (elementTop - 0) /
                (elementBottom - elementTop + windowHeight)
          )
        );

        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [elementRef]);

  return scrollProgress;
}

/**
 * useMediaLoaded
 * Tracks if image/video has loaded successfully
 * Useful for fade-in animations and fallback handling
 */
export function useMediaLoaded(initialLoaded = false) {
  const [isLoaded, setIsLoaded] = useState(initialLoaded);
  const [error, setError] = useState<string | null>(null);

  const onLoad = useCallback(() => {
    setIsLoaded(true);
    setError(null);
  }, []);

  const onError = useCallback((err: any) => {
    setError(err?.message || 'Failed to load media');
    setIsLoaded(false);
  }, []);

  return { isLoaded, error, onLoad, onError };
}

/**
 * useStaggerAnimation
 * Provides staggered animation delays for multiple elements
 * E.g., for animating list items sequentially
 */
export function useStaggerAnimation(
  itemCount: number,
  baseDelay = 0.1
): number[] {
  return Array.from({ length: itemCount }, (_, i) => i * baseDelay);
}
