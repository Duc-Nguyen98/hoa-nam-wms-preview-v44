import { useState } from 'react';
import type { CatalogSnapshot, CatalogRecipient } from '../contracts/catalog-create';
import type { OperationalPayloads } from '../contracts/operational-preview';
import { Button } from '../shared';
import { validateOutboundDraft, type OutboundDraftError, type OutboundDraftRow } from './outbound-request-draft';

type Props = { catalog: CatalogSnapshot | null; selectedSkuIds: readonly string[]; recipient: CatalogRecipient | undefined; en: boolean; disabled?: boolean; onSubmit: (payload: OperationalPayloads['outbound.create']) => Promise<void> };
const messages: Record<OutboundDraftError, [string, string]> = {
  EMPTY: ['Add at least one SKU line.', 'Thêm ít nhất một dòng SKU.'], DUPLICATE_SKU: ['Each SKU may appear only once.', 'Mỗi SKU chỉ được xuất hiện một lần.'],
  MISSING_SKU: ['Select an active SKU for every line.', 'Chọn SKU đang hoạt động cho mọi dòng.'], INACTIVE_SKU: ['The selected SKU or product is inactive.', 'SKU hoặc sản phẩm đã chọn đang ngừng hoạt động.'],
  INVALID_QUANTITY: ['Quantity must be a positive whole number.', 'Số lượng phải là số nguyên dương.']
};

export function OutboundRequestDraft({ catalog, selectedSkuIds, recipient, en, disabled = false, onSubmit }: Props) {
  const [rows, setRows] = useState<(OutboundDraftRow & { key: number })[]>([{ key: 0, skuId: '', quantity: '' }]);
  const [nextKey, setNextKey] = useState(1);
  const [error, setError] = useState<OutboundDraftError | null>(null);
  const activeSkus = catalog?.skus.filter(sku => selectedSkuIds.includes(sku.id) && sku.status === 'active' && catalog.products.some(product => product.id === sku.productId && product.status === 'active')) ?? [];
  const update = (index: number, patch: Partial<OutboundDraftRow>) => setRows(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const submit = async () => { if (disabled || !catalog || !recipient || recipient.status !== 'active') return; const result = validateOutboundDraft(rows, catalog, selectedSkuIds); if (!result.ok) { setError(result.error); return; } setError(null); await onSubmit({ recipientId: recipient.id, observedRecipientVersion: recipient.version, requestedLines: result.requestedLines }); };
  return <section aria-label={en ? 'Outbound request' : 'Yêu cầu xuất kho'}><h2>{en ? 'Outbound request' : 'Yêu cầu xuất kho'}</h2>
    {rows.map((row, index) => <div key={row.key} className="op-actions"><label>{index === 0 ? 'SKU' : `${en ? 'SKU line' : 'Dòng SKU'} ${index + 1}`}<select value={row.skuId} disabled={disabled || !catalog} onChange={event => update(index, { skuId: event.target.value })}><option value="">{en ? 'Select SKU' : 'Chọn SKU'}</option>{activeSkus.map(sku => <option key={sku.id} value={sku.id}>{sku.code}</option>)}</select></label><label>{en ? `Quantity ${index + 1}` : `Số lượng ${index + 1}`}<input aria-label={en ? `Quantity ${index + 1}` : `Số lượng ${index + 1}`} type="number" min="1" step="1" value={row.quantity} disabled={disabled} onChange={event => update(index, { quantity: event.target.value })}/></label><Button type="button" disabled={disabled} aria-label={en ? `Remove SKU line ${index + 1}` : `Xóa dòng SKU ${index + 1}`} onClick={() => setRows(current => current.filter((_, rowIndex) => rowIndex !== index))}>{en ? 'Remove' : 'Xóa'}</Button></div>)}
    {error && <p role="alert">{en ? messages[error][0] : messages[error][1]}</p>}
    <div className="op-actions"><Button type="button" disabled={disabled} onClick={() => { setRows(current => [...current, { key: nextKey, skuId: '', quantity: '' }]); setNextKey(key => key + 1); setError(null); }}>{en ? 'Add SKU' : 'Thêm SKU'}</Button><Button type="button" disabled={disabled || !recipient || recipient.status !== 'active' || !catalog} onClick={() => void submit()}>{en ? 'Create request' : 'Tạo yêu cầu'}</Button></div>
  </section>;
}
