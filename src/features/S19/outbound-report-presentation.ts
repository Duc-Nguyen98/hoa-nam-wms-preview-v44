/** Fractional layout/scroll positions must not leave an unusable enabled arrow. */
export function outboundScrollEdges(left: number, width: number, scrollWidth: number) {
  const maximum = Math.max(0, scrollWidth - width);
  return { left: maximum > 1 && left > 1, right: maximum > 1 && left < maximum - 1 };
}

/** Preserve the same business column group when responsive headers are merged. */
export function outboundFocusColumn(column?: string) {
  return column === 'shippedDate' ? 'code' : column === 'creator' ? 'customer' : undefined;
}
