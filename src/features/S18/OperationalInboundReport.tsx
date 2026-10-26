import { ReadState } from '../../shared/ReadState';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Button, CatalogueNavTabs, DataTable, DateRangePicker, GlobalModal, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { vietnamDate } from '../../operations/operational-reports';
import { screenRegistry } from '../../app/registry';
import { type InboundOperationalReader, type OperationalInboundRow } from './inbound-binding';

import { createOperationalInboundDetailBinding } from './OperationalDetail';

export const INBOUND_BINDING_COPY = {
  'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.': 'Select a period within the last 90 days, ending no later than today.',
  'Chi tiết lần nhập': 'Receipt event details', 'Thông tin lần nhập · Chỉ xem': 'Receipt event information · Read only',
  'Xem chi tiết': 'View details', 'Thao tác': 'Actions', 'Đóng': 'Close', 'Mã sự kiện': 'Event ID',
  'Mã dòng nguồn': 'Source line ID', 'Mã vật lý': 'Physical IDs', 'Mã BOX': 'BOX ID', 'Người ghi sổ': 'Posted by',
  'Loại phiếu': 'Receipt type', 'Sản phẩm': 'Product', 'Linh kiện': 'Component', 'Trạng thái': 'Status', 'Đã ghi sổ': 'Posted',
  'Nguồn dữ liệu': 'Data source', 'Phiên hiện tại': 'Current session', 'Dữ liệu đã duyệt': 'Accepted data',
  'Nhập kho phiên hiện tại': 'Current session receipts', 'Kỳ báo cáo': 'Report period', 'Đọc lại dữ liệu': 'Refresh data',
  'Kỳ hiện tại': 'Current period', 'Đang đọc báo cáo…': 'Loading report…', 'Dữ liệu đọc lúc': 'Read at',
  'Báo cáo gồm các lần nhập đã ghi sổ trong kỳ theo giờ Việt Nam.': 'The report includes posted receipts within the period in Vietnam time.',
  'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.': 'No active session. Set it up in the testing area.',
  'Chưa có lần nhập đã ghi sổ trong kỳ.': 'No posted receipts in this period.', 'Phiếu đã ghi sổ': 'Posted receipts',
  'Tổng thực nhập theo SKU, kho và đơn vị': 'Received totals by SKU, warehouse and unit', 'SL thực nhập': 'Received quantity',
  'Mã phiếu': 'Receipt code', 'Ngày ghi sổ': 'Posted at', 'Nguồn nhập': 'Source', 'Tham chiếu': 'Reference', 'SKU': 'SKU', 'Tên hàng': 'Product name',
  'Kho': 'Warehouse', 'Đơn vị tính': 'Unit', 'Các lần nhập đã ghi sổ': 'Posted receipt events', 'Chứng từ liên quan': 'Related documents',
  'Phiếu nhập': 'Receipts', 'Tồn kho': 'Inventory', 'Sổ biến động': 'Stock ledger', 'Xuất Excel': 'Export Excel',
  'Đang xuất…': 'Exporting…', 'Đã tải báo cáo Excel.': 'Excel report downloaded.', 'Chưa thể xuất báo cáo. Đọc lại dữ liệu và thử lại.': 'Unable to export the report. Refresh data and try again.',
  'Xuất tất cả lần nhập trong kỳ đang hiển thị.': 'Export all receipt events in the displayed period.',
  'Chưa thể đọc dữ liệu. Đọc lại để kiểm tra.': 'Unable to read data. Refresh to check.',
  'Phiên hoặc dữ liệu đã thay đổi trong khi đọc. Vui lòng đọc lại.': 'The session or data changed while reading. Please refresh.',
  'Chưa thể xác minh đủ dữ liệu. Không hiển thị báo cáo chưa kiểm chứng.': 'The complete data could not be verified. Unverified reports are not displayed.',
  'Quyền đọc dữ liệu hiện không khả dụng.': 'Reading data is currently unavailable.', 'Kỳ báo cáo không hợp lệ. Chọn lại ngày bắt đầu và kết thúc.': 'Invalid report period. Select the start and end dates again.',
};
const route = (key: string) => screenRegistry.find(screen => screen.key === key)?.href;
const errorMessage = (code: string) => code === 'INVALID_PERIOD' ? 'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.'
  : ['COMMAND_UNAVAILABLE', 'SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN', 'CONFIRMATION_REQUIRED'].includes(code) ? 'Quyền đọc dữ liệu hiện không khả dụng.'
  : code === 'SNAPSHOT_CHANGED' ? 'Phiên hoặc dữ liệu đã thay đổi trong khi đọc. Vui lòng đọc lại.'
  : ['INCOMPLETE_POPULATION', 'CATALOG_LINK_UNAVAILABLE', 'AS_OF_BEFORE_SNAPSHOT', 'INVALID_BALANCE'].includes(code) ? 'Chưa thể xác minh đủ dữ liệu. Không hiển thị báo cáo chưa kiểm chứng.' : 'Chưa thể đọc dữ liệu. Đọc lại để kiểm tra.';
export function OperationalInboundReport({ adapter: supplied }: { adapter?: InboundOperationalReader }) {
  const tx = useUiCopy(INBOUND_BINDING_COPY);
  const { language } = useShellPreferences();
  const locale = localeForLanguage(language);
  const adapter = useMemo(() => supplied ?? createOperationalWebAdapter(undefined, { scope: 'S18' }), [supplied]);
  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createOperationalInboundDetailBinding(adapter, () => catalog.readSnapshot()); }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot), model = state.model;
  const [exporting, setExporting] = useState(false), [exportFeedback, setExportFeedback] = useState('');
  const exportOperation = useRef(0), detailReturn = useRef<HTMLElement>(null);
  const detail = state.detail?.model === model && !state.busy && !state.error ? state.detail : null;
  useEffect(() => { ++exportOperation.current; setExporting(false); setExportFeedback(''); return () => { ++exportOperation.current; }; }, [model]);
  const today = vietnamDate(new Date().toISOString()), period = state.period ?? { from: today, to: today };
  useEffect(() => { void controller.resume(); const refresh = () => { if (document.visibilityState === 'visible') void controller.resume(); };
    const visibility = () => { if (document.visibilityState === 'visible') refresh(); else controller.suspend(); };
    window.addEventListener('focus', refresh); window.addEventListener('storage', refresh); document.addEventListener('visibilitychange', visibility);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); window.removeEventListener('storage', refresh); document.removeEventListener('visibilitychange', visibility); };
  }, [controller]);
  async function download() {
    if (exporting || state.busy || !model) return;
    const operation = ++exportOperation.current; setExporting(true); setExportFeedback('');
    try {
      const accepted = await controller.exportPinned();
      if (operation !== exportOperation.current) return;
      const url = URL.createObjectURL(new Blob([accepted.bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a'); link.href = url; link.download = `HoaNam_S18_${accepted.report.query.from}_${accepted.report.query.to}.xlsx`; link.hidden = true;
      document.body.append(link); try { link.click(); } finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60_000); }
      setExportFeedback('Đã tải báo cáo Excel.');
    } catch (error) { if (operation === exportOperation.current) setExportFeedback((error as { code?: string })?.code === 'INVALID_PERIOD' ? errorMessage('INVALID_PERIOD') : 'Chưa thể xuất báo cáo. Đọc lại dữ liệu và thử lại.'); }
    finally { if (operation === exportOperation.current) setExporting(false); }
  }
  const columns: TableColumn<OperationalInboundRow>[] = [
    { id: 'receipt', heading: tx('Mã phiếu'), render: row => <strong data-inbound-receipt-id={row.receiptId}>{row.receiptCode}</strong> },
    { id: 'date', heading: tx('Ngày ghi sổ'), render: row => <time dateTime={row.committedAt}>{new Date(row.committedAt).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })}</time> },
    { id: 'source', heading: tx('Nguồn nhập'), render: row => row.sourceText },
    { id: 'reference', heading: tx('Tham chiếu'), render: row => row.referenceText || '—' },
    { id: 'sku', heading: tx('SKU'), render: row => <span data-inbound-sku-id={row.skuId}>{row.skuCode}</span> },
    { id: 'name', heading: tx('Tên hàng'), render: row => row.productName },
    { id: 'warehouse', heading: tx('Kho'), render: row => row.warehouseId },
    { id: 'quantity', heading: tx('SL thực nhập'), align: 'end', render: row => <span data-inbound-event-id={row.eventId}>{row.quantity} {tx(row.unit)}</span> },
    { id: 'detail', heading: tx('Thao tác'), render: row => <Button variant="ghost" data-inbound-detail-event-id={row.eventId} aria-label={`${tx('Xem chi tiết')} · ${row.receiptCode} · ${row.sourceLineId}`} onClick={() => { if (model) controller.openDetail(row.eventId, model); }}>{tx('Xem chi tiết')}</Button> },
  ];
  return <section className="s18-operational hn-premium-panel" data-operational-inbound ref={detailReturn} tabIndex={-1} aria-label={tx('Nhập kho phiên hiện tại')}>
    <div className="s18-operational-controls"><h2>{tx('Nhập kho phiên hiện tại')}</h2><DateRangePicker id="s18-operational-period" label={tx('Kỳ báo cáo')} value={period} clearable={false} onChange={value => { if (value) void controller.load(value); }} /><Button variant="secondary" disabled={state.busy} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button><Button variant="ghost" disabled={state.busy} onClick={() => void controller.resetPeriod()}>{tx('Kỳ hiện tại')}</Button></div>
    <ReadState loading={state.busy} error={state.error} hasData={!!model} loadingText={tx('Đang đọc báo cáo…')} errorText={tx(errorMessage(state.error))}/>
    <p>{tx('Báo cáo gồm các lần nhập đã ghi sổ trong kỳ theo giờ Việt Nam.')}</p>
    {model && <p>{tx('Dữ liệu đọc lúc')}: <time dateTime={model.report.query.asOf}>{new Date(model.report.query.asOf).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })}</time></p>}
    {model && !model.hasScenario && <p>{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.')}</p>}
    {model?.hasScenario && <>
      <p>{tx('Phiếu đã ghi sổ')}: <strong>{model.receiptCount}</strong></p>
      <DataTable caption={tx('Tổng thực nhập theo SKU, kho và đơn vị')} rows={model.totals} rowKey={row => row.key} columns={[
        { id: 'sku', heading: tx('SKU'), render: row => row.skuCode }, { id: 'warehouse', heading: tx('Kho'), render: row => row.warehouseId },
        { id: 'quantity', heading: tx('SL thực nhập'), align: 'end', render: row => row.quantity }, { id: 'unit', heading: tx('Đơn vị tính'), render: row => tx(row.unit) },
      ]} emptyContent={<p>{tx('Chưa có lần nhập đã ghi sổ trong kỳ.')}</p>} />
      <DataTable caption={tx('Các lần nhập đã ghi sổ')} rows={model.rows} rowKey={row => row.eventId} columns={columns} appearance="refined" emptyContent={<p>{tx('Chưa có lần nhập đã ghi sổ trong kỳ.')}</p>} />
    </>}
    <div className="s18-operational-controls"><Button variant="secondary" disabled={!model || state.busy || exporting} onClick={() => void download()} title={tx('Xuất tất cả lần nhập trong kỳ đang hiển thị.')}>{tx(exporting ? 'Đang xuất…' : 'Xuất Excel')}</Button>{exportFeedback && <p role="status">{tx(exportFeedback)}</p>}</div>
    <GlobalModal open={detail !== null} title={tx('Chi tiết lần nhập')} description={tx('Thông tin lần nhập · Chỉ xem')}
      onClose={controller.closeDetail} closeLabel={tx('Đóng')} resolveReturnFocus={() => detailReturn.current}
      footer={<><Button variant="secondary" disabled={state.busy} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button><Button onClick={controller.closeDetail}>{tx('Đóng')}</Button></>}>
      {detail && <dl data-inbound-detail data-inbound-event-id={detail.row.eventId}>
        <dt>{tx('Mã phiếu')}</dt><dd>{detail.row.receiptCode}</dd>
        <dt>{tx('Ngày ghi sổ')}</dt><dd><time dateTime={detail.row.committedAt}>{new Date(detail.row.committedAt).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })}</time></dd>
        <dt>{tx('Nguồn nhập')}</dt><dd>{detail.row.sourceText}</dd>
        <dt>{tx('Tham chiếu')}</dt><dd>{detail.row.referenceText || '—'}</dd>
        <dt>{tx('SKU')}</dt><dd>{detail.row.skuCode}</dd>
        <dt>{tx('Tên hàng')}</dt><dd>{detail.row.productName}</dd>
        <dt>{tx('Kho')}</dt><dd>{detail.row.warehouseId}</dd>
        <dt>{tx('SL thực nhập')}</dt><dd>{detail.row.quantity} {tx(detail.row.unit)}</dd>
        <dt>{tx('Loại phiếu')}</dt><dd>{tx(detail.receipt.data.mode === 'PRODUCT' ? 'Sản phẩm' : 'Linh kiện')}</dd>
        <dt>{tx('Trạng thái')}</dt><dd>{tx('Đã ghi sổ')}</dd>
        <dt>{tx('Mã sự kiện')}</dt><dd>{detail.event.id}</dd>
        <dt>{tx('Mã dòng nguồn')}</dt><dd>{detail.event.data.sourceLineId}</dd>
        <dt>{tx('Mã vật lý')}</dt><dd>{detail.event.data.physicalIds.join(', ') || '—'}</dd>
        <dt>{tx('Mã BOX')}</dt><dd>{detail.event.data.boxId || '—'}</dd>
        <dt>{tx('Người ghi sổ')}</dt><dd>{detail.event.data.actor}</dd>
      </dl>}
    </GlobalModal>
    <CatalogueNavTabs label={tx('Chứng từ liên quan')} items={[{ key: 'receipts', label: tx('Phiếu nhập'), href: route('S12') }, { key: 'inventory', label: tx('Tồn kho'), href: route('S16') }, { key: 'ledger', label: tx('Sổ biến động'), href: route('S20') }]} />
  </section>;
}
