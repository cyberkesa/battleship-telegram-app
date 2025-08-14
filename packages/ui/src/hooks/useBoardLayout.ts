import { useEffect, useState } from 'react';

/**
 * Computes responsive cell size based on container width, padding and gaps.
 * Ensures integer pixel size to avoid sub-pixel drift.
 */
export function useBoardLayout(
  containerRef: React.RefObject<HTMLElement>,
  options: { min?: number; max?: number; pad?: number; gap?: number } = {}
) {
  const { min = 20, max = 40, pad = 12, gap = 2 } = options;
  const [cellPx, setCellPx] = useState<number>(32);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = (width: number) => {
      const inner = width - pad * 2 - gap * 9;
      const raw = inner / 10;
      const next = Math.max(min, Math.min(max, Math.floor(raw)));
      setCellPx(next);
    };

    // Initial
    compute(el.clientWidth);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect?.width ?? el.clientWidth;
        compute(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, min, max, pad, gap]);

  return { cellPx, pad, gap } as const;
}


