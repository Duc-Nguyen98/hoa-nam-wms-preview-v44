import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Button, CatalogueNavTabs, DataTable, DateRangePicker, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { vietnamDate } from '../../operations/operational-reports';
import { screenRegistry } from '../../app/registry';
import { createOperationalOutboundBinding, type OutboundOperationalReader, type OperationalOutboundRow } from './outbound-binding';
import { OperationalOutboundDetail, OUTBOUND_DETAIL_COPY, selectOutboundDetail, resolveOutboundDetail, type OutboundDetailSelection } from './OperationalDetail';

export const OUTBOUND_BINDING_COPY = {
  'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.': 'Select a period within the last 90 days, ending no later than today.',
  ...OUTBOUND_DETAIL_COPY,
  'Nguồn dữ liệu': 'Data source', 'Phiên hiện tại': 'Current session', 'Dữ liệu đã duyệt': 'Accepted data',
  'Xuất kho phiên hiện tại': 'Current session outbounds', 'Kỳ báo cáo': 'Report period', 'Đọc lại dữ liệu': 'Refresh data',
  'Kỳ hiện tại': 'Current period', 'Đang đọc báo cáo…': 'Loading report…', 'Dữ liệu đọc lúc': 'Read at',
  'Báo cáo gồm các lần xuất đã ghi sổ trong kỳ theo giờ Việt Nam.': 'The report includes posted outbounds within the period in Vietnam time.',
  'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.': 'No active session. Set it up in the testing area.',
  'Chưa có lần xuất đã ghi sổ trong kỳ.': 'No posted outbounds in this period.', 'Phiếu đã ghi sổ': 'Posted outbounds',
  'Tổng thực xuất theo SKU, kho và đơn vị': 'Shipped totals by SKU, warehouse and unit', 'SL thực xuất': 'Shipped quantity',
  'Mã phiếu': 'Outbound code', 'Ngày ghi sổ': 'Posted at', 'Người nhận khi App gửi': 'Recipient at App submission', 'Loại người nhận': 'Recipient type', 'Thị trường': 'Market', 'Người ghi sổ': 'Posted by', 'SKU': 'SKU', 'Tên hàng': 'Product name',
  'Kho': 'Warehouse', 'Đơn vị tính': 'Unit', 'Các lần xuất đã ghi sổ': 'Posted outbound events', 'Chứng từ liên quan': 'Related documents',
  'Phiếu xuất': 'Outbounds', 'Tồn kho': 'Inventory', 'Sổ biến động': 'Stock ledger', 'Xuất Excel': 'Export Excel',
  'Đang xuất…': 'Exporting…', 'Đã tải báo cáo Excel.': 'Excel report downloaded.', 'Chưa thể xuất báo cáo. Đọc lại dữ liệu và thử lại.': 'Unable to export the report. Refresh data and try again.',
  'Xuất tất cả lần xuất trong kỳ đang hiển thị.': 'Export all outbound events in the displayed period.',
  'Chưa thể đọc dữ liệu. Đọc lại để kiểm tra.': 'Unable to read data. Refresh to check.',
  'Phiên hoặc dữ liệu đã thay đổi trong khi đọc. Vui lòng đọc lại.': 'The session or data changed while reading. Please refresh.',
  'Chưa thể xác minh đủ dữ liệu. Không hiển thị báo cáo chưa kiểm chứng.': 'The complete data could not be verified. Unverified reports are not displayed.',
  'Quyền đọc dữ liệu hiện không khả dụng.': 'Reading data is currently unavailable.', 'Kỳ báo cáo không hợp lệ. Chọn lại ngày bắt đầu và kết thúc.': 'Invalid report period. Select the start and end dates again.',
};
const route = (key: string) => screenRegistry.find(screen => screen.key === key)?.href;
const errorMessage = (code: string) => code === 'INVALID_PERIOD' ? 'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.'
  : ['COMMAND_UNAVAILABLE', 'SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN', 'CONFIRMATION_REQUIRED'].includes(code) ? 'Quyền đọc dữ liệu hiện không khả dụng.'
  : code === 'SNAPSHOT_CHANGED' ? 'Phiên hoặc dữ liệu đã thay đổi trong khi đọc. Vui lòng đọc lại.'
  : ['INCOMPLETE_POPULATION', 'CATALOG_LINK_UNAVAILABLE', 'RECIPIENT_SNAPSHOT_UNAVAILABLE', 'AS_OF_BEFORE_SNAPSHOT', 'INVALID_BALANCE'].includes(code) ? 'Chưa thể xác minh đủ dữ liệu. Không hiển thị báo cáo chưa kiểm chứng.' : 'Chưa thể đọc dữ liệu. Đọc lại để kiểm tra.';
export function OperationalOutboundReport({ adapter: supplied }: { adapter?: OutboundOperationalReader }) {
  const tx = useUiCopy(OUTBOUND_BINDING_COPY);
  const { language } = useShellPreferences();
  const locale = localeForLanguage(language);
  const adapter = useMemo(() => supplied ?? createOperationalWebAdapter(undefined, { scope: 'S19' }), [supplied]);
  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createOperationalOutboundBinding(adapter, () => catalog.readSnapshot()); }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot), model = state.model;
  const [selection, setSelection] = useState<OutboundDetailSelection | null>(null);
  const region = useRef<HTMLElement>(null), selectedEventId = useRef<string | null>(null);
  const detail = resolveOutboundDetail(state, selection);
  useEffect(() => { setSelection(null); }, [model]);
  const returnFocus = () => Array.from(region.current?.querySelectorAll<HTMLButtonElement>('[data-s19-detail-open]') ?? [])
    .find(button => button.dataset.s19DetailOpen === selectedEventId.current) ?? region.current;
  const [exporting, setExporting] = useState(false), [exportFeedback, setExportFeedback] = useState('');
  const exportOperation = useRef(0);
  useEffect(() => { ++exportOperation.current; setExporting(false); setExportFeedback(''); return () => { ++exportOperation.current; }; }, [model]);
  const today = vietnamDate(new Date().toISOString()), period = state.period ?? { from: today, to: today };
  useEffect(() => { void controller.resume(); const refresh = () => { if (document.visibilityState === 'visible') void controller.load(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  async function download() {
    if (exporting || state.busy || !model) return;
    const operation = ++exportOperation.current; setExporting(true); setExportFeedback('');
    try {
      const accepted = await controller.exportPinned();
      if (operation !== exportOperation.current) return;
      const url = URL.createObjectURL(new Blob([accepted.bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a'); link.href = url; link.download = `HoaNam_S19_${accepted.report.query.from}_${accepted.report.query.to}.xlsx`; link.hidden = true;
      document.body.append(link); try { link.click(); } finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60_000); }
      setExportFeedback('Đã tải báo cáo Excel.');
    } catch (error) { if (operation === exportOperation.current) setExportFeedback((error as { code?: string })?.code === 'INVALID_PERIOD' ? errorMessage('INVALID_PERIOD') : 'Chưa thể xuất báo cáo. Đọc lại dữ liệu và thử lại.'); }
    finally { if (operation === exportOperation.current) setExporting(false); }
  }
  const columns: TableColumn<OperationalOutboundRow>[] = [
    { id: 'outbound', heading: tx('Mã phiếu'), render: row => <Button variant="ghost" data-outbound-outbound-id={row.outboundId} data-s19-detail-open={row.eventId}
      aria-label={`${tx('Chi tiết')} ${row.outboundCode}`} onClick={() => {
        const current = controller.getSnapshot();
        if (current.model !== model) return;
        selectedEventId.current = row.eventId; setSelection(selectOutboundDetail(current, row.eventId));
      }}>{row.outboundCode}</Button> },
    { id: 'date', heading: tx('Ngày ghi sổ'), render: row => <time dateTime={row.committedAt}>{new Date(row.committedAt).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })}</time> },
    { id: 'recipient', heading: tx('Người nhận khi App gửi'), render: row => <span data-outbound-recipient-id={row.recipient.id}>{row.recipient.code} · {row.recipient.name}</span> },
    { id: 'type', heading: tx('Loại người nhận'), render: row => tx(row.recipient.type) },
    { id: 'market', heading: tx('Thị trường'), render: row => tx(row.recipient.market) },
    { id: 'sku', heading: tx('SKU'), render: row => <span data-outbound-sku-id={row.skuId}>{row.skuCode}</span> },
    { id: 'name', heading: tx('Tên hàng'), render: row => row.productName },
    { id: 'warehouse', heading: tx('Kho'), render: row => row.warehouseId },
    { id: 'quantity', heading: tx('SL thực xuất'), align: 'end', render: row => <span data-outbound-event-id={row.eventId}>{row.quantity} {tx(row.unit)}</span> },
    { id: 'actor', heading: tx('Người ghi sổ'), render: row => row.actor },
  ];
  return <section ref={region} tabIndex={-1} className="s19-operational hn-premium-panel" data-operational-outbound aria-label={tx('Xuất kho phiên hiện tại')}>
    <div className="s19-operational-controls"><h2>{tx('Xuất kho phiên hiện tại')}</h2><DateRangePicker id="s19-operational-period" label={tx('Kỳ báo cáo')} value={period} clearable={false} onChange={value => { if (value) void controller.load(value); }} /><Button variant="secondary" disabled={state.busy} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button><Button variant="ghost" disabled={state.busy} onClick={() => void controller.resetPeriod()}>{tx('Kỳ hiện tại')}</Button></div>
    {state.busy && <p role="status">{tx('Đang đọc báo cáo…')}</p>}{state.error && <p role="alert">{tx(errorMessage(state.error))}</p>}
    <p>{tx('Báo cáo gồm các lần xuất đã ghi sổ trong kỳ theo giờ Việt Nam.')}</p>
    {model && <p>{tx('Dữ liệu đọc lúc')}: <time dateTime={model.report.query.asOf}>{new Date(model.report.query.asOf).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })}</time></p>}
    {model && !model.hasScenario && <p>{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.')}</p>}
    {model?.hasScenario && <>
      <p>{tx('Phiếu đã ghi sổ')}: <strong>{model.outboundCount}</strong></p>
      <DataTable caption={tx('Tổng thực xuất theo SKU, kho và đơn vị')} rows={model.totals} rowKey={row => row.key} columns={[
        { id: 'sku', heading: tx('SKU'), render: row => row.skuCode }, { id: 'warehouse', heading: tx('Kho'), render: row => row.warehouseId },
        { id: 'quantity', heading: tx('SL thực xuất'), align: 'end', render: row => row.quantity }, { id: 'unit', heading: tx('Đơn vị tính'), render: row => tx(row.unit) },
      ]} emptyContent={<p>{tx('Chưa có lần xuất đã ghi sổ trong kỳ.')}</p>} />
      <DataTable caption={tx('Các lần xuất đã ghi sổ')} rows={model.rows} rowKey={row => row.eventId} columns={columns} appearance="refined" emptyContent={<p>{tx('Chưa có lần xuất đã ghi sổ trong kỳ.')}</p>} />
    </>}
    <div className="s19-operational-controls"><Button variant="secondary" disabled={!model || state.busy || exporting} onClick={() => void download()} title={tx('Xuất tất cả lần xuất trong kỳ đang hiển thị.')}>{tx(exporting ? 'Đang xuất…' : 'Xuất Excel')}</Button>{exportFeedback && <p role="status">{tx(exportFeedback)}</p>}</div>
    <CatalogueNavTabs label={tx('Chứng từ liên quan')} items={[{ key: 'outbounds', label: tx('Phiếu xuất'), href: route('S15') }, { key: 'inventory', label: tx('Tồn kho'), href: route('S16') }, { key: 'ledger', label: tx('Sổ biến động'), href: route('S20') }]} />
    <OperationalOutboundDetail detail={detail} onClose={() => setSelection(null)} onRefresh={() => void controller.load()} resolveReturnFocus={returnFocus} />
  </section>;
}
