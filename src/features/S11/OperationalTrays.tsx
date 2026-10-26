import { formatBusinessTimestamp } from '../../i18n/format-business-timestamp';
import { ReadState } from '../../shared/ReadState';
import { useShellPreferences } from '../../shared/shell-preferences';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { FormField, FilterInput, Button, CatalogueNavTabs, DataTable, GlobalModal, Icon, StatusBadge, type TableColumn } from '../../shared';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { screenRegistry } from '../../app/registry';
import { createTrayBinding, resolveTraySelection, type OperationalTrayRow, type TrayBoxRow, type TrayReader, type TraySelection } from './tray-binding';

export const OPERATIONAL_TRAYS_COPY = {
  'Nguồn dữ liệu': 'Data source', 'Phiên hiện tại': 'Current session', 'Dữ liệu đã duyệt': 'Accepted data', 'Khay và BOX hiện tại': 'Current trays and BOXes',
  'Đọc lại dữ liệu': 'Refresh data', 'Đang đọc dữ liệu…': 'Loading data…', 'Chưa thể đọc dữ liệu khay. Đọc lại để kiểm tra.': 'Unable to read trays. Refresh to check.',
  'Phiên hoặc dữ liệu đã thay đổi. Đọc lại để kiểm tra.': 'The session or data changed. Refresh to check.', 'Chưa thể xác minh đủ dữ liệu khay và BOX liên kết.': 'Complete tray data and BOX links could not be verified.',
  'Danh sách gồm khay đã thiết lập và BOX đang thuộc khay. Chỉ xác nhận xếp khay mới thay đổi vị trí BOX.': 'The list contains configured trays and their current BOX membership. Only confirmed putaway changes a BOX location.',
  'Tồn BOX theo bút toán hiện tại, không phải số lượng lúc tạo lệnh. Mỗi BOX giữ đơn vị tính riêng.': 'BOX stock follows current entries, not quantity at order creation. Each BOX retains its own unit.',
  'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.': 'No active session. Set it up in the testing area.', 'Chưa có khay được thiết lập.': 'No configured trays.',
  'Mã khay': 'Tray code', 'Vị trí': 'Location', 'Trạng thái khay': 'Tray status', 'Trạng thái vị trí': 'Location status', 'Hoạt động': 'Active', 'Ngừng hoạt động': 'Inactive',
  'Số BOX': 'BOX count', 'Số SKU': 'Distinct SKU count', 'Xác nhận xếp khay gần nhất': 'Latest putaway confirmation', 'Chưa có xác nhận': 'No confirmations',
  'Chi tiết': 'Details', 'Chi tiết khay': 'Tray details', 'Đóng': 'Close', 'Khay không còn thuộc phiên đã chọn. Đóng và chọn lại từ danh sách.': 'This tray is no longer in the selected session. Close and select it again.',
  'Tìm mã khay': 'Search tray code', 'Không có khay phù hợp.': 'No matching trays.', 'Dữ liệu đọc lúc': 'Read at', 'Khay đã thiết lập': 'Configured trays', 'BOX đang thuộc khay': 'BOXes assigned to trays',
  'BOX': 'BOX', 'SKU / Sản phẩm': 'SKU / Product', 'Phiếu nhập nguồn': 'Source receipt', 'Tồn hiện tại': 'Current stock', 'Đơn vị tính': 'Unit',
  'BOX trong khay': 'BOXes in tray', 'Khay hiện chưa có BOX.': 'This tray currently has no BOXes.', 'Chứng từ liên quan': 'Related documents', 'Phiếu nhập': 'Receipts', 'Lệnh xếp khay': 'Putaway orders', 'Truy vết': 'Trace',
};
const errorMessage = (code: string) => code === 'SNAPSHOT_CHANGED' ? 'Phiên hoặc dữ liệu đã thay đổi. Đọc lại để kiểm tra.' : ['INCOMPLETE_POPULATION', 'CATALOG_LINK_UNAVAILABLE', 'TRAY_LINK_UNAVAILABLE', 'AS_OF_BEFORE_SNAPSHOT'].includes(code) ? 'Chưa thể xác minh đủ dữ liệu khay và BOX liên kết.' : 'Chưa thể đọc dữ liệu khay. Đọc lại để kiểm tra.';

export function OperationalTrays({ adapter }: { adapter: TrayReader }) {
  const tx = useUiCopy(OPERATIONAL_TRAYS_COPY);
  const { language } = useShellPreferences();

  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createTrayBinding(adapter, () => catalog.readSnapshot()); }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [selection, setSelection] = useState<TraySelection | null>(null), [search, setSearch] = useState('');
  useEffect(() => { void controller.resume(); const refresh = () => { if (document.visibilityState === 'visible') void controller.load(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  const model = state.model, selected = resolveTraySelection(model, selection);
  const time = (value: string) => formatBusinessTimestamp(value, language);
  const panel = useRef<HTMLElement>(null), returnSelection = useRef<TraySelection | null>(null);
  const openDetail = (row: OperationalTrayRow) => { if (model) { returnSelection.current = { id: row.id, ...model.report.token }; setSelection(returnSelection.current); } };
  const detailAction = (row: OperationalTrayRow) => <Button variant="secondary" data-s11-operational-action={row.id} onClick={() => openDetail(row)}>{tx('Chi tiết')}<Icon name="chevron-right" size={18}/></Button>;
  function resolveDetailReturnFocus() {
    const row = resolveTraySelection(model, returnSelection.current);
    return (row && [...(panel.current?.querySelectorAll<HTMLElement>('[data-s11-operational-action]') ?? [])].find(element => element.getAttribute('data-s11-operational-action') === row.id && element.getClientRects().length > 0)) || panel.current?.querySelector<HTMLElement>('#s11-operational-search') || panel.current?.querySelector<HTMLElement>('h2') || null;
  }
  const feedback = <><ReadState loading={state.busy} error={state.error} hasData={!!model} loadingText={tx('Đang đọc dữ liệu…')} errorText={tx(errorMessage(state.error))}/></>;
  const columns: TableColumn<OperationalTrayRow>[] = [
    { id: 'code', heading: tx('Mã khay'), render: row => <strong data-tray-id={row.id}>{row.code}</strong> },
    { id: 'location', heading: tx('Vị trí'), render: row => <span data-location-id={row.locationId}>{row.locationCode}</span> },
    { id: 'active', heading: tx('Trạng thái khay'), render: row => <StatusBadge tone={row.active ? 'success' : 'neutral'}>{tx(row.active ? 'Hoạt động' : 'Ngừng hoạt động')}</StatusBadge> },
    { id: 'boxes', heading: tx('Số BOX'), align: 'end', render: row => row.boxCount }, { id: 'skus', heading: tx('Số SKU'), align: 'end', render: row => row.skuCount },
    { id: 'confirmed', heading: tx('Xác nhận xếp khay gần nhất'), render: row => row.lastConfirmedAt ? <time dateTime={row.lastConfirmedAt}>{time(row.lastConfirmedAt)}</time> : tx('Chưa có xác nhận') },
    { id: 'actions', heading: tx('Chi tiết'), kind: 'actions', render: detailAction },
  ];
  const boxColumns: TableColumn<TrayBoxRow>[] = [
    { id: 'box', heading: tx('BOX'), render: row => <strong data-box-id={row.id}>{row.code}</strong> },
    { id: 'sku', heading: tx('SKU / Sản phẩm'), render: row => <div className="s11-operational-cell" data-sku-id={row.skuId} data-product-id={row.productId}><strong>{row.skuCode}</strong><span>{row.productName}</span></div> },
    { id: 'receipt', heading: tx('Phiếu nhập nguồn'), render: row => <span data-source-receipt-id={row.receiptId} data-source-line-id={row.sourceLineId}>{row.receiptCode}</span> },
    { id: 'quantity', heading: tx('Tồn hiện tại'), align: 'end', render: row => row.quantity }, { id: 'unit', heading: tx('Đơn vị tính'), render: row => tx(row.unit) },
    { id: 'confirmed', heading: tx('Xác nhận xếp khay gần nhất'), render: row => <time dateTime={row.confirmedAt} data-putaway-id={row.putawayId}>{time(row.confirmedAt)}</time> },
  ];
  const rows = model?.rows.filter(row => row.code.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) ?? [];
  return <section ref={panel} className="s11-operational hn-premium-panel" data-operational-trays aria-label={tx('Khay và BOX hiện tại')}>
    <div className="s11-operational-controls"><h2 tabIndex={-1}>{tx('Khay và BOX hiện tại')}</h2><Button variant="secondary" disabled={state.busy} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button></div>{feedback}
    <p>{tx('Danh sách gồm khay đã thiết lập và BOX đang thuộc khay. Chỉ xác nhận xếp khay mới thay đổi vị trí BOX.')}</p>
    {model && <><p>{tx('Dữ liệu đọc lúc')}: <time dateTime={model.report.query.asOf}>{time(model.report.query.asOf)}</time> · {tx('Khay đã thiết lập')}: {model.rows.length} · {tx('BOX đang thuộc khay')}: {model.rows.reduce((count, row) => count + row.boxCount, 0)}</p>
      {!model.hasScenario && <p>{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.')}</p>}
      <FormField label={tx('Tìm mã khay')} className="hn-operational-search hn-operational-search--spaced"><FilterInput id="s11-operational-search" label={tx('Tìm mã khay')} aria-label={tx('Tìm mã khay')} value={search} onChange={event => setSearch(event.target.value)} /></FormField><div className="s11-lookup-cards">{rows.length ? rows.map(row => <article className="s11-lookup-card" key={row.id}>
        <header><h3>{row.code}</h3><StatusBadge tone={row.active ? 'success' : 'neutral'}>{tx(row.active ? 'Hoạt động' : 'Ngừng hoạt động')}</StatusBadge></header>
        <dl><div className="s11-lookup-wide"><dt>{tx('Vị trí')}</dt><dd>{row.locationCode}</dd></div><div><dt>{tx('Số BOX')}</dt><dd>{row.boxCount}</dd></div><div><dt>{tx('Số SKU')}</dt><dd>{row.skuCount}</dd></div><div className="s11-lookup-wide"><dt>{tx('Xác nhận xếp khay gần nhất')}</dt><dd>{row.lastConfirmedAt ? <time dateTime={row.lastConfirmedAt}>{time(row.lastConfirmedAt)}</time> : tx('Chưa có xác nhận')}</dd></div></dl>{detailAction(row)}
      </article>) : <p>{tx(model.rows.length ? 'Không có khay phù hợp.' : 'Chưa có khay được thiết lập.')}</p>}</div><div className="s11-lookup-table"><DataTable stickyEndColumnIds={['actions']} caption={tx('Khay và BOX hiện tại')} captionVisibility="sr-only" rows={rows} columns={columns} rowKey={row => row.id} appearance="refined" emptyContent={<p>{tx(model.rows.length ? 'Không có khay phù hợp.' : 'Chưa có khay được thiết lập.')}</p>} /></div>
    </>}
    <CatalogueNavTabs label={tx('Chứng từ liên quan')} items={([['S12', 'Phiếu nhập'], ['S14', 'Lệnh xếp khay'], ['S26', 'Truy vết']] as const).map(([key, label]) => ({ key, label: tx(label), href: screenRegistry.find(screen => screen.key === key)?.href }))} />
    <GlobalModal className="s11-lookup-dialog" resolveReturnFocus={resolveDetailReturnFocus} open={!!selection} title={tx('Chi tiết khay')} onClose={() => setSelection(null)} size="large" footer={<><div className="hn-modal-footer-tools"><Button variant="secondary" disabled={state.busy} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button></div><Button onClick={() => setSelection(null)}>{tx('Đóng')}</Button></>}>
      {feedback}
      {!selected ? !state.busy && !state.error && <p>{tx('Khay không còn thuộc phiên đã chọn. Đóng và chọn lại từ danh sách.')}</p> : <><dl className="s11-detail__fields" data-tray-id={selected.id}><div><dt>{tx('Mã khay')}</dt><dd>{selected.code}</dd></div><div><dt>{tx('Vị trí')}</dt><dd data-location-id={selected.locationId}>{selected.locationCode}</dd></div><div><dt>{tx('Trạng thái khay')}</dt><dd>{tx(selected.active ? 'Hoạt động' : 'Ngừng hoạt động')}</dd></div><div><dt>{tx('Trạng thái vị trí')}</dt><dd>{tx(selected.locationActive ? 'Hoạt động' : 'Ngừng hoạt động')}</dd></div><div><dt>{tx('Số BOX')}</dt><dd>{selected.boxCount}</dd></div><div><dt>{tx('Số SKU')}</dt><dd>{selected.skuCount}</dd></div></dl><p>{tx('Tồn BOX theo bút toán hiện tại, không phải số lượng lúc tạo lệnh. Mỗi BOX giữ đơn vị tính riêng.')}</p><div className="s11-lookup-cards"><h3>{tx('BOX trong khay')}</h3>{selected.boxes.length ? selected.boxes.map(row => <article className="s11-lookup-card" key={row.id}><header><h3>{row.code}</h3></header><dl><div className="s11-lookup-wide"><dt>{tx('SKU / Sản phẩm')}</dt><dd>{row.skuCode}<span>{row.productName}</span></dd></div><div><dt>{tx('Phiếu nhập nguồn')}</dt><dd>{row.receiptCode}</dd></div><div><dt>{tx('Tồn hiện tại')}</dt><dd>{row.quantity} {tx(row.unit)}</dd></div><div className="s11-lookup-wide"><dt>{tx('Xác nhận xếp khay gần nhất')}</dt><dd>{time(row.confirmedAt)}</dd></div></dl></article>) : <p>{tx('Khay hiện chưa có BOX.')}</p>}</div><div className="s11-lookup-table"><DataTable caption={tx('BOX trong khay')} rows={selected.boxes} columns={boxColumns} rowKey={row => row.id} emptyContent={<p>{tx('Khay hiện chưa có BOX.')}</p>} /></div></>}
    </GlobalModal>
  </section>;
}
