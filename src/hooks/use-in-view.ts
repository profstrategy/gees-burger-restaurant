'use client';

import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  once?: boolean;
  rootMargin?: string;
  threshold?: number;
}

/**
 * Tracks whether an element is inside the viewport using IntersectionObserver.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>({
  once = false,
  rootMargin = '0px',
  threshold = 0.1,
}: UseInViewOptions = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState<boolean>(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [once, rootMargin, threshold]);

  return { ref, inView };
}
