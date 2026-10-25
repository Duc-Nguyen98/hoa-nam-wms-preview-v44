import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { Button, DataTable, GlobalModal, StatusBadge, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { ReceiptHeaderForm } from './ReceiptHeaderForm';
import { createReceiptBinding, receiptCodeCount, receiptLines, refreshReceiptEditor, type ReceiptEditor, type ReceiptAdapter, type ReceiptFence, type ReceiptRecord } from './receipt-binding';

const COPY = {
  'Đã đọc lại phiếu. Kiểm tra trạng thái và nội dung trước khi lưu.': 'Receipt refreshed. Check its status and your input before saving.',
  'Đã đối chiếu thao tác của phiên đã lưu trữ. Danh sách hiện tại không thay đổi.': 'The archived session operation has been reconciled. The current list is unchanged.',
  'Chưa xác minh được bằng chứng của thao tác phiên cũ. Thao tác gốc được giữ lại để kiểm tra tiếp.': 'The archived operation proof could not be verified. The original operation is retained for another check.',
  'Phiếu nhập phiên hiện tại': 'Current session receipts', 'Tạo phiếu nhập': 'Create receipt', 'Đọc lại dữ liệu': 'Refresh data',
  'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử trước khi tạo phiếu.': 'No active session. Set it up in the testing area before creating receipts.',
  'Đang đọc dữ liệu…': 'Loading data…', 'Chưa có phiếu nhập trong phiên hiện tại.': 'No receipts in the current session.',
  'Kiểm tra lại thao tác': 'Check pending operation', 'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.': 'The outcome is unknown. Check the same operation before continuing.',
  'Phiếu': 'Receipt', 'Nguồn / Tham chiếu': 'Source / Reference', 'Trạng thái': 'Status', 'Mã đã ghi nhận': 'Recorded codes', 'Thao tác': 'Actions',
  'Xem': 'View', 'Nháp': 'Draft', 'Đang ghi nhận': 'Scanning', 'Đã gửi từ App': 'Submitted from App', 'Đã nhập kho': 'Posted',
  'Sản phẩm': 'Products', 'Linh kiện': 'Components', 'Loại phiếu': 'Receipt type', 'Nguồn nhập': 'Source', 'Tham chiếu': 'Reference',
  'Chi tiết phiếu nhập': 'Receipt details', 'Đóng': 'Close', 'Sửa thông tin': 'Edit header', 'Xác nhận nhập kho': 'Post receipt',
  'Chỉ xác nhận khi phiếu đã được App gửi đầy đủ. Thao tác này làm tăng tồn kho.': 'Post only after the App has submitted the complete receipt. This operation increases stock.',
  'Chờ App ghi nhận mã và gửi phiếu trước khi xác nhận nhập kho.': 'Waiting for the App to record codes and submit the receipt before posting.',
  'Chưa ghi nhận mã.': 'No codes recorded.', 'SKU': 'SKU', 'Mã vật lý / BOX': 'Physical / BOX code', 'Số lượng': 'Quantity', 'Đơn vị tính': 'Unit',
  'Hồ sơ SKU không khả dụng': 'SKU unavailable', 'Mã không khả dụng': 'Code unavailable',
  'Phiếu không còn thuộc phiên hiện tại. Đóng và đọc lại dữ liệu.': 'The receipt is no longer in this session. Close and refresh the data.',
  'Sửa thông tin phiếu nhập': 'Edit receipt header', 'Hủy': 'Cancel', 'Đã lưu phiếu nhập.': 'Receipt saved.',
  'Không thể lưu. Nội dung nhập được giữ lại. Đọc lại dữ liệu trước khi thử lại.': 'Unable to save. Your input is retained. Refresh the data before retrying.',
  'Phiếu hoặc phiên làm việc đã thay đổi. Đóng biểu mẫu và đọc lại dữ liệu.': 'The receipt or session changed. Close the form and refresh the data.',
  'Quyền thao tác hiện không khả dụng.': 'This action is currently unavailable.', 'Chưa thể đọc dữ liệu. Vui lòng thử lại.': 'Unable to read data. Please retry.',
  'Chỉ sửa khi phiếu còn nháp và chưa ghi nhận mã.': 'Edit is allowed only for an unscanned draft.',
  'Số bút toán nhập kho': 'Receipt stock events', 'Chỉ xem danh sách tồn và báo cáo sau khi dữ liệu phiên đã được liên kết.': 'Inventory and report views require the session data binding.',
};
const STATUS = { DRAFT: 'Nháp', SCANNING: 'Đang ghi nhận', SUBMITTED: 'Đã gửi từ App', POSTED: 'Đã nhập kho' } as const;
function message(code: string) {
  if (!code) return '';
  if (code === 'ARCHIVED_PROOF_UNAVAILABLE') return 'Chưa xác minh được bằng chứng của thao tác phiên cũ. Thao tác gốc được giữ lại để kiểm tra tiếp.';
  if (code === 'OUTCOME_UNKNOWN' || code.startsWith('RECOVERY_')) return 'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.';
  if (code.includes('STALE') || code === 'SUBMISSION_CHANGED') return 'Phiếu hoặc phiên làm việc đã thay đổi. Đóng biểu mẫu và đọc lại dữ liệu.';
  if (['COMMAND_UNAVAILABLE', 'SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN', 'CONFIRMATION_REQUIRED'].includes(code)) return 'Quyền thao tác hiện không khả dụng.';
  if (code === 'RECEIPT_HEADER_LOCKED') return 'Chỉ sửa khi phiếu còn nháp và chưa ghi nhận mã.';
  if (code === 'APP_SUBMISSION_REQUIRED' || code === 'RECEIPT_NOT_POSTABLE') return 'Chờ App ghi nhận mã và gửi phiếu trước khi xác nhận nhập kho.';
  return 'Không thể lưu. Nội dung nhập được giữ lại. Đọc lại dữ liệu trước khi thử lại.';
}
export function OperationalReceipts({ adapter: supplied, notify }: { adapter?: ReceiptAdapter; notify: (message: string) => void }) {
  const tx = useUiCopy(COPY);
  const adapter = useMemo(() => supplied ?? createOperationalWebAdapter(undefined, { scope: 'S12' }), [supplied]);
  const controller = useMemo(() => {
    const catalog = createCatalogCreateAdapter('sku');
    return createReceiptBinding(adapter, () => catalog.readSnapshot());
  }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [selected, setSelected] = useState<string | null>(null), [editor, setEditor] = useState<ReceiptEditor | null>(null);
  const [post, setPost] = useState<{ id: string; version: number; fence: ReceiptFence } | null>(null);
  const [editorMessage, setEditorMessage] = useState('');
  const snapshot = state.snapshot, row = snapshot?.receipts.find(r => r.id === selected);
  const archivedInfo = state.archivedReconciled && <p role="status">{tx('Đã đối chiếu thao tác của phiên đã lưu trữ. Danh sách hiện tại không thay đổi.')}</p>;
  const locked = state.busy || state.recovery || !snapshot;
  useEffect(() => {
    void controller.resume();
    const refresh = () => { if (document.visibilityState === 'visible') void controller.load(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  useEffect(() => {
    if (!state.acceptedSequence) return;
    if (state.acceptedLocal) { setSelected(state.acceptedId); setEditor(null); setPost(null); }
    else if (!editor && !post) setSelected(state.acceptedId);
  }, [state.acceptedId, state.acceptedSequence, state.acceptedLocal]);
  function create() {
    if (locked || !snapshot?.scenario) return;
    setEditorMessage('');
    setEditor({ context: { intent: 'create' }, draft: { mode: '', sourceText: '', referenceText: '' }, fence: snapshot.token });
  }
  function edit() {
    if (locked || !row || !snapshot) return;
    setEditor({ context: { intent: 'update', receiptId: row.id, mode: row.data.mode, receiptStatus: row.data.status, scanCount: receiptCodeCount(snapshot, row.id) },
      draft: { boundReceiptId: row.id, mode: row.data.mode, sourceText: row.data.sourceText, referenceText: row.data.referenceText }, fence: snapshot.token, version: row.version });
  }
  async function refreshEditor() {
    if (!editor || state.busy) return;
    await controller.load();
    const next = controller.getSnapshot();
    if (!next.snapshot || next.error || next.recovery) return;
    try { setEditor(refreshReceiptEditor(editor, next.snapshot)); setEditorMessage('Đã đọc lại phiếu. Kiểm tra trạng thái và nội dung trước khi lưu.'); }
    catch { setEditorMessage('Phiếu hoặc phiên làm việc đã thay đổi. Đóng biểu mẫu và đọc lại dữ liệu.'); }
  }
  async function saved(run: () => Promise<void>) {
    const before = controller.getSnapshot().acceptedSequence; await run();
    if (controller.getSnapshot().acceptedSequence > before) notify(tx('Đã lưu phiếu nhập.'));
  }
  const badge = (record: ReceiptRecord) => <StatusBadge tone={record.data.status === 'POSTED' ? 'success' : record.data.status === 'DRAFT' ? 'neutral' : 'warning'}>{tx(STATUS[record.data.status])}</StatusBadge>;
  const columns: TableColumn<ReceiptRecord>[] = [
    { id: 'receipt', heading: tx('Phiếu'), render: r => <strong>{r.data.code}</strong> },
    { id: 'source', heading: tx('Nguồn / Tham chiếu'), render: r => <span className="s12-stack"><span>{r.data.sourceText}</span><span>{r.data.referenceText || '—'}</span></span> },
    { id: 'status', heading: tx('Trạng thái'), render: badge },
    { id: 'codes', heading: tx('Mã đã ghi nhận'), render: r => snapshot ? receiptCodeCount(snapshot, r.id) : '—' },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', render: r => <Button variant="ghost" disabled={state.busy} onClick={() => setSelected(r.id)}>{tx('Xem')}</Button> },
  ];
  const lines = row && snapshot ? receiptLines(snapshot, row.id) : [];
  return <section className="s12-list hn-premium-panel" aria-label={tx('Phiếu nhập phiên hiện tại')} data-operational-receipts>
    <h2>{tx('Phiếu nhập phiên hiện tại')}</h2>
    <div className="s12-action-row"><Button disabled={locked || !snapshot?.scenario} onClick={create}>{tx('Tạo phiếu nhập')}</Button><Button variant="secondary" disabled={state.busy} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button></div>
    {state.busy && <p role="status">{tx('Đang đọc dữ liệu…')}</p>}
    {archivedInfo}
    {state.error && <p role="alert">{tx(message(state.error))}</p>}
    {state.recovery && <Button disabled={state.busy} onClick={() => void controller.retry()}>{tx('Kiểm tra lại thao tác')}</Button>}
    {snapshot && !snapshot.scenario && <p role="status">{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử trước khi tạo phiếu.')}</p>}
    {snapshot?.scenario && <DataTable caption={tx('Phiếu nhập phiên hiện tại')} captionVisibility="sr-only" columns={columns} rows={snapshot.receipts} rowKey={r => r.id} appearance="refined" busy={state.busy} emptyContent={<p>{tx('Chưa có phiếu nhập trong phiên hiện tại.')}</p>} />}
    <GlobalModal open={!!selected && !editor && !post} title={tx('Chi tiết phiếu nhập')} onClose={() => { if (!state.busy) setSelected(null); }} size="large" footer={<Button disabled={state.busy} onClick={() => setSelected(null)}>{tx('Đóng')}</Button>}>
      {!row || !snapshot ? <p role="status">{tx('Phiếu không còn thuộc phiên hiện tại. Đóng và đọc lại dữ liệu.')}</p> : <>
        <dl className="s12-detail__fields" data-operational-receipt-id={row.id}><div><dt>{tx('Phiếu')}</dt><dd>{row.data.code}</dd></div><div><dt>{tx('Loại phiếu')}</dt><dd>{tx(row.data.mode === 'PRODUCT' ? 'Sản phẩm' : 'Linh kiện')}</dd></div><div><dt>{tx('Nguồn nhập')}</dt><dd>{row.data.sourceText}</dd></div><div><dt>{tx('Tham chiếu')}</dt><dd>{row.data.referenceText || '—'}</dd></div><div><dt>{tx('Trạng thái')}</dt><dd>{badge(row)}</dd></div><div><dt>{tx('Số bút toán nhập kho')}</dt><dd>{row.data.postedEventIds.length}</dd></div></dl>
        {!lines.length ? <p>{tx('Chưa ghi nhận mã.')}</p> : <DataTable caption={tx('Mã đã ghi nhận')} rows={lines} rowKey={line => line.id} columns={[
          { id: 'sku', heading: tx('SKU'), render: line => state.catalog?.skus.find(sku => sku.id === line.data.skuId)?.code ?? tx('Hồ sơ SKU không khả dụng') },
          { id: 'physical', heading: tx('Mã vật lý / BOX'), render: line => line.data.boxId ? snapshot.boxes.find(box => box.id === line.data.boxId)?.data.physicalCode ?? tx('Mã không khả dụng') : line.data.physicalIds.map(id => snapshot.physical.find(p => p.id === id)?.data.physicalCode ?? tx('Mã không khả dụng')).join(', ') },
          { id: 'quantity', heading: tx('Số lượng'), render: line => line.data.quantity }, { id: 'unit', heading: tx('Đơn vị tính'), render: line => line.data.unit },
        ]} />}
        {row.data.status === 'DRAFT' && !receiptCodeCount(snapshot, row.id) && <Button disabled={locked} onClick={edit}>{tx('Sửa thông tin')}</Button>}
        {row.data.status === 'SUBMITTED' ? <Button disabled={locked || !row.data.appSubmissionId || row.data.submittedVersion !== row.version || !row.data.submittedHash} onClick={() => setPost({ id: row.id, version: row.version, fence: snapshot.token })}>{tx('Xác nhận nhập kho')}</Button> : row.data.status !== 'POSTED' && <p>{tx('Chờ App ghi nhận mã và gửi phiếu trước khi xác nhận nhập kho.')}</p>}
      </>}
    </GlobalModal>
    <GlobalModal open={!!editor} title={tx(editor?.context.intent === 'update' ? 'Sửa thông tin phiếu nhập' : 'Tạo phiếu nhập')} onClose={() => { if (!state.busy) setEditor(null); }}>
      {editor && <ReceiptHeaderForm context={snapshot && snapshot.token.epoch === editor.fence.epoch && snapshot.token.scenarioId === editor.fence.scenarioId && snapshot.token.generation === editor.fence.generation ? editor.context : null} draft={editor.draft} status={state.busy ? 'submitting' : state.recovery ? 'unknown' : 'idle'} error={state.error ? tx(message(state.error)) : null} extraActions={<><Button variant="secondary" disabled={state.busy || state.recovery} onClick={() => void refreshEditor()}>{tx('Đọc lại dữ liệu')}</Button>{state.recovery && <Button disabled={state.busy} onClick={() => void controller.retry()}>{tx('Kiểm tra lại thao tác')}</Button>}</>} onDraftChange={draft => setEditor(previous => previous && { ...previous, draft })} onCancel={() => { if (!state.busy) setEditor(null); }} onSubmit={submission => void saved(() => controller.saveHeader(submission, editor.fence, editor.version))} />}
      {archivedInfo}
      {editorMessage && <p role="status">{tx(editorMessage)}</p>}
    </GlobalModal>
    <GlobalModal open={!!post} title={tx('Xác nhận nhập kho')} onClose={() => { if (!state.busy) setPost(null); }} footer={<><Button variant="secondary" disabled={state.busy} onClick={() => setPost(null)}>{tx('Hủy')}</Button><Button disabled={locked} onClick={() => { if (post) void saved(() => controller.post(post.id, post.version, post.fence)); }}>{tx('Xác nhận nhập kho')}</Button></>}>
      {archivedInfo}
      <p>{tx('Chỉ xác nhận khi phiếu đã được App gửi đầy đủ. Thao tác này làm tăng tồn kho.')}</p>{state.error && <p role="alert">{tx(message(state.error))}</p>}
      {state.recovery && <Button disabled={state.busy} onClick={() => void controller.retry()}>{tx('Kiểm tra lại thao tác')}</Button>}
    </GlobalModal>
  </section>;
}
