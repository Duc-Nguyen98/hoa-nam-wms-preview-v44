/** Owner-approved preview ordering, 09/10/2026. Codes remain strings. */
const vietnamese = new Intl.Collator('vi', { usage: 'sort', sensitivity: 'accent', numeric: false });

export function compareText(left: string, right: string): number {
  return vietnamese.compare(left, right);
}

/** Stable on ties in either direction; call on the complete filtered result, before slicing. */
export function orderRows<Row>(rows: readonly Row[], compare: (left: Row, right: Row) => number, direction: 'asc' | 'desc'): Row[] {
  const sign = direction === 'asc' ? 1 : -1;
  return rows.map((row, index) => ({ row, index }))
    .sort((a, b) => sign * compare(a.row, b.row) || a.index - b.index)
    .map(item => item.row);
}
