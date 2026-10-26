import type { ReceiptRow, ReceiptsModel } from '../../contracts/receipts';

/** Existing receipt identifier within the accepted read source, not a new join. */
export interface ReceiptDetailTarget { receipt: string; sourceId: string }
export function resolveReceiptDetailRow(model: ReceiptsModel | null, target: ReceiptDetailTarget): ReceiptRow | null {
  if (!model || model.source.id !== target.sourceId) return null;
  const matches = model.rows.filter(row => row.receipt === target.receipt);
  return matches.length === 1 ? matches[0] : null;
}
