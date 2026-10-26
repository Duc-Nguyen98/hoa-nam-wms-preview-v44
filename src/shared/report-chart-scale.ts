/** A zero-based count axis with evenly spaced integer ticks and room for every value. */
export function reportCountScale(values: readonly number[], intervals = 3) {
  const count = Math.max(1, Math.floor(intervals));
  const peak = values.reduce((maximum, value) => Number.isFinite(value) ? Math.max(maximum, value) : maximum, 0);
  const minimumStep = Math.max(1, peak / count);
  const magnitude = 10 ** Math.floor(Math.log10(minimumStep));
  const factor = [1, 2, 5, 10].find(value => value * magnitude >= minimumStep) ?? 10;
  const step = factor * magnitude;
  const maximum = step * count;
  return { maximum, ticks: Array.from({ length: count + 1 }, (_, index) => maximum - index * step) };
}

export function reportAxisWidth(maximum: number, minimum = 26) {
  return Math.max(minimum, maximum.toLocaleString('vi-VN').length * 7);
}

/** Point centers shared by SVG lines, columns and their date controls. */
export function reportDayCenter(index: number, dayCount: number, plotWidth = 100) {
  return (index + .5) / Math.max(1, dayCount) * plotWidth;
}
