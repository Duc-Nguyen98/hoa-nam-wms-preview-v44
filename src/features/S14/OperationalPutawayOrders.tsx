import { PageState } from '../../shared/PageState';
import { readFailureKind } from '../../shared/read-failure-kind';
import { ReadState } from '../../shared/ReadState';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Button, DataTable, GlobalModal, StatusBadge, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { availablePutawayTrays, boxQuantity, createPutawayBinding, refreshPutawayEditor, type PutawayAdapter, type PutawayEditor, type PutawayRecord } from './putaway-binding';

export const PUTAWAY_BINDING_COPY = {
  'Phiên hiện tại': 'Current session', 'Dữ liệu đã duyệt': 'Accepted data', 'Nguồn dữ liệu': 'Data source',
  'Lệnh xếp khay phiên hiện tại': 'Current session putaway orders', 'Đọc lại dữ liệu': 'Refresh data', 'Đang đọc dữ liệu…': 'Loading data…',
  'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.': 'No active session. Set it up in the testing area.',
  'Chưa có lệnh. Tạo lệnh từ Hàng chờ.': 'No orders. Create an order from the queue.', 'BOX': 'BOX', 'Phiếu nhập nguồn': 'Source receipt',
  'Số lượng khi tạo': 'Quantity at creation', 'Tồn BOX hiện tại': 'Current BOX stock', 'Trạng thái': 'Status', 'Thao tác': 'Actions', 'Xem': 'View',
  'Nháp': 'Draft', 'Đã xác nhận': 'Confirmed', 'Đã hủy': 'Cancelled', 'Khay đích': 'Destination tray', 'Chưa chọn khay': 'Select a tray',
  'Xác nhận xếp khay': 'Confirm putaway', 'Hủy lệnh': 'Cancel order', 'Lý do hủy': 'Cancellation reason', 'Đóng': 'Close', 'Quay lại': 'Back',
  'Chi tiết lệnh xếp khay': 'Putaway order details', 'Đã lưu lệnh xếp khay.': 'Putaway order saved.',
  'Lệnh không còn trong phiên hiện tại. Đóng và đọc lại dữ liệu.': 'The order is no longer in this session. Close and refresh data.',
  'Chỉ thay đổi vị trí BOX; tổng tồn kho không thay đổi.': 'Only the BOX location changes; total stock stays unchanged.',
  'Hủy lệnh không thay đổi BOX hoặc tồn kho. BOX hợp lệ có thể tạo lệnh mới từ Hàng chờ.': 'Cancellation does not change BOX or stock. Eligible BOXes can get a new order from the queue.',
  'Đã đọc lại lệnh. Nội dung nhập được giữ nguyên.': 'Order refreshed. Your input is retained.',
  'BOX đã thay đổi. Hủy lệnh và tạo lại từ Hàng chờ; đọc lại không cập nhật nội dung đã chốt của lệnh.': 'The BOX changed. Cancel and recreate the order from the queue; refreshing does not rebase its captured content.',
  'Lệnh hoặc phiên đã thay đổi. Đọc lại dữ liệu trước khi tiếp tục.': 'The order or session changed. Refresh before continuing.',
  'Khay không khả dụng. Chọn khay đang hoạt động có vị trí hợp lệ.': 'Tray unavailable. Select an active tray with an active location.',
  'Lý do phải có từ 1 đến 500 ký tự, trên một dòng.': 'Reason must contain 1 to 500 characters on one line.',
  'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.': 'Outcome unknown. Check the same operation before continuing.',
  'Kiểm tra lại thao tác': 'Check pending operation', 'Quyền thao tác hiện không khả dụng.': 'This action is currently unavailable.',
  'Chưa thể hoàn tất. Nội dung nhập được giữ lại.': 'Unable to complete. Your input is retained.',
  'Đã đối chiếu thao tác phiên cũ. Danh sách hiện tại không thay đổi.': 'Archived operation reconciled. The current list is unchanged.',
  'Chưa xác minh được bằng chứng phiên cũ. Thao tác gốc được giữ lại.': 'Archived proof could not be verified. The original operation is retained.',
  'Phiên bản BOX khi tạo / hiện tại': 'BOX version at creation / current', 'Nội dung BOX khi tạo / hiện tại': 'BOX content revision at creation / current',
  'Không có khay hợp lệ.': 'No eligible tray.', 'Không khả dụng': 'Unavailable',
  'Chưa thể đọc chi tiết. Đọc lại dữ liệu để kiểm tra.': 'Unable to read details. Refresh data to check.',
};
const STATUS = { DRAFT: 'Nháp', CONFIRMED: 'Đã xác nhận', CANCELLED: 'Đã hủy' } as const;
function message(code: string) {
  if (code === 'STALE_BOX_CONTENT') return 'BOX đã thay đổi. Hủy lệnh và tạo lại từ Hàng chờ; đọc lại không cập nhật nội dung đã chốt của lệnh.';
  if (code === 'TRAY_UNAVAILABLE') return 'Khay không khả dụng. Chọn khay đang hoạt động có vị trí hợp lệ.';
  if (code === 'VALIDATION_FAILED') return 'Lý do phải có từ 1 đến 500 ký tự, trên một dòng.';
  if (code === 'ARCHIVED_PROOF_UNAVAILABLE') return 'Chưa xác minh được bằng chứng phiên cũ. Thao tác gốc được giữ lại.';
  if (code === 'OUTCOME_UNKNOWN' || code.startsWith('RECOVERY_')) return 'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.';
  if (code.includes('STALE') || code.startsWith('TASK_')) return 'Lệnh hoặc phiên đã thay đổi. Đọc lại dữ liệu trước khi tiếp tục.';
  if (['COMMAND_UNAVAILABLE', 'SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN', 'CONFIRMATION_REQUIRED'].includes(code)) return 'Quyền thao tác hiện không khả dụng.';
  return 'Chưa thể hoàn tất. Nội dung nhập được giữ lại.';
}
export function OperationalPutawayOrders({ adapter: supplied, notify }: { adapter?: PutawayAdapter; notify: (message: string) => void }) {
  const tx = useUiCopy(PUTAWAY_BINDING_COPY);
  const adapter = useMemo(() => supplied ?? createOperationalWebAdapter(undefined, { scope: 'S14' }), [supplied]);
  const controller = useMemo(() => createPutawayBinding(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [selected, setSelected] = useState<string | null>(null), [editor, setEditor] = useState<PutawayEditor | null>(null), [editorMessage, setEditorMessage] = useState('');
  const snapshot = state.snapshot, row = snapshot?.putaways.find(r => r.id === selected), box = snapshot?.boxes.find(b => b.id === row?.data.boxId);
  const locked = state.busy || state.recovery || !snapshot;
  const trays = snapshot && row ? availablePutawayTrays(snapshot, row.data.warehouseId) : [];
  useEffect(() => { void controller.resume(); const refresh = () => { if (document.visibilityState === 'visible') void controller.load(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  useEffect(() => { if (!state.acceptedSequence) return;
    if (state.acceptedLocal) { setSelected(state.acceptedId); setEditor(null); }
    else if (!editor) setSelected(state.acceptedId);
  }, [state.acceptedSequence, state.acceptedId, state.acceptedLocal]);
  const badge = (r: PutawayRecord) => <StatusBadge tone={r.data.status === 'CONFIRMED' ? 'success' : 'neutral'}>{tx(STATUS[r.data.status])}</StatusBadge>;
  const trayLabel = (id: string | null) => (snapshot?.setupMasters.find(r => r.id === id)?.data as { code?: string } | undefined)?.code ?? '—';
  const columns: TableColumn<PutawayRecord>[] = [
    { id: 'box', heading: tx('BOX'), render: r => <strong>{snapshot?.boxes.find(b => b.id === r.data.boxId)?.data.physicalCode ?? tx('Không khả dụng')}</strong> },
    { id: 'receipt', heading: tx('Phiếu nhập nguồn'), render: r => snapshot?.receipts.find(p => p.id === r.data.receiptId)?.data.code ?? tx('Không khả dụng') },
    { id: 'quantity', heading: tx('Số lượng khi tạo'), render: r => r.data.quantityAtCreate },
    { id: 'tray', heading: tx('Khay đích'), render: r => trayLabel(r.data.trayId) },
    { id: 'status', heading: tx('Trạng thái'), render: badge },
    { id: 'actions', heading: tx('Thao tác'), kind: 'actions', render: r => <Button variant="ghost" disabled={state.busy} onClick={() => setSelected(r.id)}>{tx('Xem')}</Button> },
  ];
  function edit(action: PutawayEditor['action']) { if (locked || !row || !snapshot) return; setEditorMessage(''); setEditor({ id: row.id, version: row.version, fence: snapshot.token, action, trayId: '', reason: '' }); }
  async function refreshEditor() { if (!editor || state.busy) return; await controller.load(); const next = controller.getSnapshot(); if (!next.snapshot || next.error || next.recovery) return;
    try { setEditor(refreshPutawayEditor(editor, next.snapshot)); setEditorMessage('Đã đọc lại lệnh. Nội dung nhập được giữ nguyên.'); } catch { setEditorMessage('Lệnh hoặc phiên đã thay đổi. Đọc lại dữ liệu trước khi tiếp tục.'); }
  }
  async function save() { if (!editor) return; const before = controller.getSnapshot().acceptedSequence; await controller.save(editor); if (controller.getSnapshot().acceptedSequence > before) notify(tx('Đã lưu lệnh xếp khay.')); }
  const feedback = <>{state.archivedReconciled && <p role="status">{tx('Đã đối chiếu thao tác phiên cũ. Danh sách hiện tại không thay đổi.')}</p>}<ReadState loading={false} error={state.error} hasData={!!snapshot} loadingText={null} errorText={tx(message(state.error))}/>{state.recovery && <Button disabled={state.busy} onClick={() => void controller.retry()}>{tx('Kiểm tra lại thao tác')}</Button>}</>;
  return <section className="s14-list hn-premium-panel" data-operational-putaways aria-label={tx('Lệnh xếp khay phiên hiện tại')}>
    <h2>{tx('Lệnh xếp khay phiên hiện tại')}</h2><Button disabled={state.busy} variant="secondary" onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button>
    <ReadState loading={state.busy} hasData={!!snapshot} loadingText={tx('Đang đọc dữ liệu…')} errorText={null}/>{!editor && feedback}
    {snapshot && !snapshot.scenario && <p>{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.')}</p>}
    {snapshot?.scenario && <DataTable caption={tx('Lệnh xếp khay phiên hiện tại')} captionVisibility="sr-only" columns={columns} rows={snapshot.putaways} rowKey={r => r.id} appearance="refined" busy={state.busy} emptyContent={<p>{tx('Chưa có lệnh. Tạo lệnh từ Hàng chờ.')}</p>} />}
    <GlobalModal open={!!selected && !editor} title={tx('Chi tiết lệnh xếp khay')} onClose={() => { if (!state.busy) setSelected(null); }} size="large" footer={<><div className="hn-modal-footer-tools"><Button variant="secondary" disabled={state.busy || state.recovery} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button></div><Button disabled={state.busy} onClick={() => setSelected(null)}>{tx('Đóng')}</Button></>}>
      {feedback}
      {!row || !snapshot ? <PageState kind={state.busy ? 'loading' : state.error ? readFailureKind(state.error) : !snapshot ? 'error' : 'record-not-found'} description={tx(state.error || !snapshot ? 'Chưa thể đọc chi tiết. Đọc lại dữ liệu để kiểm tra.' : 'Lệnh không còn trong phiên hiện tại. Đóng và đọc lại dữ liệu.')} action={<Button onClick={()=>setSelected(null)}>{tx('Đóng')}</Button>}/> : <>
        <dl className="s14-operational-fields" data-putaway-id={row.id}>
          <div><dt>{tx('BOX')}</dt><dd>{box?.data.physicalCode ?? '—'}</dd></div><div><dt>{tx('Phiếu nhập nguồn')}</dt><dd>{snapshot.receipts.find(r => r.id === row.data.receiptId)?.data.code ?? '—'}</dd></div>
          <div><dt>{tx('Trạng thái')}</dt><dd>{badge(row)}</dd></div><div><dt>{tx('Khay đích')}</dt><dd>{trayLabel(row.data.trayId)}</dd></div>
          <div><dt>{tx('Số lượng khi tạo')}</dt><dd>{row.data.quantityAtCreate}</dd></div><div><dt>{tx('Tồn BOX hiện tại')}</dt><dd>{boxQuantity(snapshot, row.data.boxId)}</dd></div>
          <div><dt>{tx('Phiên bản BOX khi tạo / hiện tại')}</dt><dd>{row.data.capturedBoxVersion} / {box?.version ?? '—'}</dd></div><div><dt>{tx('Nội dung BOX khi tạo / hiện tại')}</dt><dd>{row.data.capturedContentRevision} / {box?.data.contentRevision ?? '—'}</dd></div>
          {row.data.cancellationReason && <div><dt>{tx('Lý do hủy')}</dt><dd>{row.data.cancellationReason}</dd></div>}
        </dl>{row.data.status === 'DRAFT' && <div><Button disabled={locked} onClick={() => edit('confirm')}>{tx('Xác nhận xếp khay')}</Button><Button variant="secondary" disabled={locked} onClick={() => edit('cancel')}>{tx('Hủy lệnh')}</Button></div>}
      </>}
    </GlobalModal>
    <GlobalModal open={!!editor} title={tx(editor?.action === 'confirm' ? 'Xác nhận xếp khay' : 'Hủy lệnh')} onClose={() => { if (!state.busy) setEditor(null); }} footer={<><div className="hn-modal-footer-tools"><Button variant="secondary" disabled={state.busy || state.recovery} onClick={() => void refreshEditor()}>{tx('Đọc lại dữ liệu')}</Button></div><Button variant="secondary" disabled={state.busy} onClick={() => setEditor(null)}>{tx('Quay lại')}</Button><Button disabled={locked || !row || row.data.status !== 'DRAFT' || (editor?.action === 'confirm' ? !editor.trayId : !editor?.reason.trim())} onClick={() => void save()}>{tx(editor?.action === 'confirm' ? 'Xác nhận xếp khay' : 'Hủy lệnh')}</Button></>}>
      {editor && <><p>{tx(editor.action === 'confirm' ? 'Chỉ thay đổi vị trí BOX; tổng tồn kho không thay đổi.' : 'Hủy lệnh không thay đổi BOX hoặc tồn kho. BOX hợp lệ có thể tạo lệnh mới từ Hàng chờ.')}</p>
        {editor.action === 'confirm' ? <label>{tx('Khay đích')}<select className="hn-input" value={editor.trayId} disabled={state.busy} onChange={event => setEditor({ ...editor, trayId: event.target.value })}><option value="">{tx('Chưa chọn khay')}</option>{editor.trayId && !trays.some(r => r.id === editor.trayId) && <option value={editor.trayId} disabled>{tx('Không khả dụng')}</option>}{trays.map(r => <option key={r.id} value={r.id}>{(r.data as { code: string }).code}</option>)}</select>{!trays.length && <p>{tx('Không có khay hợp lệ.')}</p>}</label> : <label>{tx('Lý do hủy')}<input className="hn-input" value={editor.reason} disabled={state.busy} onChange={event => setEditor({ ...editor, reason: event.target.value })} /></label>}
        {feedback}{editorMessage && <p role="status">{tx(editorMessage)}</p>}
      </>}
    </GlobalModal>
  </section>;
}
