/** Deterministic fixture manifest for the approved S11/S13/S14 workspace.
 * It is a setup input, not a UI hard-code: callers still persist through canonical commands. */
export interface ApprovedTrayBoxSeed { code: string; skuCode: string; receiptCode: string; quantity: number; trayCode: string | null; orderCode: string; status: 'CONFIRMED' | 'DRAFT' | 'QUEUE' }
export interface ApprovedTraySeed { code: string; locationCode: string; active: true }
export interface ApprovedTrayHistorySeed { orderCode: string; boxCode: string; trayCode: string; action: 'putaway.confirm'; actor: string; timestamp: string }
const quantity = [6, 12, 8, 24, 30, 4, 15, 10, 9];
const sku = (i: number) => `SKU-HN-${String(i).padStart(3, '0')}`;
const receipt = (i: number) => `HN-PN-${String(i).padStart(4, '0')}`;
const box = (i: number) => i === 9 ? 'HN-BOX-0009' : `BOX-${String(i).padStart(4, '0')}`;
const order = (i: number) => `XK-${String(i).padStart(4, '0')}`;
const tray = (i: number) => `TRAY-${String(i).padStart(3, '0')}`;

export function createApprovedTraySeed(startedAt = '2026-10-26T09:22:00+07:00') {
  const trays: ApprovedTraySeed[] = Array.from({ length: 9 }, (_, i) => ({ code: tray(i + 1), locationCode: `A-01-${String(i + 1).padStart(2, '0')}`, active: true }));
  const confirmed: ApprovedTrayBoxSeed[] = quantity.map((value, i) => ({ code: box(i + 1), skuCode: sku(i + 1), receiptCode: receipt(i + 1), quantity: value, trayCode: tray(i + 1), orderCode: order(i + 1), status: 'CONFIRMED' }));
  const drafts: ApprovedTrayBoxSeed[] = quantity.map((value, i) => ({ code: box(i + 11), skuCode: sku(i + 1), receiptCode: receipt(i + 11), quantity: value, trayCode: null, orderCode: order(i + 11), status: 'DRAFT' }));
  const queue: ApprovedTrayBoxSeed[] = quantity.map((value, i) => ({ code: box(i + 21), skuCode: sku(i + 1), receiptCode: receipt(i + 21), quantity: value, trayCode: null, orderCode: order(i + 21), status: 'QUEUE' }));
  const history: ApprovedTrayHistorySeed[] = confirmed.map((row, i) => ({ orderCode: row.orderCode, boxCode: row.code, trayCode: row.trayCode!, action: 'putaway.confirm', actor: i % 2 ? 'Trần Thu Hà' : 'Nguyễn Văn An', timestamp: new Date(Date.parse(startedAt) + i * 120000).toISOString() }));
  return { id: 'PUTAWAY-APPROVED-FIXTURE-9-V1', trays, boxes: [...confirmed, ...drafts, ...queue], orders: [...confirmed, ...drafts], history } as const;
}
