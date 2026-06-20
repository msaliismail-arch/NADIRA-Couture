"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveal-on-scroll hook. Returns a ref to attach and a boolean for visibility.
 * Uses IntersectionObserver (async) + a fallback timeout so content is never
 * permanently hidden. No synchronous setState in the effect body.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setVisible(true);
    };

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px", ...options }
    );
    obs.observe(el);

    // Fallback: ensure content is never permanently hidden (also covers
    // above-the-fold content if the observer is slow to fire).
    const fallback = setTimeout(show, 1200);

    return () => {
      obs.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return { ref, visible };
}
