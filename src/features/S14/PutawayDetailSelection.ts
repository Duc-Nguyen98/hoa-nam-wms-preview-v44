import type { PutawayOrderRow, PutawayOrdersModel } from '../../contracts/putaway-orders';

/** Re-resolve from the accepted source on every render; never retain an inferred BOX join. */
export function resolvePutawayDetail(model: PutawayOrdersModel | null, orderCode: string): PutawayOrderRow | undefined {
  if (model?.source.id !== 'S14-P01-r01-default') return undefined;
  const matches = model.rows.filter(row => row.orderCode === orderCode);
  return matches.length === 1 ? matches[0] : undefined;
}
