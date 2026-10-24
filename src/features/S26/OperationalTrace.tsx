import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { FormField, FilterInput, Button, CatalogueNavTabs, DataTable, type TableColumn } from '../../shared';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import { screenRegistry } from '../../app/registry';
import { createTraceBinding, findTraceSelection, resolveTraceSelection, type OperationalTraceRow, type TraceReader, type TraceSelection } from './trace-binding';

export const OPERATIONAL_TRACE_COPY = {
  'Nguồn dữ liệu': 'Data source', 'Phiên hiện tại': 'Current session', 'Dữ liệu đã duyệt': 'Accepted data', 'Truy vết phiên hiện tại': 'Current session trace',
  'Đọc lại dữ liệu': 'Refresh data', 'Xuất toàn bộ truy vết': 'Export all trace records', 'Đang xuất…': 'Exporting…', 'Đang đọc dữ liệu…': 'Loading data…',
  'Chưa thể đọc hoặc xuất truy vết. Đọc lại để kiểm tra.': 'Unable to read or export trace records. Refresh to check.',
  'Phiên hoặc dữ liệu đã thay đổi. Đọc lại để kiểm tra.': 'The session or data changed. Refresh to check.', 'Chưa thể xác minh đủ dữ liệu truy vết.': 'Complete trace data could not be verified.',
  'Vị trí và trạng thái là dữ liệu tại thời điểm đọc; không phải vị trí lịch sử theo kỳ.': 'Location and status reflect the read time; they are not historical period mappings.',
  'Chỉ có lịch sử trong phiên hiện tại. Lô, pallet và lịch sử trước phiên chưa có dữ liệu.': 'History covers the current session only. Lot, pallet and earlier history are unavailable.',
  'XLSX xuất toàn bộ danh sách đã đọc, gồm các chuỗi sự kiện. Chọn mã để xem lịch sử không giới hạn tệp xuất.': 'XLSX exports the entire accepted list with its event chains. Selecting a code does not limit the export.',
  'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.': 'No active session. Set it up in the testing area.', 'Chưa có mã vật lý trong phiên hiện tại.': 'No physical codes in the current session.',
  'Dữ liệu đọc lúc': 'Read at', 'Tổng số mã': 'Total codes', 'Mã SERIAL / BOX': 'SERIAL / BOX code', 'Loại mã': 'Code type', 'SKU / Sản phẩm': 'SKU / Product',
  'Phiếu nhập nguồn': 'Source receipt', 'Trạng thái': 'Status', 'Chờ ghi sổ nhập': 'Pending receipt posting', 'Đang tồn kho': 'In stock', 'Đã xuất': 'Issued',
  'Tồn BOX': 'BOX stock', 'Không áp dụng': 'Not applicable', 'Khay / Vị trí hiện tại': 'Current tray / location', 'Chưa xếp khay': 'Not assigned to a tray', 'Chưa có dữ liệu': 'Unavailable',
  'Lô / Pallet': 'Lot / Pallet', 'Lịch sử': 'History', 'Xem lịch sử': 'View history', 'Đóng lịch sử': 'Close history',
  'Tìm đúng mã SERIAL hoặc BOX': 'Find an exact SERIAL or BOX code', 'Chọn mã': 'Select code', 'Không tìm thấy mã chính xác trong phiên hiện tại.': 'No exact code found in the current session.',
  'Mã đã chọn không còn thuộc phiên hiện tại. Chọn lại từ danh sách.': 'The selected code is no longer in the current session. Select it again from the list.',
  'Lịch sử biến động tồn': 'Stock movement history', 'Số lượng dưới đây thuộc toàn bút toán, có thể gồm nhiều mã vật lý.': 'The quantities below belong to the entire entry, which may include multiple physical codes.',
  'Chứng từ xuất hiện tại': 'Current issue document', 'Thời điểm ghi sổ': 'Posted at', 'Chứng từ': 'Document', 'Loại biến động': 'Movement type', 'Số lượng bút toán': 'Entry quantity', 'Người ghi sổ': 'Posted by', 'Chứng từ gốc': 'Original document',
  'Nhập kho': 'Receipt', 'Xuất kho': 'Outbound', 'Xuất linh kiện': 'Parts issue', 'Hoàn trả': 'Return', 'Chưa có bút toán ghi sổ.': 'No posted entries.',
  'Chứng từ liên quan': 'Related documents', 'Phiếu nhập': 'Receipts', 'Phiếu xuất kho': 'Outbounds', 'Phiếu xuất linh kiện': 'Parts issues', 'Phiếu đảo tồn': 'Reversals', 'Lệnh xếp khay': 'Putaway orders',
};
const STATUS = { PENDING_RECEIPT: 'Chờ ghi sổ nhập', IN_STOCK: 'Đang tồn kho', ISSUED: 'Đã xuất' } as const;
const EVENT = { RECEIPT_POST: 'Nhập kho', OUTBOUND_POST: 'Xuất kho', PARTS_ISSUE_POST: 'Xuất linh kiện', REVERSAL_POST: 'Hoàn trả' } as const;
const errorMessage = (code: string) => code === 'SNAPSHOT_CHANGED' ? 'Phiên hoặc dữ liệu đã thay đổi. Đọc lại để kiểm tra.' : ['INCOMPLETE_POPULATION', 'CATALOG_LINK_UNAVAILABLE', 'TRACE_LINK_UNAVAILABLE', 'AS_OF_BEFORE_SNAPSHOT'].includes(code) ? 'Chưa thể xác minh đủ dữ liệu truy vết.' : 'Chưa thể đọc hoặc xuất truy vết. Đọc lại để kiểm tra.';

export function OperationalTrace({ adapter }: { adapter: TraceReader }) {
  const tx = useUiCopy(OPERATIONAL_TRACE_COPY);
  const { language } = useShellPreferences();
  const locale = localeForLanguage(language);
  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createTraceBinding(adapter, () => catalog.readSnapshot()); }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [selection, setSelection] = useState<TraceSelection | null>(null), [lookup, setLookup] = useState(''), [notFound, setNotFound] = useState(false);
  const [exporting, setExporting] = useState(false), [exportError, setExportError] = useState('');
  useEffect(() => { void controller.resume(); const refresh = () => { if (document.visibilityState === 'visible') void controller.load(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  const model = state.model, selected = resolveTraceSelection(model, selection);
  async function download() {
    setExporting(true); setExportError('');
    try {
      const result = await controller.exportXlsx();
      const url = URL.createObjectURL(new Blob([new Uint8Array(result.bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `S26-${result.query.to}-all.xlsx`; anchor.click(); URL.revokeObjectURL(url);
    } catch (error) { setExportError((error as { code?: string })?.code ?? 'EXPORT_FAILED'); }
    finally { setExporting(false); }
  }
  const location = (row: OperationalTraceRow) => row.kind === 'BOX' ? row.trayCode ? `${row.trayCode} / ${row.locationCode}` : tx('Chưa xếp khay') : tx('Chưa có dữ liệu');
  const columns: TableColumn<OperationalTraceRow>[] = [
    { id: 'code', heading: tx('Mã SERIAL / BOX'), render: row => <strong data-physical-id={row.trace.id}>{row.trace.physicalCode}</strong> },
    { id: 'kind', heading: tx('Loại mã'), render: row => row.kind },
    { id: 'sku', heading: tx('SKU / Sản phẩm'), render: row => <div className="s26-trace-cell" data-sku-id={row.trace.skuId} data-product-id={row.productId}><strong>{row.skuCode}</strong><span>{row.productName}</span></div> },
    { id: 'receipt', heading: tx('Phiếu nhập nguồn'), render: row => <span data-source-receipt-id={row.trace.sourceReceiptId} data-source-line-id={row.trace.sourceLineId}>{row.receiptCode}</span> },
    { id: 'status', heading: tx('Trạng thái'), render: row => tx(STATUS[row.trace.status]) },
    { id: 'quantity', heading: tx('Tồn BOX'), align: 'end', render: row => row.boxQuantity === null ? tx('Không áp dụng') : `${row.boxQuantity} ${tx(row.trace.unit)}` },
    { id: 'location', heading: tx('Khay / Vị trí hiện tại'), render: row => <span data-tray-id={row.trayId ?? undefined} data-location-id={row.locationId ?? undefined}>{location(row)}</span> },
    { id: 'unknown', heading: tx('Lô / Pallet'), render: () => tx('Chưa có dữ liệu') },
    { id: 'actions', heading: tx('Lịch sử'), kind: 'actions', render: row => <Button variant="ghost" onClick={() => { if (model) { setSelection({ id: row.trace.id, ...model.report.token }); setNotFound(false); } }}>{tx('Xem lịch sử')}</Button> },
  ];
  return <section className="s26-operational hn-premium-panel" data-operational-trace aria-label={tx('Truy vết phiên hiện tại')}>
    <div className="s26-operational-controls"><h2>{tx('Truy vết phiên hiện tại')}</h2><Button variant="secondary" disabled={state.busy} onClick={() => { setExportError(''); void controller.load(); }}>{tx('Đọc lại dữ liệu')}</Button><Button variant="secondary" disabled={!model || state.busy || exporting} onClick={() => void download()}>{tx(exporting ? 'Đang xuất…' : 'Xuất toàn bộ truy vết')}</Button></div>
    {state.busy && <p role="status">{tx('Đang đọc dữ liệu…')}</p>}{(state.error || exportError) && <p role="alert">{tx(errorMessage(state.error || exportError))}</p>}
    <p>{tx('Vị trí và trạng thái là dữ liệu tại thời điểm đọc; không phải vị trí lịch sử theo kỳ.')}</p><p>{tx('Chỉ có lịch sử trong phiên hiện tại. Lô, pallet và lịch sử trước phiên chưa có dữ liệu.')}</p><p>{tx('XLSX xuất toàn bộ danh sách đã đọc, gồm các chuỗi sự kiện. Chọn mã để xem lịch sử không giới hạn tệp xuất.')}</p>
    {model && <><p>{tx('Dữ liệu đọc lúc')}: <time dateTime={model.report.query.asOf}>{new Date(model.report.query.asOf).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })}</time> · {tx('Tổng số mã')}: {model.rows.length}</p>
      {!model.hasScenario ? <p>{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.')}</p> : <><form className="s26-operational-controls" onSubmit={event => { event.preventDefault(); const next = findTraceSelection(model, lookup); setSelection(next); setNotFound(!next); }}><FormField label={tx('Tìm đúng mã SERIAL hoặc BOX')} className="hn-operational-search"><FilterInput id="s26-operational-search" label={tx('Tìm đúng mã SERIAL hoặc BOX')} aria-label={tx('Tìm đúng mã SERIAL hoặc BOX')} value={lookup} onChange={event => { setLookup(event.target.value); setNotFound(false); }} /></FormField><Button type="submit">{tx('Chọn mã')}</Button></form>{notFound && <p role="status">{tx('Không tìm thấy mã chính xác trong phiên hiện tại.')}</p>}<DataTable caption={tx('Truy vết phiên hiện tại')} rows={model.rows} columns={columns} rowKey={row => row.trace.id} appearance="refined" emptyContent={<p>{tx('Chưa có mã vật lý trong phiên hiện tại.')}</p>} /></>}
    </>}
    {selection && <section className="s26-trace-history" aria-label={tx('Lịch sử biến động tồn')}><div className="s26-operational-controls"><h3>{tx('Lịch sử biến động tồn')}{selected ? ` · ${selected.trace.physicalCode}` : ''}</h3><Button variant="ghost" onClick={() => setSelection(null)}>{tx('Đóng lịch sử')}</Button></div>
      {!selected ? !state.busy && <p>{tx('Mã đã chọn không còn thuộc phiên hiện tại. Chọn lại từ danh sách.')}</p> : <><p>{tx('Chứng từ xuất hiện tại')}: <span data-issued-document-id={selected.trace.issuedDocumentId ?? undefined}>{selected.issuedDocumentCode ?? tx('Không áp dụng')}</span></p><p>{tx('Số lượng dưới đây thuộc toàn bút toán, có thể gồm nhiều mã vật lý.')}</p><DataTable caption={tx('Lịch sử biến động tồn')} rows={selected.events} rowKey={row => row.event.id} emptyContent={<p>{tx('Chưa có bút toán ghi sổ.')}</p>} columns={[
        { id: 'time', heading: tx('Thời điểm ghi sổ'), render: row => <time dateTime={row.event.data.committedAt}>{new Date(row.event.data.committedAt).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })}</time> },
        { id: 'document', heading: tx('Chứng từ'), render: row => <span data-document-id={row.event.data.documentId} data-source-line-id={row.event.data.sourceLineId}>{row.documentCode}</span> },
        { id: 'type', heading: tx('Loại biến động'), render: row => tx(EVENT[row.event.data.eventType]) },
        { id: 'quantity', heading: tx('Số lượng bút toán'), render: row => <span data-event-id={row.event.id} data-commit-snapshot-id={row.event.data.commitSnapshotId}>{row.event.data.signedQuantity > 0 ? '+' : ''}{row.event.data.signedQuantity} {tx(row.event.data.unit)}</span> },
        { id: 'actor', heading: tx('Người ghi sổ'), render: row => row.event.data.actor },
        { id: 'original', heading: tx('Chứng từ gốc'), render: row => <span data-original-event-id={row.event.data.originalEventId ?? undefined}>{row.originalDocumentCode ?? tx('Không áp dụng')}</span> },
      ]} /></>}
    </section>}
    <CatalogueNavTabs label={tx('Chứng từ liên quan')} items={([['S12', 'Phiếu nhập'], ['S14', 'Lệnh xếp khay'], ['S15', 'Phiếu xuất kho'], ['S10', 'Phiếu xuất linh kiện'], ['S17', 'Phiếu đảo tồn']] as const).map(([key, label]) => ({ key, label: tx(label), href: screenRegistry.find(screen => screen.key === key)?.href }))} />
  </section>;
}
