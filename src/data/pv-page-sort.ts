import type { PvSortKey, PvProduct } from '../contracts/pv-products';
import { compareText } from '../shared/table-query';

function updatedValue(label: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(label);
  if (!match) throw new Error('Invalid S06 fixture update timestamp.');
  const [, day, month, year, hour, minute] = match.map(Number);
  const value = Date.UTC(year, month - 1, day, hour, minute);
  const date = new Date(value);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || hour > 23 || minute > 59) throw new Error('Invalid S06 fixture update timestamp.');
  // UTC is only a sortable wall-clock encoding here, not an inferred business timezone.
  return value;
}

/** Comparator for the entire confirmed detail scope, before the shared pager. */
export function comparePvProducts(key: PvSortKey, left: PvProduct, right: PvProduct): number {
  if (key === 'updated') return updatedValue(left.updatedAtLabel) - updatedValue(right.updatedAtLabel);
  const field = { product: 'productName', productCode: 'productCode', sku: 'sku', group: 'productGroup', visibility: 'visibilityLabel' } as const;
  return compareText(left[field[key]], right[field[key]]);
}
