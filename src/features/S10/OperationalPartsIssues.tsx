import { readFailureKind } from '../../shared/read-failure-kind';
import { PageState } from '../../shared/PageState';
import { ReadState } from '../../shared/ReadState';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { screenRegistry } from '../../app/registry';
import { Button, DataTable, GlobalModal, StatusBadge, type TableColumn } from '../../shared';
import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { createOperationalPartsReader, findOperationalPartsIssue, type OperationalPartsIssue, type PartsReadAdapter, type PartsReadFence } from './parts-operational-binding';
import './operational-parts.css';

const COPY = {
  'Phiếu xuất linh kiện phiên hiện tại': 'Current session parts issues', 'Đọc lại dữ liệu': 'Refresh data', 'Đang đọc dữ liệu…': 'Loading data…',
  'Xuất linh kiện thực hiện trên App Scanner. Web dùng để tra cứu và đối chiếu.': 'Parts are issued in the Scanner App. The Web is for viewing and reconciliation.',
  'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử để tra cứu.': 'No active session. Set it up in the testing area to view records.',
  'Chưa có phiếu xuất linh kiện trong phiên hiện tại.': 'No parts issues in the current session.',
  'Chưa thể đọc dữ liệu. Vui lòng đọc lại.': 'Unable to read data. Please refresh.', 'Phiên đăng nhập hoặc quyền tra cứu hiện không khả dụng.': 'Your session or read access is currently unavailable.',
  'Dữ liệu liên kết chưa đầy đủ để đối chiếu. Vui lòng đọc lại trước khi kiểm tra phiếu.': 'Linked data is incomplete for reconciliation. Refresh before checking the issue.',
  'Mã phiếu': 'Issue code', 'Hồ sơ bảo hành': 'Warranty case', 'Dòng linh kiện': 'Component lines', 'Trạng thái': 'Status', 'Cập nhật': 'Updated', 'Thao tác': 'Actions', 'Chi tiết': 'Details',
  'Nháp': 'Draft', 'Đang ghi nhận': 'Scanning', 'Đã xuất': 'Posted', 'Chi tiết phiếu xuất linh kiện': 'Parts issue details', 'Đóng': 'Close',
  'Phiếu không còn thuộc phiên hiện tại hoặc chưa thể đọc đầy đủ.': 'The issue is no longer in the current session or cannot be read completely.',
  'ID phiếu': 'Issue ID', 'ID hồ sơ': 'Case ID', 'Mục đích': 'Purpose', 'Bảo hành': 'Warranty',
  'SKU': 'SKU', 'Sản phẩm / Linh kiện': 'Product / Component', 'Theo dõi': 'Tracking', 'Mã vật lý / BOX': 'Physical / BOX code', 'Số lượng': 'Quantity', 'Đơn vị tính': 'Unit',
  'Chưa có dòng linh kiện. Phiếu nháp chưa làm thay đổi tồn kho.': 'No component lines. The draft has not changed stock.',
  'Bút toán xuất gốc': 'Original issue stock events', 'Chưa có bút toán xuất. Ghi nhận dòng trên App chưa làm thay đổi tồn kho.': 'No issue stock events. Recording lines in the App has not changed stock.',
  'ID bút toán': 'Event ID', 'ID dòng': 'Line ID', 'Biến động': 'Movement', 'Thời điểm': 'Time',
  'Chứng từ hoàn trả liên quan': 'Related return documents', 'Chưa có chứng từ hoàn trả liên kết với phiếu này.': 'No return document is linked to this issue.',
  'Mã hoàn trả': 'Return code', 'Đã hoàn trả': 'Posted return', 'Đã hủy': 'Cancelled', 'Lý do': 'Reason', 'Bút toán bù': 'Compensating events',
  'Bút toán gốc không bị sửa khi hoàn trả. Các bút toán bù được hiển thị riêng.': 'Returning parts does not change the original events. Compensating events are shown separately.',
  'Chưa ghi sổ hoàn trả.': 'Return not posted.', 'Bút toán gốc': 'Original event', 'Mở hồ sơ bảo hành': 'Open warranty cases', 'Mở chứng từ hoàn trả': 'Open return documents',
};
const STATUS = { DRAFT: 'Nháp', SCANNING: 'Đang ghi nhận', POSTED: 'Đã xuất' } as const;
const RETURN_STATUS = { DRAFT: 'Nháp', POSTED: 'Đã hoàn trả', CANCELLED: 'Đã hủy' } as const;
function errorMessage(code: string) {
  if (code === 'INCOMPLETE_PARTS_RELATIONSHIP') return 'Dữ liệu liên kết chưa đầy đủ để đối chiếu. Vui lòng đọc lại trước khi kiểm tra phiếu.';
  if (['COMMAND_UNAVAILABLE', 'SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN', 'CONFIRMATION_REQUIRED'].includes(code)) return 'Phiên đăng nhập hoặc quyền tra cứu hiện không khả dụng.';
  return 'Chưa thể đọc dữ liệu. Vui lòng đọc lại.';
}
export function OperationalPartsIssues({ adapter: supplied }: { adapter?: PartsReadAdapter }) {
  const tx = useUiCopy(COPY);
  const { language } = useShellPreferences(), locale = localeForLanguage(language);
  const timestamp = (value: string) => Number.isNaN(Date.parse(value)) ? value : new Date(value).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' });
  const adapter = useMemo(() => supplied ?? createOperationalWebAdapter(undefined, { scope: 'S10' }), [supplied]);
  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createOperationalPartsReader(adapter, () => catalog.readSnapshot()); }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [selected, setSelected] = useState<{ id: string; fence: PartsReadFence } | null>(null);
  const panel = useRef<HTMLElement>(null), returnSelection = useRef<{ id: string; fence: PartsReadFence } | null>(null);
  const model = state.model, detail = selected ? findOperationalPartsIssue(model, selected.id, selected.fence) : null;
  function resolveDetailReturnFocus() {
    const root = panel.current;
    if (!root) return null;
    const current = returnSelection.current ? findOperationalPartsIssue(model, returnSelection.current.id, returnSelection.current.fence) : null;
    const action = current ? [...root.querySelectorAll<HTMLElement>('[data-s10-operational-action]')].find(element => element.dataset.s10OperationalAction === current.record.id && !element.matches(':disabled') && element.getClientRects().length > 0) : null;
    return action ?? root.querySelector<HTMLElement>('[data-s10-operational-refresh]:not(:disabled)') ?? root;
  }
  const caseRoute = screenRegistry.find(screen => screen.key === 'S09')?.href, reversalRoute = screenRegistry.find(screen => screen.key === 'S17')?.href;
  useEffect(() => {
    void controller.resume();
    const refresh = () => { if (document.visibilityState === 'visible') void controller.load(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  const badge = (issue: OperationalPartsIssue) => <StatusBadge tone={issue.record.data.status === 'POSTED' ? 'success' : 'neutral'}>{tx(STATUS[issue.record.data.status])}</StatusBadge>;
  const columns: TableColumn<OperationalPartsIssue>[] = [
    { id: 'code', heading: tx('Mã phiếu'), render: issue => <strong>{issue.record.data.code}</strong> },
    { id: 'case', heading: tx('Hồ sơ bảo hành'), render: issue => issue.warrantyCase.data.code },
    { id: 'lines', heading: tx('Dòng linh kiện'), render: issue => <span className="s10-stack"><span>{issue.lines.length}</span><span>{[...new Set(issue.lines.map(line => line.sku.code))].join(', ') || '—'}</span></span> },
    { id: 'status', heading: tx('Trạng thái'), render: badge },
    { id: 'updated', heading: tx('Cập nhật'), render: issue => <time dateTime={issue.record.data.updatedAt}>{timestamp(issue.record.data.updatedAt)}</time> },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', render: issue => <Button variant="ghost" disabled={state.busy} data-s10-operational-action={issue.record.id} onClick={() => { if (model) { returnSelection.current = { id: issue.record.id, fence: { ...model.token } }; setSelected(returnSelection.current); } }}>{tx('Chi tiết')}</Button> },
  ];
  const error = state.error && <p role="alert">{tx(errorMessage(state.error))}</p>;
  return <section ref={panel} tabIndex={-1} className="s10-list s10-operational" aria-label={tx('Phiếu xuất linh kiện phiên hiện tại')} data-operational-parts-issues>
    <div className="s10-operational__heading"><h2>{tx('Phiếu xuất linh kiện phiên hiện tại')}</h2><Button data-s10-operational-refresh variant="secondary" disabled={state.busy} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button></div>
    <p>{tx('Xuất linh kiện thực hiện trên App Scanner. Web dùng để tra cứu và đối chiếu.')}</p><ReadState loading={state.busy} error={state.error} hasData={!!model} loadingText={tx('Đang đọc dữ liệu…')} errorText={tx(errorMessage(state.error))}/>
    {model && !model.active && <p role="status">{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử để tra cứu.')}</p>}
    {model?.active && <DataTable caption={tx('Phiếu xuất linh kiện phiên hiện tại')} captionVisibility="sr-only" columns={columns} rows={model.issues} rowKey={issue => issue.record.id} busy={state.busy} appearance="refined" emptyContent={<p>{tx('Chưa có phiếu xuất linh kiện trong phiên hiện tại.')}</p>} />}
    <GlobalModal resolveReturnFocus={resolveDetailReturnFocus} open={!!selected} title={tx('Chi tiết phiếu xuất linh kiện')} onClose={() => setSelected(null)} size="large" footer={<><Button variant="secondary" disabled={state.busy} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button><Button onClick={() => setSelected(null)}>{tx('Đóng')}</Button></>}>
      {error}{!detail ? <PageState kind={state.busy ? 'loading' : state.error ? readFailureKind(state.error) : 'record-not-found'} description={state.busy || state.error ? undefined : tx('Phiếu không còn thuộc phiên hiện tại hoặc chưa thể đọc đầy đủ.')} action={!state.busy && <Button onClick={()=>setSelected(null)}>{tx('Đóng')}</Button>}/> : <div className="s10-operational__detail" data-operational-parts-id={detail.record.id}>
        <dl className="s10-detail__fields"><div><dt>{tx('Mã phiếu')}</dt><dd>{detail.record.data.code}</dd></div><div><dt>{tx('ID phiếu')}</dt><dd>{detail.record.id}</dd></div><div><dt>{tx('Hồ sơ bảo hành')}</dt><dd>{detail.warrantyCase.data.code}</dd></div><div><dt>{tx('ID hồ sơ')}</dt><dd>{detail.warrantyCase.id}</dd></div><div><dt>{tx('Trạng thái')}</dt><dd>{badge(detail)}</dd></div><div><dt>{tx('Mục đích')}</dt><dd>{tx('Bảo hành')}</dd></div></dl>
        <h3>{tx('Dòng linh kiện')}</h3>
        <DataTable caption={tx('Dòng linh kiện')} captionVisibility="sr-only" rows={detail.lines} rowKey={row => row.line.id} emptyContent={<p>{tx('Chưa có dòng linh kiện. Phiếu nháp chưa làm thay đổi tồn kho.')}</p>} columns={[
          { id: 'sku', heading: tx('SKU'), render: row => <span className="s10-stack"><strong>{row.sku.code}</strong><small>{row.sku.id}</small></span> },
          { id: 'product', heading: tx('Sản phẩm / Linh kiện'), render: row => <span className="s10-stack"><span>{row.product.name}</span><small>{row.product.code}</small></span> },
          { id: 'tracking', heading: tx('Theo dõi'), render: row => row.line.tracking === 'SERIAL' ? 'Serial' : 'BOX' },
          { id: 'physical', heading: tx('Mã vật lý / BOX'), render: row => <span className="s10-stack">{row.identities.map(identity => <span className="s10-stack" key={identity.id}><strong>{identity.data.physicalCode}</strong><small>{identity.id}</small></span>)}</span> },
          { id: 'quantity', heading: tx('Số lượng'), align: 'end', render: row => row.line.quantity }, { id: 'unit', heading: tx('Đơn vị tính'), render: row => row.line.unit },
        ]} />
        <h3>{tx('Bút toán xuất gốc')}</h3><p>{tx('Bút toán gốc không bị sửa khi hoàn trả. Các bút toán bù được hiển thị riêng.')}</p>
        <DataTable caption={tx('Bút toán xuất gốc')} captionVisibility="sr-only" rows={detail.events} rowKey={event => event.id} emptyContent={<p>{tx('Chưa có bút toán xuất. Ghi nhận dòng trên App chưa làm thay đổi tồn kho.')}</p>} columns={[
          { id: 'event', heading: tx('ID bút toán'), render: event => event.id }, { id: 'line', heading: tx('ID dòng'), render: event => event.data.sourceLineId },
          { id: 'quantity', heading: tx('Biến động'), align: 'end', render: event => `${event.data.signedQuantity} ${event.data.unit}` }, { id: 'time', heading: tx('Thời điểm'), render: event => <time dateTime={event.data.committedAt}>{timestamp(event.data.committedAt)}</time> },
        ]} />
        <h3>{tx('Chứng từ hoàn trả liên quan')}</h3>{!detail.reversals.length && <p>{tx('Chưa có chứng từ hoàn trả liên kết với phiếu này.')}</p>}
        {detail.reversals.map(reversal => <section key={reversal.record.id} data-related-reversal-id={reversal.record.id}><h4>{reversal.record.data.code}</h4><p>{tx(RETURN_STATUS[reversal.record.data.status])} · {reversal.record.data.reasonText}</p>
          <DataTable caption={tx('Bút toán bù')} rows={reversal.events} rowKey={event => event.id} emptyContent={<p>{tx('Chưa ghi sổ hoàn trả.')}</p>} columns={[
            { id: 'event', heading: tx('ID bút toán'), render: event => event.id }, { id: 'original', heading: tx('Bút toán gốc'), render: event => event.data.originalEventId },
            { id: 'quantity', heading: tx('Biến động'), align: 'end', render: event => `+${event.data.signedQuantity} ${event.data.unit}` },
          ]} />
        </section>)}
        <nav className="s10-operational__links">{caseRoute && <a href={caseRoute}>{tx('Mở hồ sơ bảo hành')}</a>}{reversalRoute && <a href={reversalRoute}>{tx('Mở chứng từ hoàn trả')}</a>}</nav>
      </div>}
    </GlobalModal>
  </section>;
}
