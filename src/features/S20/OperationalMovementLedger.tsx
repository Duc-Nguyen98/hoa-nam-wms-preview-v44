import { formatBusinessPeriod } from '../../i18n/format-business-date';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Button, CatalogueNavTabs, DataTable, DateRangePicker, GlobalModal, type TableColumn } from '../../shared';
import { useKeyboardFocusReveal } from '../../shared/focus';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import { screenRegistry } from '../../app/registry';
import { createMovementLedgerBinding, type LedgerPeriod, type MovementLedgerReader, type MovementLedgerRow } from './movement-ledger-binding';
import { selectMovementLedgerDetail, resolveMovementLedgerDetail, type MovementLedgerDetail } from './OperationalDetail';

export const MOVEMENT_LEDGER_COPY = {
  'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.': 'Select a period within the last 90 days, ending no later than today.',
  'Nguồn dữ liệu': 'Data source', 'Phiên hiện tại': 'Current session', 'Dữ liệu đã duyệt': 'Accepted data', 'Sổ biến động đã ghi sổ': 'Posted stock ledger',
  'Kỳ báo cáo': 'Report period', 'Áp dụng': 'Apply', 'Đọc lại dữ liệu': 'Refresh data', 'Xuất Excel': 'Export Excel', 'Đang xuất…': 'Exporting…', 'Đang đọc dữ liệu…': 'Loading data…',
  'Chưa thể đọc hoặc xuất báo cáo. Đọc lại để kiểm tra.': 'Unable to read or export the report. Refresh to check.', 'Kỳ báo cáo không hợp lệ.': 'Invalid report period.',
  'Phiên hoặc dữ liệu đã thay đổi. Đọc lại để kiểm tra.': 'The session or data changed. Refresh to check.', 'Chưa thể xác minh đủ dữ liệu để hiển thị hoặc xuất báo cáo.': 'Complete data could not be verified for display or export.',
  'Bút toán hoàn trả được ghi riêng với số lượng dương; bút toán gốc được giữ nguyên.': 'Returns are separate positive entries; the original entries remain unchanged.',
  'Mỗi dòng giữ nguyên đơn vị tính. Phiếu nháp chưa tạo biến động tồn kho.': 'Each entry retains its own unit. Draft documents do not create stock movements.',
  'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.': 'No active session. Set it up in the testing area.', 'Chưa có biến động tồn kho trong kỳ.': 'No stock movements in the period.',
  'Kỳ đã áp dụng': 'Applied period', 'Dữ liệu đọc lúc': 'Read at', 'Số bút toán': 'Entries', 'Thời điểm ghi sổ': 'Posted at', 'Loại biến động': 'Movement type',
  'Nhập kho': 'Receipt', 'Xuất kho': 'Outbound', 'Xuất linh kiện': 'Parts issue', 'Hoàn trả': 'Return', 'Chứng từ': 'Document',
  'SKU / Sản phẩm': 'SKU / Product', 'Kho': 'Warehouse', 'Tăng / giảm': 'Signed quantity', 'Người ghi sổ': 'Posted by', 'Mã vật lý / BOX': 'Physical codes / BOX',
  'Chứng từ gốc': 'Original document', 'Không áp dụng': 'Not applicable',
  'Chi tiết': 'Details', 'Chi tiết bút toán': 'Stock entry details', 'Chỉ đọc': 'Read only', 'Đóng': 'Close', 'Thao tác': 'Actions',
  'Mã bút toán': 'Entry ID', 'Mã chứng từ': 'Document ID', 'Dòng chứng từ': 'Source line ID', 'Mã lệnh': 'Command ID', 'Mã bản ghi ghi sổ': 'Commit snapshot ID',
  'Bút toán gốc': 'Original entry', 'Mã SKU': 'SKU ID', 'Mã sản phẩm': 'Product ID',
  'Chứng từ liên quan': 'Related documents', 'Phiếu nhập': 'Receipts', 'Phiếu xuất kho': 'Outbounds', 'Phiếu xuất linh kiện': 'Parts issues', 'Phiếu đảo tồn': 'Reversals', 'Tồn kho': 'Inventory',
};
const EVENT_LABEL = { RECEIPT_POST: 'Nhập kho', OUTBOUND_POST: 'Xuất kho', PARTS_ISSUE_POST: 'Xuất linh kiện', REVERSAL_POST: 'Hoàn trả' } as const;
const errorMessage = (code: string) => code === 'INVALID_PERIOD' ? 'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.' : code === 'SNAPSHOT_CHANGED' ? 'Phiên hoặc dữ liệu đã thay đổi. Đọc lại để kiểm tra.' : ['INCOMPLETE_POPULATION', 'CATALOG_LINK_UNAVAILABLE', 'EVENT_LINK_UNAVAILABLE', 'AS_OF_BEFORE_SNAPSHOT'].includes(code) ? 'Chưa thể xác minh đủ dữ liệu để hiển thị hoặc xuất báo cáo.' : 'Chưa thể đọc hoặc xuất báo cáo. Đọc lại để kiểm tra.';

export function OperationalMovementLedger({ adapter }: { adapter: MovementLedgerReader }) {
  const tx = useUiCopy(MOVEMENT_LEDGER_COPY);
  const { language } = useShellPreferences();
  const locale = localeForLanguage(language);
  const heading = useRef<HTMLHeadingElement>(null), revealFocus = useKeyboardFocusReveal();
  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createMovementLedgerBinding(adapter, () => catalog.readSnapshot()); }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [selection, setSelection] = useState<MovementLedgerDetail | null>(null);
  const closeDetail = () => setSelection(null);
  const [draft, setDraft] = useState<LedgerPeriod | null>(null), [exporting, setExporting] = useState(false), [exportError, setExportError] = useState('');
  const refreshData = () => { closeDetail(); setExportError(''); void controller.load(); };
  useEffect(() => { setSelection(null); void controller.resume(); const refresh = () => { if (document.visibilityState === 'visible') { setSelection(null); void controller.load(); } };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  const model = state.model;
  const detail = resolveMovementLedgerDetail(selection, model);
  async function download() {
    setExporting(true); setExportError('');
    try {
      const result = await controller.exportXlsx();
      const url = URL.createObjectURL(new Blob([new Uint8Array(result.bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `S20-${result.query.from}-${result.query.to}.xlsx`; anchor.click(); URL.revokeObjectURL(url);
    } catch (error) { setExportError((error as { code?: string })?.code ?? 'EXPORT_FAILED'); }
    finally { setExporting(false); }
  }
  const columns: TableColumn<MovementLedgerRow>[] = [
    { id: 'time', heading: tx('Thời điểm ghi sổ'), render: row => <time dateTime={row.event.data.committedAt}>{new Date(row.event.data.committedAt).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })}</time> },
    { id: 'type', heading: tx('Loại biến động'), render: row => tx(EVENT_LABEL[row.event.data.eventType]) },
    { id: 'document', heading: tx('Chứng từ'), render: row => <strong data-document-id={row.event.data.documentId} data-source-line-id={row.event.data.sourceLineId}>{row.documentCode}</strong> },
    { id: 'sku', heading: tx('SKU / Sản phẩm'), render: row => <div className="s20-ledger-cell" data-sku-id={row.event.data.skuId} data-product-id={row.productId}><strong>{row.skuCode}</strong><span>{row.productName}</span></div> },
    { id: 'quantity', heading: tx('Tăng / giảm'), align: 'end', render: row => <strong data-event-id={row.event.id} data-commit-snapshot-id={row.event.data.commitSnapshotId} data-event-quantity={row.event.data.signedQuantity}>{row.event.data.signedQuantity > 0 ? '+' : ''}{row.event.data.signedQuantity.toLocaleString(locale)} {tx(row.event.data.unit)}</strong> },
    { id: 'warehouse', heading: tx('Kho'), render: row => row.event.data.warehouseId },
    { id: 'physical', heading: tx('Mã vật lý / BOX'), render: row => <div className="s20-ledger-cell">{row.physicalCodes.map((code, index) => <div key={row.event.data.physicalIds[index]} data-physical-id={row.event.data.physicalIds[index]}>{code}</div>)}{row.boxCode && <div data-box-id={row.event.data.boxId}>{row.boxCode}</div>}{!row.physicalCodes.length && !row.boxCode && tx('Không áp dụng')}</div> },
    { id: 'actor', heading: tx('Người ghi sổ'), render: row => row.event.data.actor },
    { id: 'original', heading: tx('Chứng từ gốc'), render: row => <span data-original-event-id={row.event.data.originalEventId ?? undefined}>{row.originalDocumentCode ?? tx('Không áp dụng')}</span> },
    { id: 'detail', heading: tx('Thao tác'), render: row => <Button variant="ghost" data-s20-detail-event={row.event.id} aria-label={`${tx('Chi tiết bút toán')} ${row.documentCode} · ${row.event.id}`} onClick={() => setSelection(selectMovementLedgerDetail(row.event.id, controller.getSnapshot().model, model))}>{tx('Chi tiết')}</Button> },
  ];
  return <section onFocusCapture={revealFocus} className="s20-operational s20-panel" data-operational-movement-ledger aria-label={tx('Sổ biến động đã ghi sổ')}>
    <h2 ref={heading} tabIndex={-1}>{tx('Sổ biến động đã ghi sổ')}</h2>
    <div className="s20-operational-controls"><DateRangePicker id="s20-operational-period" label={tx('Kỳ báo cáo')} value={draft ?? state.requestedPeriod ?? state.acceptedPeriod} clearable={false} onChange={period => { closeDetail(); setDraft(period); }} />
      <Button disabled={state.busy || !draft} onClick={() => { closeDetail(); setExportError(''); void controller.load(draft); }}>{tx('Áp dụng')}</Button>
      <Button variant="secondary" data-s20-refresh disabled={state.busy} onClick={refreshData}>{tx('Đọc lại dữ liệu')}</Button>
      <Button variant="secondary" disabled={!model || state.busy || exporting} onClick={() => void download()}>{tx(exporting ? 'Đang xuất…' : 'Xuất Excel')}</Button>
    </div>
    {state.busy && <p role="status">{tx('Đang đọc dữ liệu…')}</p>}{(state.error || exportError) && <p role="alert">{tx(errorMessage(state.error || exportError))}</p>}
    <p>{tx('Bút toán hoàn trả được ghi riêng với số lượng dương; bút toán gốc được giữ nguyên.')}</p><p>{tx('Mỗi dòng giữ nguyên đơn vị tính. Phiếu nháp chưa tạo biến động tồn kho.')}</p>
    {model && <><p>{tx('Kỳ đã áp dụng')}: {formatBusinessPeriod(model.report.query, language)} · Asia/Ho_Chi_Minh</p><p>{tx('Dữ liệu đọc lúc')}: <time dateTime={model.report.query.asOf}>{new Date(model.report.query.asOf).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })}</time> · {tx('Số bút toán')}: {model.rows.length}</p>
      {!model.hasScenario ? <p>{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.')}</p> : <DataTable caption={tx('Sổ biến động đã ghi sổ')} captionVisibility="sr-only" columns={columns} rows={model.rows} rowKey={row => row.event.id} appearance="refined" emptyContent={<p>{tx('Chưa có biến động tồn kho trong kỳ.')}</p>} />}</>}
    <CatalogueNavTabs label={tx('Chứng từ liên quan')} items={([['S12', 'Phiếu nhập'], ['S15', 'Phiếu xuất kho'], ['S10', 'Phiếu xuất linh kiện'], ['S17', 'Phiếu đảo tồn'], ['S16', 'Tồn kho']] as const).map(([key, label]) => ({ key, label: tx(label), href: screenRegistry.find(screen => screen.key === key)?.href }))} />
    <GlobalModal open={Boolean(detail)} title={tx('Chi tiết bút toán')} description={tx('Chỉ đọc')} onClose={closeDetail} closeLabel={tx('Đóng')}
      resolveReturnFocus={() => heading.current}
      footer={<><Button variant="secondary" data-s20-detail-refresh disabled={state.busy} onClick={refreshData}>{tx('Đọc lại dữ liệu')}</Button><Button variant="secondary" onClick={closeDetail}>{tx('Đóng')}</Button></>}>
      {detail && <dl className="s20-ledger-cell" data-s20-detail-id={detail.event.id} style={{ overflowWrap: 'anywhere' }}>
        {([
          ['Mã bút toán', detail.event.id], ['Loại biến động', tx(EVENT_LABEL[detail.event.data.eventType])],
          ['Chứng từ', detail.documentCode], ['Mã chứng từ', detail.event.data.documentId], ['Dòng chứng từ', detail.event.data.sourceLineId],
          ['SKU / Sản phẩm', `${detail.skuCode} · ${detail.productName}`], ['Mã SKU', detail.event.data.skuId], ['Mã sản phẩm', detail.productId],
          ['Tăng / giảm', `${detail.event.data.signedQuantity > 0 ? '+' : ''}${detail.event.data.signedQuantity.toLocaleString(locale)} ${tx(detail.event.data.unit)}`],
          ['Kho', detail.event.data.warehouseId], ['Thời điểm ghi sổ', new Date(detail.event.data.committedAt).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })],
          ['Người ghi sổ', detail.event.data.actor], ['Mã lệnh', detail.event.data.commandId], ['Mã bản ghi ghi sổ', detail.event.data.commitSnapshotId],
          ['Mã vật lý / BOX', [...detail.physicalCodes.map((code, index) => `${code} · ${detail.event.data.physicalIds[index]}`), ...(detail.boxCode ? [`${detail.boxCode} · ${detail.event.data.boxId}`] : [])].join('; ') || tx('Không áp dụng')],
          ['Chứng từ gốc', detail.originalDocumentCode ?? tx('Không áp dụng')], ['Bút toán gốc', detail.event.data.originalEventId ?? tx('Không áp dụng')],
        ] as const).map(([label, value]) => <div key={label} className="s20-ledger-cell"><dt>{tx(label)}</dt><dd>{value}</dd></div>)}
      </dl>}
    </GlobalModal>
  </section>;
}
