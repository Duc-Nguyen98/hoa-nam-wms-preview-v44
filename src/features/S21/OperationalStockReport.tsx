import { formatBusinessPeriod } from '../../i18n/format-business-date';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Button, CatalogueNavTabs, DataTable, DateRangePicker, type TableColumn } from '../../shared';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import { screenRegistry } from '../../app/registry';
import { createStockReportBinding, type StockPeriod, type StockReportReader, type StockReportRow } from './stock-report-binding';

export const STOCK_REPORT_COPY = {
  'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.': 'Select a period within the last 90 days, ending no later than today.',
  'Nguồn dữ liệu': 'Data source', 'Phiên hiện tại': 'Current session', 'Dữ liệu đã duyệt': 'Accepted data',
  'Nhập – xuất – tồn theo kỳ': 'Period stock movements', 'Kỳ báo cáo': 'Report period', 'Áp dụng': 'Apply', 'Đọc lại dữ liệu': 'Refresh data', 'Xuất Excel': 'Export Excel', 'Đang xuất…': 'Exporting…',
  'Đang đọc dữ liệu…': 'Loading data…', 'Chưa thể đọc hoặc xuất báo cáo. Đọc lại để kiểm tra.': 'Unable to read or export the report. Refresh to check.',
  'Kỳ báo cáo không hợp lệ.': 'Invalid report period.', 'Phiên hoặc dữ liệu đã thay đổi. Đọc lại để kiểm tra.': 'The session or data changed. Refresh to check.',
  'Chưa thể xác minh đủ dữ liệu để hiển thị hoặc xuất báo cáo.': 'Complete data could not be verified for display or export.',
  'Tồn đầu + Nhập − Xuất SP − Xuất linh kiện + Hoàn trả = Tồn cuối. Mỗi dòng có đơn vị tính riêng.': 'Opening + Inbound − Outbound − Parts + Returns = Closing. Each row has its own unit.',
  'Chưa có dữ liệu kiểm đếm thực tế; chưa thể tính chênh lệch.': 'No physical count data is available; the difference cannot be calculated.',
  'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.': 'No active session. Set it up in the testing area.', 'Chưa có biến động tồn kho trong kỳ.': 'No stock movements in the period.',
  'SKU': 'SKU', 'Tên hàng': 'Product name', 'Kho': 'Warehouse', 'Đơn vị tính': 'Unit', 'Tồn đầu': 'Opening', 'Nhập': 'Inbound', 'Xuất SP': 'Outbound', 'Xuất linh kiện': 'Parts', 'Hoàn trả': 'Returns', 'Tồn cuối': 'Closing',
  'Thực tế': 'Physical count', 'Chênh lệch': 'Difference', 'Chưa xác định': 'Unknown', 'Kỳ đã áp dụng': 'Applied period', 'Dữ liệu đọc lúc': 'Read at',
  'Chứng từ liên quan': 'Related documents', 'Phiếu nhập': 'Receipts', 'Phiếu xuất kho': 'Outbounds', 'Phiếu xuất linh kiện': 'Parts issues', 'Phiếu đảo tồn': 'Reversals', 'Tồn kho': 'Inventory',
  'Ghim SKU': 'Pin SKU', 'Ghim SKU và tên sản phẩm': 'Pin SKU and product name',
};
const errorMessage = (code: string) => code === 'INVALID_PERIOD' ? 'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.' : code === 'SNAPSHOT_CHANGED' ? 'Phiên hoặc dữ liệu đã thay đổi. Đọc lại để kiểm tra.' : ['INCOMPLETE_POPULATION', 'CATALOG_LINK_UNAVAILABLE', 'AS_OF_BEFORE_SNAPSHOT'].includes(code) ? 'Chưa thể xác minh đủ dữ liệu để hiển thị hoặc xuất báo cáo.' : 'Chưa thể đọc hoặc xuất báo cáo. Đọc lại để kiểm tra.';

export function OperationalStockReport({ adapter }: { adapter: StockReportReader }) {
  const tx = useUiCopy(STOCK_REPORT_COPY);
  const { language } = useShellPreferences();
  const locale = localeForLanguage(language);
  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createStockReportBinding(adapter, () => catalog.readSnapshot()); }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [draft, setDraft] = useState<StockPeriod | null>(null), [exporting, setExporting] = useState(false), [exportError, setExportError] = useState('');
  useEffect(() => { let mounted = true; void controller.resume(); const refresh = () => { if (mounted && document.visibilityState === 'visible') void controller.load(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { mounted = false; controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  const model = state.model;
  async function download() {
    setExporting(true); setExportError('');
    try {
      const result = await controller.exportXlsx();
      const url = URL.createObjectURL(new Blob([new Uint8Array(result.bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `S21-${result.query.from}-${result.query.to}.xlsx`; anchor.click(); URL.revokeObjectURL(url);
    } catch (error) { setExportError((error as { code?: string })?.code ?? 'EXPORT_FAILED'); }
    finally { setExporting(false); }
  }
  const columns: TableColumn<StockReportRow>[] = [
    { id: 'sku', heading: tx('SKU'), render: row => <strong data-sku-id={row.skuId}>{row.skuCode}</strong> },
    { id: 'name', heading: tx('Tên hàng'), render: row => row.productName },
    { id: 'warehouse', heading: tx('Kho'), render: row => row.warehouseId }, { id: 'unit', heading: tx('Đơn vị tính'), render: row => tx(row.unit) },
    ...([['opening', 'Tồn đầu'], ['inbound', 'Nhập'], ['outbound', 'Xuất SP'], ['parts', 'Xuất linh kiện'], ['reversals', 'Hoàn trả'], ['closing', 'Tồn cuối']] as const).map(([key, label]): TableColumn<StockReportRow> => ({ id: key, heading: tx(label), align: 'end', render: row => row[key].toLocaleString(locale) })),
    { id: 'actual', heading: tx('Thực tế'), render: () => tx('Chưa xác định') }, { id: 'difference', heading: tx('Chênh lệch'), render: () => tx('Chưa xác định') },
  ];
  return <section className="s21-operational s21-panel" data-operational-stock-report aria-label={tx('Nhập – xuất – tồn theo kỳ')}>
    <h2>{tx('Nhập – xuất – tồn theo kỳ')}</h2>
    <div className="s21-operational-controls"><DateRangePicker id="s21-operational-period" label={tx('Kỳ báo cáo')} value={draft ?? state.requestedPeriod ?? state.acceptedPeriod} clearable={false} onChange={setDraft} />
      <Button disabled={state.busy || !draft} onClick={() => { setExportError(''); void controller.load(draft); }}>{tx('Áp dụng')}</Button>
      <Button variant="secondary" disabled={state.busy} onClick={() => { setExportError(''); void controller.load(); }}>{tx('Đọc lại dữ liệu')}</Button>
      <Button variant="secondary" disabled={!model || state.busy || exporting} onClick={() => void download()}>{tx(exporting ? 'Đang xuất…' : 'Xuất Excel')}</Button>
    </div>
    {state.busy && <p role="status">{tx('Đang đọc dữ liệu…')}</p>}{(state.error || exportError) && <p role="alert">{tx(errorMessage(state.error || exportError))}</p>}
    <p>{tx('Tồn đầu + Nhập − Xuất SP − Xuất linh kiện + Hoàn trả = Tồn cuối. Mỗi dòng có đơn vị tính riêng.')}</p><p>{tx('Chưa có dữ liệu kiểm đếm thực tế; chưa thể tính chênh lệch.')}</p>
    {model && <><p>{tx('Kỳ đã áp dụng')}: {formatBusinessPeriod(model.report.query, language)} · Asia/Ho_Chi_Minh</p><p>{tx('Dữ liệu đọc lúc')}: <time dateTime={model.report.query.asOf}>{new Date(model.report.query.asOf).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })}</time></p>
      {!model.hasScenario ? <p>{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.')}</p> : <><p className="s21-operational-table-note">{tx('Ghim SKU')}</p><DataTable caption={tx('Nhập – xuất – tồn theo kỳ')} captionVisibility="sr-only" columns={columns} rows={model.rows} rowKey={row => row.key} appearance="refined" stickyHeader stickyColumnIds={['sku']} emptyContent={<p>{tx('Chưa có biến động tồn kho trong kỳ.')}</p>} /></>}
    </>}
    <CatalogueNavTabs label={tx('Chứng từ liên quan')} items={([['S12', 'Phiếu nhập'], ['S15', 'Phiếu xuất kho'], ['S10', 'Phiếu xuất linh kiện'], ['S17', 'Phiếu đảo tồn'], ['S16', 'Tồn kho']] as const).map(([key, label]) => ({ key, label: tx(label), href: screenRegistry.find(screen => screen.key === key)?.href }))} />
  </section>;
}
