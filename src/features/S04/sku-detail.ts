import type { SkuRow, SkusModel } from '../../contracts/skus';

/** A frontend accepted-row key, never a Product FK or backend entity ID. */
export interface SkuDetailTarget { key: string; sourceId: string }

export function resolveSkuDetailRow(model: SkusModel | null, target: SkuDetailTarget): SkuRow | null {
  if (!model || model.source.id !== target.sourceId) return null;
  const matches = model.rows.filter(row => row.key === target.key);
  // Never fall back to the first row or preserve a stale copy after an accepted read.
  return matches.length === 1 ? matches[0] : null;
}
