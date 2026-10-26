/** S09 column composition only; shared DataTable still owns pinning and focus. */
export const WARRANTY_TABLE_WIDTHS = { wide: 1240, compact: 960, portrait: 704, pinMinimum: 420 } as const;

export function warrantyTableLayout(availableWidth: number) {
  return {
    compact: availableWidth < WARRANTY_TABLE_WIDTHS.wide,
    portrait: availableWidth < WARRANTY_TABLE_WIDTHS.compact,
    // The widest unpinned cell must remain readable, not just a 44px target.
    pinCase: availableWidth >= WARRANTY_TABLE_WIDTHS.pinMinimum,
  };
}

export function warrantyScrollTarget(current: number, maximum: number, columnStarts: readonly number[], direction: -1 | 1) {
  // Align the next column with the readable edge. A fixed pixel/page step can
  // skip a column, or leave its label clipped on both successive positions.
  const anchors = [...new Set([0, maximum, ...columnStarts.map(start => Math.max(0, Math.min(maximum, start)))])].sort((a, b) => a - b);
  return direction > 0 ? anchors.find(anchor => anchor > current + 1) ?? maximum
    : anchors.reverse().find(anchor => anchor < current - 1) ?? 0;
}
