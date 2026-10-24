import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { Button, DataTable, GlobalModal, StatusBadge, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { boxQuantity, createPutawayCreateBinding, eligiblePutawayBoxes, putawaySelectionError, refreshPutawaySelection, type PutawayBox, type PutawayCreateAdapter, type PutawaySelection } from './putaway-create-binding';

const COPY = {
  'BOX chờ xếp khay phiên hiện tại': 'Current session putaway queue', 'Đọc lại dữ liệu': 'Refresh data', 'Đang đọc dữ liệu…': 'Loading data…',
  'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử trước khi tạo lệnh.': 'No active session. Set it up in the testing area before creating tasks.',
  'Chưa có BOX đã nhập kho đủ điều kiện trong phiên hiện tại.': 'No eligible posted BOX in the current session.',
  'Mã BOX': 'BOX code', 'SKU / Linh kiện': 'SKU / Component', 'Phiếu nhập nguồn': 'Source receipt', 'Số lượng hiện tại': 'Current quantity', 'Đơn vị tính': 'Unit', 'Thao tác': 'Actions',
  'Hồ sơ SKU không khả dụng': 'SKU unavailable', 'Phiếu không khả dụng': 'Receipt unavailable', 'Tạo lệnh': 'Create task',
  'Xác nhận tạo lệnh xếp khay': 'Confirm putaway task creation', 'Tạo lệnh cho toàn bộ BOX. Chọn khay ở bước xác nhận lệnh; tạo lệnh không thay đổi tồn kho.': 'Create a task for the whole BOX. Select the tray when confirming the task; creating the task does not change stock.',
  'Hủy': 'Cancel', 'Đóng': 'Close', 'Kiểm tra lại thao tác': 'Check pending operation',
  'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.': 'The outcome is unknown. Check the same operation before continuing.',
  'BOX hoặc phiên làm việc đã thay đổi. Đọc lại dữ liệu và kiểm tra trước khi tạo lệnh.': 'The BOX or session changed. Refresh and check the data before creating the task.',
  'BOX đã có lệnh nháp hoặc không còn đủ điều kiện. Đọc lại danh sách.': 'The BOX already has a draft task or is no longer eligible. Refresh the list.',
  'Quyền thao tác hiện không khả dụng.': 'This action is currently unavailable.',
  'Chưa thể hoàn tất. Lựa chọn được giữ lại. Đọc lại dữ liệu trước khi thử lại.': 'Unable to complete the operation. Your selection is retained. Refresh before retrying.',
  'Đã đọc lại BOX. Kiểm tra số lượng trước khi tạo lệnh.': 'BOX refreshed. Check the quantity before creating the task.',
  'Đã tạo lệnh xếp khay.': 'Putaway task created.', 'Lệnh xếp khay đã ghi nhận': 'Recorded putaway task', 'Mã lệnh': 'Task ID', 'Trạng thái': 'Status',
  'Nháp': 'Draft', 'Đã xác nhận': 'Confirmed', 'Đã hủy': 'Cancelled', 'Khay': 'Tray', 'Chưa chọn khay': 'No tray selected', 'Số lượng khi tạo': 'Quantity at creation',
  'Lệnh xếp khay': 'Putaway orders', 'Lệnh không còn thuộc phiên hiện tại. Đóng và đọc lại dữ liệu.': 'The task is no longer in the current session. Close and refresh.',
  'Đã đối chiếu thao tác của phiên đã lưu trữ. Danh sách hiện tại không thay đổi.': 'The archived session operation has been reconciled. The current list is unchanged.',
  'Chưa xác minh được bằng chứng của thao tác phiên cũ. Thao tác gốc được giữ lại để kiểm tra tiếp.': 'The archived operation proof could not be verified. The original operation is retained for another check.',
};
const STATUS = { DRAFT: 'Nháp', CONFIRMED: 'Đã xác nhận', CANCELLED: 'Đã hủy' } as const;
function message(code: string) {
  if (code === 'ARCHIVED_PROOF_UNAVAILABLE') return 'Chưa xác minh được bằng chứng của thao tác phiên cũ. Thao tác gốc được giữ lại để kiểm tra tiếp.';
  if (code === 'OUTCOME_UNKNOWN' || code.startsWith('RECOVERY_')) return 'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.';
  if (code.includes('STALE')) return 'BOX hoặc phiên làm việc đã thay đổi. Đọc lại dữ liệu và kiểm tra trước khi tạo lệnh.';
  if (['BOX_NOT_FOUND', 'BOX_NOT_ELIGIBLE', 'BOX_HAS_ACTIVE_TASK'].includes(code)) return 'BOX đã có lệnh nháp hoặc không còn đủ điều kiện. Đọc lại danh sách.';
  if (['COMMAND_UNAVAILABLE', 'SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN', 'CONFIRMATION_REQUIRED'].includes(code)) return 'Quyền thao tác hiện không khả dụng.';
  return 'Chưa thể hoàn tất. Lựa chọn được giữ lại. Đọc lại dữ liệu trước khi thử lại.';
}
interface Confirmation { selection: PutawaySelection; code: string; sku: string; receipt: string; quantity: number; unit: string }
export function OperationalPutawayQueue({ adapter: supplied, orderRoute, notify }: { adapter?: PutawayCreateAdapter; orderRoute?: string; notify: (message: string) => void }) {
  const tx = useUiCopy(COPY);
  const adapter = useMemo(() => supplied ?? createOperationalWebAdapter(undefined, { scope: 'S13' }), [supplied]);
  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createPutawayCreateBinding(adapter, () => catalog.readSnapshot()); }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null), [selectedTask, setSelectedTask] = useState<string | null>(null), [selectionMessage, setSelectionMessage] = useState('');
  const accepted = useRef(0), snapshot = state.snapshot;
  const locked = state.busy || state.recovery || !snapshot;
  const confirmationError = confirmation && snapshot && !locked ? putawaySelectionError(confirmation.selection, snapshot) : '';
  const task = snapshot?.putaways.find(row => row.id === selectedTask);
  const boxes = snapshot ? eligiblePutawayBoxes(snapshot) : [];
  useEffect(() => {
    accepted.current = 0;
    void controller.resume();
    const refresh = () => { if (document.visibilityState === 'visible') void controller.load(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  useEffect(() => {
    if (state.acceptedSequence <= accepted.current) return;
    accepted.current = state.acceptedSequence;
    if (state.acceptedLocal) { setSelectedTask(state.acceptedId); setConfirmation(null); setSelectionMessage(''); notify(tx('Đã tạo lệnh xếp khay.')); }
    else if (!confirmation && !selectedTask) setSelectedTask(state.acceptedId);
  }, [state.acceptedSequence, state.acceptedId, state.acceptedLocal, confirmation, selectedTask, notify, tx]);
  function context(box: PutawayBox, selection: PutawaySelection): Confirmation {
    const current = controller.getSnapshot(), view = current.snapshot!;
    const sku = current.catalog?.skus.find(row => row.id === box.data.skuId);
    return { selection, code: box.data.physicalCode, sku: sku ? `${sku.code} · ${sku.name}` : tx('Hồ sơ SKU không khả dụng'),
      receipt: view.receipts.find(row => row.id === box.data.sourceReceiptId)?.data.code ?? tx('Phiếu không khả dụng'), quantity: boxQuantity(view, box.id), unit: box.data.unit };
  }
  function select(box: PutawayBox) {
    if (locked || !snapshot) return;
    setSelectionMessage(''); setConfirmation(context(box, { boxId: box.id, version: box.version, fence: { ...snapshot.token } }));
  }
  async function refreshSelection() {
    if (!confirmation || state.busy) return;
    await controller.load();
    const next = controller.getSnapshot();
    if (!next.snapshot || next.error || next.recovery) return;
    try {
      const selection = refreshPutawaySelection(confirmation.selection, next.snapshot), box = next.snapshot.boxes.find(row => row.id === selection.boxId)!;
      setConfirmation(context(box, selection)); setSelectionMessage('Đã đọc lại BOX. Kiểm tra số lượng trước khi tạo lệnh.');
    } catch { setSelectionMessage('BOX hoặc phiên làm việc đã thay đổi. Đọc lại dữ liệu và kiểm tra trước khi tạo lệnh.'); }
  }
  const columns: TableColumn<PutawayBox>[] = [
    { id: 'box', heading: tx('Mã BOX'), render: box => <strong>{box.data.physicalCode}</strong> },
    { id: 'sku', heading: tx('SKU / Linh kiện'), render: box => { const sku = state.catalog?.skus.find(row => row.id === box.data.skuId); return sku ? <span className="s13-stack"><strong>{sku.code}</strong><span>{sku.name}</span></span> : tx('Hồ sơ SKU không khả dụng'); } },
    { id: 'receipt', heading: tx('Phiếu nhập nguồn'), render: box => snapshot?.receipts.find(row => row.id === box.data.sourceReceiptId)?.data.code ?? tx('Phiếu không khả dụng') },
    { id: 'quantity', heading: tx('Số lượng hiện tại'), align: 'end', render: box => snapshot ? boxQuantity(snapshot, box.id) : '—' },
    { id: 'unit', heading: tx('Đơn vị tính'), render: box => box.data.unit },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', render: box => <Button variant="ghost" disabled={locked} onClick={() => select(box)}>{tx('Tạo lệnh')}</Button> },
  ];
  const feedback = <>{state.archivedReconciled && <p role="status">{tx('Đã đối chiếu thao tác của phiên đã lưu trữ. Danh sách hiện tại không thay đổi.')}</p>}{state.error && <p role="alert">{tx(message(state.error))}</p>}{state.recovery && <Button disabled={state.busy} onClick={() => void controller.retry()}>{tx('Kiểm tra lại thao tác')}</Button>}</>;
  return <section className="s13-list hn-premium-panel s13-operational" aria-label={tx('BOX chờ xếp khay phiên hiện tại')} data-operational-putaway-queue>
    <div className="s13-operational__heading"><h2>{tx('BOX chờ xếp khay phiên hiện tại')}</h2><Button variant="secondary" disabled={state.busy} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button></div>
    {state.busy && <p role="status">{tx('Đang đọc dữ liệu…')}</p>}{feedback}
    {snapshot && !snapshot.scenario && <p role="status">{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử trước khi tạo lệnh.')}</p>}
    {snapshot?.scenario && <DataTable caption={tx('BOX chờ xếp khay phiên hiện tại')} captionVisibility="sr-only" columns={columns} rows={boxes} rowKey={box => box.id} appearance="refined" busy={state.busy} emptyContent={<p>{tx('Chưa có BOX đã nhập kho đủ điều kiện trong phiên hiện tại.')}</p>} />}
    <GlobalModal open={!!confirmation} title={tx('Xác nhận tạo lệnh xếp khay')} onClose={() => { if (!state.busy) setConfirmation(null); }} footer={<><Button variant="secondary" disabled={state.busy} onClick={() => setConfirmation(null)}>{tx('Hủy')}</Button><Button disabled={locked || !!confirmationError} onClick={() => { if (confirmation) void controller.create(confirmation.selection); }}>{tx('Tạo lệnh')}</Button></>}>
      {confirmation && <><p>{tx('Tạo lệnh cho toàn bộ BOX. Chọn khay ở bước xác nhận lệnh; tạo lệnh không thay đổi tồn kho.')}</p><dl className="s13-operational__fields" data-putaway-create-box-id={confirmation.selection.boxId}>
        <div><dt>{tx('Mã BOX')}</dt><dd>{confirmation.code}</dd></div><div><dt>{tx('SKU / Linh kiện')}</dt><dd>{confirmation.sku}</dd></div><div><dt>{tx('Phiếu nhập nguồn')}</dt><dd>{confirmation.receipt}</dd></div><div><dt>{tx('Số lượng hiện tại')}</dt><dd>{confirmation.quantity} {confirmation.unit}</dd></div>
      </dl></>}{feedback}{confirmationError && !state.error && <p role="alert">{tx(message(confirmationError))}</p>}{selectionMessage && !confirmationError && <p role="status">{tx(selectionMessage)}</p>}
      <Button variant="secondary" disabled={state.busy || state.recovery} onClick={() => void refreshSelection()}>{tx('Đọc lại dữ liệu')}</Button>
    </GlobalModal>
    <GlobalModal open={!!selectedTask && !confirmation} title={tx('Lệnh xếp khay đã ghi nhận')} onClose={() => { if (!state.busy) setSelectedTask(null); }} footer={<Button disabled={state.busy} onClick={() => setSelectedTask(null)}>{tx('Đóng')}</Button>}>
      {!task || !snapshot ? <p role="status">{tx('Lệnh không còn thuộc phiên hiện tại. Đóng và đọc lại dữ liệu.')}</p> : <>
        <dl className="s13-operational__fields" data-putaway-task-id={task.id}><div><dt>{tx('Mã lệnh')}</dt><dd>{task.id}</dd></div><div><dt>{tx('Mã BOX')}</dt><dd>{snapshot.boxes.find(box => box.id === task.data.boxId)?.data.physicalCode ?? '—'}</dd></div><div><dt>{tx('Phiếu nhập nguồn')}</dt><dd>{snapshot.receipts.find(receipt => receipt.id === task.data.receiptId)?.data.code ?? '—'}</dd></div><div><dt>{tx('Số lượng khi tạo')}</dt><dd>{task.data.quantityAtCreate}</dd></div><div><dt>{tx('Trạng thái')}</dt><dd><StatusBadge tone={task.data.status === 'CONFIRMED' ? 'success' : 'neutral'}>{tx(STATUS[task.data.status])}</StatusBadge></dd></div><div><dt>{tx('Khay')}</dt><dd>{task.data.trayId ?? tx('Chưa chọn khay')}</dd></div></dl>
        {orderRoute && <a href={orderRoute}>{tx('Lệnh xếp khay')}</a>}
      </>}{feedback}
    </GlobalModal>
  </section>;
}
