import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { Button, DataTable, GlobalModal, StatusBadge, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { createOutboundBinding, type OutboundAdapter, type OutboundIntent, type OutboundRecord } from './outbound-binding';
import { outboundErrorMessage, outboundReadControls } from './outbound-feedback';

export const OUTBOUND_OPERATIONAL_COPY = {
  'Phiếu xuất phiên hiện tại': 'Current session outbounds', 'Danh sách tham chiếu': 'Reference list',
  'Đọc lại dữ liệu': 'Refresh data', 'Đang đọc dữ liệu…': 'Loading data…',
  'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.': 'No active session. Set it up in the testing area.',
  'Chưa có phiếu xuất trong phiên hiện tại.': 'No outbounds in the current session.',
  'Phiếu xuất': 'Outbound', 'Người nhận': 'Recipient', 'Trạng thái': 'Status', 'Thao tác': 'Actions', 'Xem': 'View',
  'Nháp': 'Draft', 'Đang quét': 'Scanning', 'Đã gửi từ App': 'Submitted from App', 'Sẵn sàng xuất': 'Ready to post', 'Đã xuất kho': 'Posted',
  'Chi tiết phiếu xuất': 'Outbound details', 'Đóng': 'Close', 'Hủy': 'Cancel', 'Mã toa yêu cầu': 'App request',
  'Tiếp nhận phiếu': 'Receive outbound', 'Xác nhận xuất kho': 'Post outbound',
  'Tiếp nhận phiếu App đã gửi. Tồn kho chưa thay đổi.': 'Receive the submitted App outbound. Stock remains unchanged.',
  'Xác nhận xuất đúng các mã đã được App gửi. Thao tác này làm giảm tồn kho.': 'Post the exact codes submitted by the App. This operation reduces stock.',
  'Chờ App quét và gửi đủ mã trước khi tiếp nhận.': 'Wait for the App to scan and submit all required codes before receiving.',
  'Người nhận tại thời điểm App gửi': 'Recipient at App submission', 'Người nhận hiện tại': 'Current recipient',
  'Hồ sơ người nhận không khả dụng': 'Recipient unavailable', 'Địa chỉ': 'Address', 'Liên hệ': 'Contact',
  'SKU': 'SKU', 'Số lượng yêu cầu': 'Requested quantity', 'Mã đã chọn': 'Allocated codes', 'Số bút toán xuất kho': 'Outbound stock events',
  'Hồ sơ SKU không khả dụng': 'SKU unavailable', 'Mã không khả dụng': 'Code unavailable',
  'Phiếu không còn thuộc phiên hiện tại. Đóng và đọc lại dữ liệu.': 'This outbound is no longer in the current session. Close and refresh.',
  'Kiểm tra lại thao tác': 'Check pending operation',
  'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.': 'The outcome is unknown. Check the same operation before continuing.',
  'Chưa đọc được dữ liệu. Chọn Đọc lại dữ liệu để thử lại.': 'Unable to load data. Select Refresh data to try again.',
  'Phiếu hoặc phiên đã thay đổi. Đóng xác nhận, đọc lại dữ liệu và kiểm tra phiếu trước khi thao tác lại.': 'The outbound or session changed. Close confirmation, refresh and review the outbound before acting again.',
  'Quyền thao tác hiện không khả dụng.': 'This action is currently unavailable.',
  'Không thể hoàn tất. Đọc lại dữ liệu và kiểm tra phiếu trước khi thử lại.': 'Unable to complete. Refresh and review the outbound before retrying.',
  'Đã đối chiếu thao tác của phiên đã lưu trữ. Danh sách hiện tại không thay đổi.': 'The archived session operation has been reconciled. The current list is unchanged.',
  'Chưa xác minh được bằng chứng của thao tác phiên cũ. Thao tác gốc được giữ lại.': 'The archived operation proof could not be verified. The original operation is retained.',
  'Đã tiếp nhận phiếu xuất.': 'Outbound received.', 'Đã xác nhận xuất kho.': 'Outbound posted.',
};
const STATUS = { DRAFT: 'Nháp', SCANNING: 'Đang quét', SUBMITTED: 'Đã gửi từ App', READY: 'Sẵn sàng xuất', POSTED: 'Đã xuất kho' } as const;
function frozenRecipient(row: OutboundRecord) {
  const value = row.data.recipientSnapshot;
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  return data.id === row.data.recipientId && typeof data.name === 'string' && typeof data.code === 'string'
    ? { code: data.code, name: data.name, address: typeof data.address === 'string' ? data.address : '', contact: typeof data.contact === 'string' ? data.contact : '', phone: typeof data.phone === 'string' ? data.phone : '' } : null;
}
export function OperationalOutbounds({ adapter: supplied, notify }: { adapter?: OutboundAdapter; notify: (message: string) => void }) {
  const tx = useUiCopy(OUTBOUND_OPERATIONAL_COPY);
  const adapter = useMemo(() => supplied ?? createOperationalWebAdapter(undefined, { scope: 'S15' }), [supplied]);
  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createOutboundBinding(adapter, () => catalog.readSnapshot()); }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [selected, setSelected] = useState<string | null>(null), [intent, setIntent] = useState<OutboundIntent | null>(null);
  const panel = useRef<HTMLElement>(null), returnSelection = useRef<{ id: string; fence: OutboundIntent['fence'] } | null>(null);
  const snapshot = state.snapshot, row = snapshot?.outbounds.find(r => r.id === selected), locked = state.busy || state.recovery || !snapshot;
  useEffect(() => {
    void controller.resume();
    const refresh = () => { if (document.visibilityState === 'visible') void controller.refresh(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  useEffect(() => {
    if (!state.acceptedSequence) return;
    if (state.acceptedLocal) { setSelected(state.acceptedId); setIntent(null); }
    else if (!intent) setSelected(previous => previous ?? state.acceptedId);
  }, [state.acceptedId, state.acceptedSequence, state.acceptedLocal]);
  function resolveDetailReturnFocus() {
    const root = panel.current, target = returnSelection.current, token = snapshot?.token;
    if (!root) return null;
    // Opening confirmation closes the detail dialog. When it reopens, its
    // native opener belongs to the now-hidden confirmation; retain the row.
    const sameSession = target && token && target.fence.epoch === token.epoch
      && target.fence.scenarioId === token.scenarioId && target.fence.generation === token.generation;
    const action = sameSession && snapshot?.outbounds.some(value => value.id === target.id)
      ? [...root.querySelectorAll<HTMLElement>('[data-s15-operational-action]')]
        .find(element => element.getAttribute('data-s15-operational-action') === target.id && !element.matches(':disabled'))
      : null;
    return action ?? root.querySelector<HTMLElement>('[data-s15-operational-heading]');
  }
  async function confirm() {
    if (!intent) return;
    const before = controller.getSnapshot().acceptedSequence; await controller.act(intent);
    if (controller.getSnapshot().acceptedSequence > before) notify(tx(intent.command === 'outbound.receive' ? 'Đã tiếp nhận phiếu xuất.' : 'Đã xác nhận xuất kho.'));
  }
  const badge = (r: OutboundRecord) => <StatusBadge tone={r.data.status === 'POSTED' ? 'success' : r.data.status === 'DRAFT' ? 'neutral' : 'warning'}>{tx(STATUS[r.data.status])}</StatusBadge>;
  const recipient = (r: OutboundRecord) => r.data.recipientSnapshot ? frozenRecipient(r) : state.catalog?.recipients.find(value => value.id === r.data.recipientId);
  const columns: TableColumn<OutboundRecord>[] = [
    { id: 'code', heading: tx('Phiếu xuất'), render: r => <strong>{r.data.code}</strong> },
    { id: 'recipient', heading: tx('Người nhận'), render: r => recipient(r)?.name ?? tx('Hồ sơ người nhận không khả dụng') },
    { id: 'status', heading: tx('Trạng thái'), render: badge },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', render: r => <Button variant="ghost" disabled={state.busy} data-s15-operational-action={r.id} onClick={() => { if (snapshot) returnSelection.current = { id: r.id, fence: snapshot.token }; setSelected(r.id); }}>{tx('Xem')}</Button> },
  ];
  const archiveInfo = state.archivedReconciled && <p role="status">{tx('Đã đối chiếu thao tác của phiên đã lưu trữ. Danh sách hiện tại không thay đổi.')}</p>;
  const controls = outboundReadControls(state);
  const readControls = <><Button variant="secondary" disabled={controls.readDisabled} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button>{controls.showReconcile && <Button disabled={state.busy} onClick={() => void controller.retry()}>{tx('Kiểm tra lại thao tác')}</Button>}</>;
  const rec = row && recipient(row);
  return <section ref={panel} className="s15-list hn-premium-panel" aria-label={tx('Phiếu xuất phiên hiện tại')} data-operational-outbounds>
    <h2 tabIndex={-1} data-s15-operational-heading>{tx('Phiếu xuất phiên hiện tại')}</h2>{readControls}
    {state.busy && <p role="status">{tx('Đang đọc dữ liệu…')}</p>}{archiveInfo}
    {state.error && <p role="alert">{tx(outboundErrorMessage(state))}</p>}
    {snapshot && !snapshot.scenario && <p role="status">{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.')}</p>}
    {snapshot?.scenario && <DataTable caption={tx('Phiếu xuất phiên hiện tại')} captionVisibility="sr-only" columns={columns} rows={snapshot.outbounds} rowKey={r => r.id} appearance="refined" busy={state.busy} emptyContent={<p>{tx('Chưa có phiếu xuất trong phiên hiện tại.')}</p>} />}
    <GlobalModal resolveReturnFocus={resolveDetailReturnFocus} open={!!selected && !intent} title={tx('Chi tiết phiếu xuất')} size="large" onClose={() => { if (!state.busy) setSelected(null); }} footer={<><div className="hn-modal-footer-tools">{readControls}</div><Button disabled={state.busy} onClick={() => setSelected(null)}>{tx('Đóng')}</Button></>}>
      {!row || !snapshot ? <p role="status">{tx('Phiếu không còn thuộc phiên hiện tại. Đóng và đọc lại dữ liệu.')}</p> : <>
        <dl className="s15-detail__fields" data-operational-outbound-id={row.id}>
          <div><dt>{tx('Phiếu xuất')}</dt><dd>{row.data.code}</dd></div><div><dt>{tx('Mã toa yêu cầu')}</dt><dd>{row.data.appRequestId}</dd></div>
          <div><dt>{tx('Trạng thái')}</dt><dd>{badge(row)}</dd></div><div><dt>{tx(row.data.recipientSnapshot ? 'Người nhận tại thời điểm App gửi' : 'Người nhận hiện tại')}</dt><dd>{rec ? `${rec.code} — ${rec.name}` : tx('Hồ sơ người nhận không khả dụng')}</dd></div>
          <div><dt>{tx('Địa chỉ')}</dt><dd>{rec?.address || '—'}</dd></div><div><dt>{tx('Liên hệ')}</dt><dd>{[rec?.contact, rec?.phone].filter(Boolean).join(' · ') || '—'}</dd></div>
          <div><dt>{tx('Số bút toán xuất kho')}</dt><dd>{row.data.postedEventIds.length}</dd></div>
        </dl>
        <DataTable caption={tx('Mã đã chọn')} rows={row.data.requestedLines} rowKey={line => line.id} columns={[
          { id: 'sku', heading: tx('SKU'), render: line => state.catalog?.skus.find(sku => sku.id === line.skuId)?.code ?? tx('Hồ sơ SKU không khả dụng') },
          { id: 'quantity', heading: tx('Số lượng yêu cầu'), render: line => line.quantity },
          { id: 'physical', heading: tx('Mã đã chọn'), render: line => row.data.allocatedPhysicalIds.map(id => snapshot.physical.find(p => p.id === id)).filter(p => p?.data.skuId === line.skuId).map(p => p?.data.physicalCode ?? tx('Mã không khả dụng')).join(', ') || '—' },
        ]} />
        {['SUBMITTED', 'READY'].includes(row.data.status) ? <Button disabled={locked} onClick={() => setIntent({ id: row.id, code: row.data.code, version: row.version, fence: snapshot.token, command: row.data.status === 'SUBMITTED' ? 'outbound.receive' : 'outbound.post' })}>{tx(row.data.status === 'SUBMITTED' ? 'Tiếp nhận phiếu' : 'Xác nhận xuất kho')}</Button>
          : row.data.status !== 'POSTED' && <p>{tx('Chờ App quét và gửi đủ mã trước khi tiếp nhận.')}</p>}
      </>}
      {state.error && <p role="alert">{tx(outboundErrorMessage(state))}</p>}{archiveInfo}
    </GlobalModal>
    <GlobalModal open={!!intent} title={tx(intent?.command === 'outbound.receive' ? 'Tiếp nhận phiếu' : 'Xác nhận xuất kho')} onClose={() => { if (!state.busy) setIntent(null); }} footer={<><div className="hn-modal-footer-tools">{readControls}</div><Button variant="secondary" disabled={state.busy} onClick={() => setIntent(null)}>{tx('Hủy')}</Button><Button disabled={locked} onClick={() => void confirm()}>{tx(intent?.command === 'outbound.receive' ? 'Tiếp nhận phiếu' : 'Xác nhận xuất kho')}</Button></>}>
      <p><strong>{intent?.code}</strong></p><p>{tx(intent?.command === 'outbound.receive' ? 'Tiếp nhận phiếu App đã gửi. Tồn kho chưa thay đổi.' : 'Xác nhận xuất đúng các mã đã được App gửi. Thao tác này làm giảm tồn kho.')}</p>
      {state.error && <p role="alert">{tx(outboundErrorMessage(state))}</p>}{archiveInfo}
    </GlobalModal>
  </section>;
}
