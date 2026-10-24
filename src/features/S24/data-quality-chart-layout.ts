/** Canvas coordinates constrained to the visible horizontal chart scrollport. */
export function chartTooltipPosition(dayCenter: number, scrollLeft: number, viewportWidth: number) {
  const gutter = 4;
  const width = Math.min(230, Math.max(0, viewportWidth - gutter * 2));
  const min = scrollLeft + gutter + width / 2;
  const max = scrollLeft + viewportWidth - gutter - width / 2;
  return { width, center: Math.max(min, Math.min(max, dayCenter)) };
}

/** Reveal the whole day control and its focus ring, not only its text caret. */
export function chartFocusScrollLeft(current: number, viewportWidth: number, left: number, right: number, canvasWidth: number) {
  const gutter = 4;
  const next = left < current + gutter ? left - gutter
    : right > current + viewportWidth - gutter ? right - viewportWidth + gutter
      : current;
  return Math.max(0, Math.min(Math.max(0, canvasWidth - viewportWidth), next));
}
