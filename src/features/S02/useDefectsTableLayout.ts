import { useLayoutEffect, useRef, useState } from 'react';

/** Fit the table to the actual content above it; short/zoomed windows keep ordinary page scrolling. */
export function useDefectsTableLayout(ready: boolean, queryKey: string) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const screen = screenRef.current;
    const region = screen?.querySelector<HTMLElement>('.hn-table-scroll');
    const footer = screen?.querySelector<HTMLElement>('.hn-pagination');
    if (!screen || !region || !footer) return;
    let frame = 0;
    const measure = () => {
      const top = region.getBoundingClientRect().top + window.scrollY;
      const bottomPadding = Number.parseFloat(getComputedStyle(screen.closest('main')!).paddingBottom) || 24;
      const available = Math.floor(window.innerHeight - top - footer.getBoundingClientRect().height - bottomPadding - 2);
      // Avoid a tiny nested scrollbox at high zoom: use the page when fewer than three rows fit.
      const height = available >= 220 ? `${available}px` : 'none';
      if (screen.style.getPropertyValue('--df-table-height') !== height) screen.style.setProperty('--df-table-height', height);
      setOverflows(region.scrollWidth > region.clientWidth + 1);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(screen);
    observer.observe(region);
    observer.observe(footer);
    window.addEventListener('resize', schedule);
    return () => { observer.disconnect(); window.removeEventListener('resize', schedule); cancelAnimationFrame(frame); };
  }, [ready]);
  useLayoutEffect(() => {
    const region = screenRef.current?.querySelector<HTMLElement>('.hn-table-scroll');
    if (region) region.scrollLeft = 0;
  }, [queryKey]);
  return { screenRef, overflows };
}
