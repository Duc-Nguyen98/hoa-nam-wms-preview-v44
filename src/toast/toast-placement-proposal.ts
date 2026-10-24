import type { ToastObstacle, ToastPlacementInput } from './toast-placement';
import { findToastTop } from './toast-placement';

/** Option D is an unapproved Preview comparison, never the default anchor.
 * Keep the original right edge when safe, otherwise search the upper-right
 * quadrant for the nearest unobstructed rectangle without moving business UI. */
export function findToastProposalD(input: ToastPlacementInput & { viewportWidth: number }) {
  const original = findToastTop(input), width = input.right - input.left;
  if (original.fits) return { ...original, right: input.viewportWidth - input.right };
  const gap = 12, animationTravel = 65;
  const xs = new Set([input.left]);
  const ys = new Set([input.baseTop]);
  for (const obstacle of input.obstacles) {
    xs.add(obstacle.left - gap - width - animationTravel);
    xs.add(obstacle.right + gap);
    ys.add(obstacle.bottom + gap);
  }
  const fits: { top: number; left: number; cost: number }[] = [];
  for (const top of ys) for (const left of xs) {
    if (left < input.viewportWidth / 2 || left + width > input.right || top < input.baseTop
      || top + input.height > input.viewportHeight / 2) continue;
    if (input.obstacles.some(o => left < o.right + gap && Math.min(input.viewportWidth, left + width + animationTravel) > o.left - gap
      && top < o.bottom + gap && top + input.height > o.top - gap)) continue;
    fits.push({ top, left, cost: Math.abs(input.left - left) + Math.abs(top - input.baseTop) });
  }
  fits.sort((a,b)=>a.cost-b.cost || a.top-b.top || b.left-a.left);
  return fits[0] ? { top: fits[0].top, right: input.viewportWidth - fits[0].left - width, fits: true }
    : { ...original, right: input.viewportWidth - input.right };
}
