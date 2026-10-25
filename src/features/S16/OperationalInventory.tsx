import { PageState } from '../../shared/PageState';
import { ReadState } from '../../shared/ReadState';
import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { FormField, FilterInput, Button, CatalogueNavTabs, DataTable, GlobalModal, Icon, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { screenRegistry } from '../../app/registry';
import { createOperationalInventoryBinding, resolveInventorySelection, type InventoryOperationalReader, type InventorySelection, type OperationalInventoryRow } from './inventory-binding';

export const INVENTORY_BINDING_COPY = {
  'Nguồn dữ liệu': 'Data source', 'Phiên hiện tại': 'Current session', 'Dữ liệu đã duyệt': 'Accepted data',
  'Tồn kho phiên hiện tại': 'Current session inventory', 'Đọc lại dữ liệu': 'Refresh data', 'Đang đọc dữ liệu…': 'Loading data…',
  'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.': 'No active session. Set it up in the testing area.',
  'Chưa có biến động tồn kho trong phiên hiện tại.': 'No stock movements in the current session.',
  'Số liệu sẽ xuất hiện sau khi có giao dịch đã ghi sổ trong phiên này.': 'Figures will appear after a posted transaction is recorded in this session.',
  'Tồn theo sổ cái': 'Ledger stock', 'Kiểm đếm thực tế': 'Physical count', 'Chênh lệch': 'Difference', 'Chưa xác định': 'Unknown',
  'SKU': 'SKU', 'Tên hàng': 'Product name', 'Kho': 'Warehouse', 'Đơn vị tính': 'Unit', 'Thao tác': 'Actions', 'Xem': 'View', 'Đóng': 'Close',
  'Chưa có dữ liệu kiểm đếm thực tế; chưa thể tính chênh lệch.': 'No physical count data is available; the difference cannot be calculated.',
  'Số liệu theo sổ cái từ các giao dịch đã ghi sổ, không bao gồm phiếu nháp.': 'Ledger quantities include posted transactions only, excluding drafts.',
  'Dữ liệu đọc lúc': 'Read at', 'Tìm SKU hoặc tên hàng': 'Search SKU or product name', 'Không có dòng phù hợp.': 'No matching rows.',
  'Chi tiết tồn kho': 'Inventory details', 'Biến động của mặt hàng': 'Item stock movements', 'Chứng từ': 'Document', 'Loại biến động': 'Movement type',
  'Thời điểm ghi sổ': 'Posted at', 'Số lượng tăng / giảm': 'Signed quantity', 'Nhập kho': 'Receipt', 'Xuất kho': 'Outbound', 'Xuất linh kiện': 'Parts issue', 'Đảo tồn': 'Reversal',
  'Chứng từ liên quan': 'Related documents', 'Phiếu nhập': 'Receipts', 'Phiếu xuất kho': 'Outbounds', 'Phiếu xuất linh kiện': 'Parts issues', 'Phiếu đảo tồn': 'Reversals',
  'Dòng tồn không còn thuộc phiên hiện tại. Đóng và chọn lại từ danh sách.': 'This stock row is no longer in the current session. Close and select it again.',
  'Chưa thể đọc dữ liệu. Đọc lại để kiểm tra.': 'Unable to read data. Refresh to check.',
  'Phiên hoặc dữ liệu đã thay đổi trong khi đọc. Vui lòng đọc lại.': 'The session or data changed while reading. Please refresh.',
  'Chưa thể xác minh đủ dữ liệu. Không hiển thị số tồn chưa kiểm chứng.': 'The complete data could not be verified. Unverified balances are not displayed.',
  'Quyền đọc dữ liệu hiện không khả dụng.': 'Reading data is currently unavailable.',
};
const EVENT_LABEL = { RECEIPT_POST: 'Nhập kho', OUTBOUND_POST: 'Xuất kho', PARTS_ISSUE_POST: 'Xuất linh kiện', REVERSAL_POST: 'Đảo tồn' } as const;
const route = (key: string) => screenRegistry.find(screen => screen.key === key)?.href;
const errorMessage = (code: string) => ['COMMAND_UNAVAILABLE', 'SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN', 'CONFIRMATION_REQUIRED'].includes(code) ? 'Quyền đọc dữ liệu hiện không khả dụng.'
  : code === 'SNAPSHOT_CHANGED' ? 'Phiên hoặc dữ liệu đã thay đổi trong khi đọc. Vui lòng đọc lại.'
  : ['INCOMPLETE_POPULATION', 'CATALOG_LINK_UNAVAILABLE', 'AS_OF_BEFORE_SNAPSHOT'].includes(code) ? 'Chưa thể xác minh đủ dữ liệu. Không hiển thị số tồn chưa kiểm chứng.' : 'Chưa thể đọc dữ liệu. Đọc lại để kiểm tra.';
export function OperationalInventory({ adapter: supplied }: { adapter?: InventoryOperationalReader }) {
  const tx = useUiCopy(INVENTORY_BINDING_COPY);
  const { language } = useShellPreferences();
  const locale = localeForLanguage(language);
  const adapter = useMemo(() => supplied ?? createOperationalWebAdapter(undefined, { scope: 'S16' }), [supplied]);
  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createOperationalInventoryBinding(adapter, () => catalog.readSnapshot()); }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [selection, setSelection] = useState<InventorySelection | null>(null), [search, setSearch] = useState('');
  const panel = useRef<HTMLElement>(null), returnSelection = useRef<InventorySelection | null>(null);
  const model = state.model, selected = resolveInventorySelection(model, selection);
  function resolveDetailReturnFocus() {
    const root = panel.current;
    if (!root) return null;
    // A refresh replaces the table and its opener. Resolve the same row only
    // within its original dataset; failed reads or a new session use a stable fallback.
    const row = resolveInventorySelection(model, returnSelection.current);
    const action = row ? [...root.querySelectorAll<HTMLElement>('[data-s16-operational-action]')]
      .find(element => element.getAttribute('data-s16-operational-action') === row.key) : null;
    return action ?? root.querySelector<HTMLElement>('[data-s16-operational-search]')
      ?? root.querySelector<HTMLElement>('[data-s16-operational-heading]');
  }
  useEffect(() => { void controller.resume(); const refresh = () => { if (document.visibilityState === 'visible') void controller.load(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  const feedback = <><ReadState loading={state.busy} error={state.error} hasData={!!model} loadingText={tx('Đang đọc dữ liệu…')} errorText={tx(errorMessage(state.error))}/></>;
  const rows = model?.rows.filter(row => `${row.skuCode} ${row.productName}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) ?? [];
  const columns: TableColumn<OperationalInventoryRow>[] = [
    { id: 'sku', heading: tx('SKU'), render: row => <strong>{row.skuCode}</strong> },
    { id: 'name', heading: tx('Tên hàng'), render: row => row.productName },
    { id: 'warehouse', heading: tx('Kho'), render: row => row.warehouseId },
    { id: 'ledger', heading: tx('Tồn theo sổ cái'), render: row => <span data-inventory-quantity={row.quantity}>{row.quantity} {tx(row.unit)}</span> },
    { id: 'actual', heading: tx('Kiểm đếm thực tế'), render: () => tx('Chưa xác định') },
    { id: 'difference', heading: tx('Chênh lệch'), render: () => tx('Chưa xác định') },
    { id: 'actions', heading: tx('Thao tác'), kind: 'actions', render: row => <Button variant="ghost" data-s16-operational-action={row.key} onClick={() => { if (model) { returnSelection.current = { key: row.key, ...model.report.token }; setSelection(returnSelection.current); } }}>{tx('Xem')}</Button> },
  ];
  const events = model && selected ? model.report.events.filter(event => event.data.skuId === selected.skuId && event.data.warehouseId === selected.warehouseId && event.data.unit === selected.unit) : [];
  const documents = model ? [...model.report.receipts, ...model.report.outbounds, ...model.report.partsIssues, ...model.report.reversals] : [];
  return <section ref={panel} className="s16-operational hn-premium-panel" data-operational-inventory aria-label={tx('Tồn kho phiên hiện tại')}>
    <div className="s16-operational-controls"><h2 tabIndex={-1} data-s16-operational-heading>{tx('Tồn kho phiên hiện tại')}</h2><Button variant="secondary" disabled={state.busy} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button></div>
    {feedback}<p>{tx('Số liệu theo sổ cái từ các giao dịch đã ghi sổ, không bao gồm phiếu nháp.')}</p><p>{tx('Chưa có dữ liệu kiểm đếm thực tế; chưa thể tính chênh lệch.')}</p>
    {model && <p>{tx('Dữ liệu đọc lúc')}: <time dateTime={model.report.query.asOf}>{new Date(model.report.query.asOf).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })}</time></p>}
    {model && !model.hasScenario && <p>{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.')}</p>}
    {model?.hasScenario && (model.rows.length ? <><FormField label={tx('Tìm SKU hoặc tên hàng')} className="hn-operational-search"><FilterInput id="s16-operational-search" label={tx('Tìm SKU hoặc tên hàng')} aria-label={tx('Tìm SKU hoặc tên hàng')} data-s16-operational-search value={search} onChange={event => setSearch(event.target.value)} /></FormField><DataTable caption={tx('Tồn kho phiên hiện tại')} captionVisibility="sr-only" rows={rows} columns={columns} rowKey={row => row.key} appearance="refined" emptyContent={<p>{tx('Không có dòng phù hợp.')}</p>} /></> : <PageState kind="empty" title={tx('Chưa có biến động tồn kho trong phiên hiện tại.')} description={tx('Số liệu sẽ xuất hiện sau khi có giao dịch đã ghi sổ trong phiên này.')} action={<Button disabled={state.busy} onClick={()=>void controller.load()}>{tx('Đọc lại dữ liệu')}</Button>}/>)}
    <CatalogueNavTabs label={tx('Chứng từ liên quan')} items={[
      { key: 'receipts', label: tx('Phiếu nhập'), href: route('S12') }, { key: 'outbounds', label: tx('Phiếu xuất kho'), href: route('S15') },
      { key: 'parts', label: tx('Phiếu xuất linh kiện'), href: route('S10') }, { key: 'reversals', label: tx('Phiếu đảo tồn'), href: route('S17') },
    ]} />
    <GlobalModal open={!!selection} title={tx('Chi tiết tồn kho')} onClose={() => setSelection(null)} resolveReturnFocus={resolveDetailReturnFocus} size="large" footer={<><div className="hn-modal-footer-tools"><Button variant="secondary" disabled={state.busy} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button></div><Button onClick={() => setSelection(null)}>{tx('Đóng')}</Button></>}>
      {feedback}
      {!selected || !model ? !state.busy && !state.error && <p>{tx('Dòng tồn không còn thuộc phiên hiện tại. Đóng và chọn lại từ danh sách.')}</p> : <>
        <dl className="s16-operational-fields" data-inventory-sku-id={selected.skuId}><div><dt>{tx('SKU')}</dt><dd>{selected.skuCode}</dd></div><div><dt>{tx('Tên hàng')}</dt><dd>{selected.productName}</dd></div><div><dt>{tx('Kho')}</dt><dd>{selected.warehouseId}</dd></div><div><dt>{tx('Tồn theo sổ cái')}</dt><dd>{selected.quantity} {tx(selected.unit)}</dd></div><div><dt>{tx('Kiểm đếm thực tế')}</dt><dd>{tx('Chưa xác định')}</dd></div><div><dt>{tx('Chênh lệch')}</dt><dd>{tx('Chưa xác định')}</dd></div></dl>
        <p>{tx('Chưa có dữ liệu kiểm đếm thực tế; chưa thể tính chênh lệch.')}</p>
        <DataTable caption={tx('Biến động của mặt hàng')} rows={events} rowKey={row => row.id} columns={[
          { id: 'document', heading: tx('Chứng từ'), render: event => documents.find(d => d.id === event.data.documentId)?.data.code ?? '—' },
          { id: 'kind', heading: tx('Loại biến động'), render: event => tx(EVENT_LABEL[event.data.eventType]) },
          { id: 'quantity', heading: tx('Số lượng tăng / giảm'), render: event => `${event.data.signedQuantity > 0 ? '+' : ''}${event.data.signedQuantity} ${tx(event.data.unit)}` },
          { id: 'time', heading: tx('Thời điểm ghi sổ'), render: event => <time dateTime={event.data.committedAt}>{new Date(event.data.committedAt).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })}</time> },
        ]} />
      </>}
    </GlobalModal>
  </section>;
}
