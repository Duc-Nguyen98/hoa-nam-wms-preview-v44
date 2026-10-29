import type { Box, Sku } from './adapter';

/** A missing count is unverified, including when one BOX in an allocation is uncounted. */
export const knownCount = (count: number | null): count is number => typeof count === 'number' && Number.isFinite(count);
export const variance = (row: Pick<Sku, 'actual' | 'count'>): number | null => knownCount(row.count) ? row.count - row.actual : null;
export const resultKey = (row: Pick<Sku, 'actual' | 'count'>): string => {
  const delta = variance(row);
  return delta === null ? 'unknown' : String(Math.sign(delta));
};
export const sumCounts = (rows: readonly Pick<Sku, 'count'>[]): number | null => rows.every(row => knownCount(row.count)) ? rows.reduce((sum, row) => sum + row.count!, 0) : null;
export const inScope = (row: { warehouse: string; location: string }, warehouse: string, location = '') => (!warehouse || row.warehouse === warehouse) && (!location || row.location === location);
export function projectSku(row: Sku, boxes: readonly Box[], warehouse: string, location: string): Sku | null {
  if (warehouse && row.warehouse !== warehouse) return null;
  if (!location) return row;
  const allocation = boxes.filter(box => box.sku === row.sku && box.warehouse === row.warehouse && box.location === location);
  if (!allocation.length) return row.location === location ? row : null;
  return { ...row, location, actual: allocation.reduce((sum, box) => sum + box.actual, 0), held: allocation.reduce((sum, box) => sum + box.held, 0), count: sumCounts(allocation) };
}
export function availableLocations(skus: readonly Sku[], boxes: readonly Box[], warehouse: string): string[] {
  // Aggregate labels (e.g. “9 vị trí”) are not individual storage locations.
  return [...new Set([...skus.filter(row => !warehouse || row.warehouse === warehouse).map(row => row.location).filter(value => !/\s/.test(value)), ...boxes.filter(row => !warehouse || row.warehouse === warehouse).map(row => row.location)])].sort();
}
