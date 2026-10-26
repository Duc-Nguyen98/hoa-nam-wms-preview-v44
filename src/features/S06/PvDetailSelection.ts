import type { PvModel, PvProduct } from '../../contracts/pv-products';

/** Only one accepted source record can resolve an approved PV detail identity. */
export function resolvePvDetail(model: PvModel | null, key: string): PvProduct | undefined {
  if (model?.scope.kind !== 'source-detail' || !/^SP-MKS-00[1-7]$/.test(key)) return undefined;
  const matches = model.rows.filter(row => row.key === key || row.productCode === key);
  if (matches.length !== 1) return undefined;
  const row = matches[0];
  return row.key === key && row.productCode === key ? row : undefined;
}
