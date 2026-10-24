export interface ToastObstacle { left: number; right: number; top: number; bottom: number }
export interface ToastPlacementInput {
  baseTop: number; left: number; right: number; height: number; viewportHeight: number;
  obstacles: readonly ToastObstacle[];
  /** External separation only; card padding/type and right inset never change. */
  clearance?: number;
}

/** Preserve the fixed right rail. A lower-page gap is not a top-right placement. */
export function findToastTop(input: ToastPlacementInput): { top: number; fits: boolean } {
  const { baseTop, left, right, height, viewportHeight, clearance = 12 } = input;
  if (height <= 0) return { top: baseTop, fits: true };
  const obstacles = input.obstacles.filter(b => b.right > b.left && b.bottom > b.top && b.right > left && b.left < right && b.bottom > baseTop && b.top < viewportHeight).sort((a, b) => a.top - b.top);
  let top = baseTop;
  for (const obstacle of obstacles) {
    if (top + height > obstacle.top - clearance && top < obstacle.bottom + clearance) top = obstacle.bottom + clearance;
  }
  // Keep the whole card/stack in the upper half. The previous 240px search cutoff
  // rejected real clear gaps by only 8px on Desktop and 113px on Tablet.
  const fits = top + height <= viewportHeight / 2 && top + height <= viewportHeight - 16;
  // No new stack/queue/width/rail policy is invented when the locked geometry cannot fit.
  return { top: fits ? top : baseTop, fits };
}
