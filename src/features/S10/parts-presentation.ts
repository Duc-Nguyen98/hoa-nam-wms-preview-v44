/** Presentation-only splitting of supplied labels; never infers missing records or fields. */
export function componentLabelParts(label: string): { name: string; code: string | null } {
  const separator = label.indexOf(' · ');
  if (separator <= 0 || separator + 3 >= label.length) return { name: label, code: null };
  return { code: label.slice(0, separator), name: label.slice(separator + 3) };
}
export function updatedLabelParts(label: string): { date: string; time: string | null } {
  const match = /^(\d{2}\/\d{2}\/\d{4}) · (\d{2}:\d{2})$/u.exec(label);
  return match ? { date: match[1], time: match[2] } : { date: label, time: null };
}

/** Keep the 220px identity column only when at least 340px remains for reading. */
export function shouldPinSlip(viewportWidth: number): boolean {
  return viewportWidth >= 560;
}

/** One arrow reveals the next data band with overlap, never jumping unseen cells. */
export function tableScrollStep(viewportWidth: number, pinnedWidth: number): number {
  const available = Math.max(1, viewportWidth - pinnedWidth);
  return Math.max(1, Math.floor(available - Math.min(32, available / 4)));
}
