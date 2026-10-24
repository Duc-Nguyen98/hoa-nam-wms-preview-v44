import { formatBusinessDate } from '../../i18n/format-business-date';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { Button, Card, DataTable, DateRangePicker, GlobalModal, StatusBadge, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import { vietnamDate } from '../../operations/operational-reports';
import { createWarrantyReportReader, findPinnedWarrantyCase, type WarrantyCaseSelection, type OperationalWarrantyReport as WarrantyModel, type WarrantyReportReadAdapter, type WarrantyReportPeriod } from './warranty-operational-binding';

export const S22_OPERATIONAL_COPY = {
  'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.': 'Select a period within the last 90 days, ending no later than today.',
  'Báo cáo phiên hiện tại': 'Current session report', 'Báo cáo tham chiếu': 'Reference report', 'Kỳ báo cáo': 'Report period',
  'Đọc báo cáo': 'Load report', 'Xuất Excel': 'Export Excel', 'Đang đọc báo cáo…': 'Loading report…', 'Đang xuất…': 'Exporting…',
  'Chưa đọc được báo cáo đầy đủ. Kiểm tra phiên làm việc và đọc lại.': 'The complete report could not be read. Check your session and reload.',
  'Khoảng ngày không hợp lệ.': 'Invalid date range.', 'Thời điểm chốt phải bao quát dữ liệu đã đọc.': 'The report time must cover the data that was read.',
  'Chưa xuất được báo cáo. Đọc lại trước khi thử lại.': 'The report could not be exported. Reload before retrying.',
  'Thời điểm chốt': 'As of', 'Theo ngày tiếp nhận; gồm trọn ngày bắt đầu và kết thúc, giờ Việt Nam.': 'By received date, including both entire boundary days in Vietnam time.',
  'Dữ liệu giữ nguyên đến lần đọc tiếp theo; Excel sử dụng đúng lượt đọc này.': 'Data stays pinned until the next read; Excel uses this exact read.',
  'Tổng ca': 'Total cases', 'Hoàn tất': 'Complete', 'Đang xử lý': 'Processing', 'Chờ tiếp nhận': 'Waiting', 'Chưa hoàn tất': 'Incomplete', 'Quá hạn': 'Overdue',
  'Ca bảo hành trong kỳ': 'Warranty cases in period', 'Mã ca': 'Case code', 'SKU': 'SKU', 'Sản phẩm': 'Product', 'Ngày tiếp nhận': 'Received at', 'Ngày dự kiến hoàn tất': 'Expected finish date',
  'Trạng thái': 'State', 'Thao tác': 'Actions', 'Xem': 'View', 'Đóng': 'Close', 'Chi tiết ca bảo hành': 'Warranty case details',
  'Đã tiếp nhận': 'Received', 'Đang kiểm tra': 'Checking', 'Đang sửa chữa': 'Repairing', 'Đã sửa xong': 'Repaired', 'Đã trả khách': 'Returned',
  'Chưa có ca trong kỳ đã chọn.': 'No cases in the selected period.', 'Chưa có phiên làm việc.': 'No active session.',
  'Chưa có ngày dự kiến': 'No expected date', 'Không': 'No', 'Có': 'Yes', 'Mã vật lý': 'Physical code', 'Định danh tạm': 'Temporary identity',
  'Khách báo lỗi': 'Customer report', 'Chẩn đoán kỹ thuật': 'Technician diagnosis', 'Chưa chẩn đoán': 'Not diagnosed',
  'Số lỗi được ghi nhận': 'Recorded defects', 'Số phiếu cấp linh kiện': 'Parts issues', 'Lịch sử trạng thái': 'State history', 'Người thực hiện': 'Actor', 'Thời gian': 'Time',
  'Ca được đếm một lần; lỗi và phiếu cấp không làm tăng tổng ca.': 'Each case is counted once; defects and parts issues do not increase case totals.',
  'Ca không còn thuộc phiên hoặc kỳ báo cáo đang đọc. Đóng chi tiết để chọn lại.': 'The case is outside the current session or report period. Close the details to select again.',
};
type Row = WarrantyModel['rows'][number];
const stateText = { RECEIVED: 'Đã tiếp nhận', CHECKING: 'Đang kiểm tra', REPAIRING: 'Đang sửa chữa', REPAIRED: 'Đã sửa xong', RETURNED: 'Đã trả khách' };

export function OperationalWarrantyReport({ adapter }: { adapter: WarrantyReportReadAdapter }) {
  const tx = useUiCopy(S22_OPERATIONAL_COPY);
  const { language } = useShellPreferences();
  const date = (value: string) => formatBusinessDate(value, language);
  const locale = localeForLanguage(language);
  const timestamp = (value: string) => new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value));
  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createWarrantyReportReader(adapter, () => catalog.readSnapshot()); }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot), model = state.model;
  const [period, setPeriod] = useState<WarrantyReportPeriod>(() => { const today = vietnamDate(new Date().toISOString()); return { from: today, to: today }; });
  const [selected, setSelected] = useState<WarrantyCaseSelection | null>(null);
  const panel = useRef<HTMLElement>(null), returnSelection = useRef<WarrantyCaseSelection | null>(null);
  function resolveDetailReturnFocus() {
    const root = panel.current;
    if (!root) return null;
    // Loading a report replaces its row buttons. Restore the same case only
    // within the original dataset and current period, otherwise use the report controls.
    const current = findPinnedWarrantyCase(model, returnSelection.current);
    const action = current ? [...root.querySelectorAll<HTMLElement>('[data-s22-operational-action]')]
      .find(element => element.getAttribute('data-s22-operational-action') === current.id) : null;
    return action ?? root.querySelector<HTMLElement>('[data-s22-operational-load]:not(:disabled)') ?? root;
  }
  useEffect(() => {
    void controller.resume(); const refresh = () => { if (document.visibilityState === 'visible') void controller.load(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  const row = findPinnedWarrantyCase(model, selected);
  const badge = (item: Row) => <StatusBadge tone={item.category === 'complete' ? 'success' : item.category === 'processing' ? 'warning' : 'neutral'}>{tx(stateText[item.state])}</StatusBadge>;
  const columns: TableColumn<Row>[] = [
    { id: 'code', heading: tx('Mã ca'), render: item => <strong>{item.code}</strong> },
    { id: 'sku', heading: tx('SKU'), render: item => item.skuCode }, { id: 'product', heading: tx('Sản phẩm'), render: item => item.productName },
    { id: 'received', heading: tx('Ngày tiếp nhận'), render: item => timestamp(item.receivedAt) },
    { id: 'due', heading: tx('Ngày dự kiến hoàn tất'), render: item => item.expectedFinishDate ? date(item.expectedFinishDate) : tx('Chưa có ngày dự kiến') },
    { id: 'state', heading: tx('Trạng thái'), render: badge }, { id: 'overdue', heading: tx('Quá hạn'), render: item => tx(item.overdue ? 'Có' : 'Không') },
    { id: 'actions', heading: tx('Thao tác'), kind: 'actions', render: item => <Button variant="ghost" data-s22-operational-action={item.id} onClick={() => { if (model) { returnSelection.current = { id: item.id, fence: model.report.token }; setSelected(returnSelection.current); } }}>{tx('Xem')}</Button> },
  ];
  async function download() {
    const result = await controller.exportXlsx(); if (!result) return;
    const url = URL.createObjectURL(new Blob([result.bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = document.createElement('a'); link.href = url; link.download = `HoaNam-S22-${result.report.query.from}-${result.report.query.to}-r${result.report.token.revision}.xlsx`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const errorText = state.error === 'INVALID_PERIOD' ? 'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.' : state.error === 'AS_OF_BEFORE_SNAPSHOT' ? 'Thời điểm chốt phải bao quát dữ liệu đã đọc.' : state.error === 'EXPORT_FAILED' ? 'Chưa xuất được báo cáo. Đọc lại trước khi thử lại.' : 'Chưa đọc được báo cáo đầy đủ. Kiểm tra phiên làm việc và đọc lại.';
  return <section ref={panel} tabIndex={-1} className="s22-operational" data-operational-warranty-report aria-label={tx('Báo cáo phiên hiện tại')}>
    <section className="s22-period-panel hn-premium-panel"><div className="s22-period-row"><DateRangePicker id="s22-operational-period" label={tx('Kỳ báo cáo')} value={period} clearable={false} onChange={next => { if (next) { setPeriod(next); void controller.load(next); } }} />
      <Button data-s22-operational-load disabled={state.loading} onClick={() => void controller.load(period)}>{tx('Đọc báo cáo')}</Button><Button disabled={!model || state.loading || state.exporting} onClick={() => void download()}>{tx(state.exporting ? 'Đang xuất…' : 'Xuất Excel')}</Button></div>
      <p>{tx('Theo ngày tiếp nhận; gồm trọn ngày bắt đầu và kết thúc, giờ Việt Nam.')}</p>
      {model && <><p>{tx('Thời điểm chốt')}: <time dateTime={model.report.query.asOf}>{timestamp(model.report.query.asOf)}</time> · {date(model.report.query.from)} – {date(model.report.query.to)}</p><p>{tx('Dữ liệu giữ nguyên đến lần đọc tiếp theo; Excel sử dụng đúng lượt đọc này.')}</p></>}
      {state.loading && <p role="status">{tx('Đang đọc báo cáo…')}</p>}{state.error && <p role="alert">{tx(errorText)}</p>}
    </section>
    {model && <><section className="s22-kpis" aria-label={tx('Báo cáo phiên hiện tại')} data-report-sha={model.report.sha256}>
      {([['total', 'Tổng ca'], ['complete', 'Hoàn tất'], ['processing', 'Đang xử lý'], ['waiting', 'Chờ tiếp nhận'], ['incomplete', 'Chưa hoàn tất'], ['overdue', 'Quá hạn']] as const).map(([key, label]) => <Card key={key} className="s22-kpi hn-premium-panel" data-metric={key}><h3>{tx(label)}</h3><p className="s22-kpi-value"><strong>{model.report.summary[key]}</strong></p></Card>)}
    </section><section className="s22-list hn-premium-panel"><div className="s22-list-intro"><p>{tx('Ca được đếm một lần; lỗi và phiếu cấp không làm tăng tổng ca.')}</p>{!model.active && <p>{tx('Chưa có phiên làm việc.')}</p>}</div>
      <DataTable caption={tx('Ca bảo hành trong kỳ')} columns={columns} rows={model.rows} rowKey={item => item.id} appearance="refined" emptyContent={<p>{tx('Chưa có ca trong kỳ đã chọn.')}</p>} />
    </section></>}
    <GlobalModal open={!!selected} title={tx('Chi tiết ca bảo hành')} size="large" onClose={() => setSelected(null)} resolveReturnFocus={resolveDetailReturnFocus} footer={<><Button variant="secondary" disabled={state.loading} onClick={() => void controller.load(period)}>{tx('Đọc báo cáo')}</Button><Button onClick={() => setSelected(null)}>{tx('Đóng')}</Button></>}>
      {state.loading ? <p role="status">{tx('Đang đọc báo cáo…')}</p> : state.error ? <p role="alert">{tx(errorText)}</p> : !row ? <p role="status">{tx('Ca không còn thuộc phiên hoặc kỳ báo cáo đang đọc. Đóng chi tiết để chọn lại.')}</p> : null}
      {row && <><dl className="s22-operational-fields" data-case-id={row.id}>
        {[[tx('Mã ca'), row.code], [tx('SKU'), row.skuCode], [tx('Sản phẩm'), row.productName], [tx('Mã vật lý'), row.physicalCode ?? '—'], [tx('Định danh tạm'), row.temporaryIdentity ?? '—'], [tx('Ngày tiếp nhận'), timestamp(row.receivedAt)], [tx('Ngày dự kiến hoàn tất'), row.expectedFinishDate ? date(row.expectedFinishDate) : tx('Chưa có ngày dự kiến')], [tx('Khách báo lỗi'), row.customerReportedIssue], [tx('Chẩn đoán kỹ thuật'), row.technicianDiagnosis || tx('Chưa chẩn đoán')], [tx('Số lỗi được ghi nhận'), row.defectIds.length], [tx('Số phiếu cấp linh kiện'), row.partIssueIds.length]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl><DataTable caption={tx('Lịch sử trạng thái')} rows={row.timeline} rowKey={item => item.id} columns={[
        { id: 'time', heading: tx('Thời gian'), render: item => timestamp(item.timestamp) }, { id: 'state', heading: tx('Trạng thái'), render: item => tx(stateText[item.state]) },
        { id: 'actor', heading: tx('Người thực hiện'), render: item => item.actor }, { id: 'due', heading: tx('Ngày dự kiến hoàn tất'), render: item => item.expectedFinishDate ? date(item.expectedFinishDate) : tx('Chưa có ngày dự kiến') },
      ]} /></>}
    </GlobalModal>
  </section>;
}
