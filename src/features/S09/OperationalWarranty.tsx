import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { businessHttpAdapters } from '../../data/http/business-adapters';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { Button, DataTable, GlobalModal, StatusBadge, type TableColumn } from '../../shared';
import { WarrantyDiagnosisForm } from './WarrantyDiagnosisForm';
import { canEditWarrantyDiagnosis } from './warranty-diagnosis-form';
import { caseTimeline, createWarrantyBinding, nextWarrantyState, refreshWarrantyEditor, sameWarrantyScope, warrantyLocalDate, type WarrantyCaseRecord, type WarrantyEditor, type WarrantyFence, type WarrantyOperationalAdapter } from './warranty-binding';

const COPY = {
  'Hồ sơ phiên hiện tại': 'Current session cases', 'Đọc lại dữ liệu': 'Reload data', 'Kiểm tra lại thao tác': 'Check pending operation',
  'Chưa có phiên nghiệp vụ. Thiết lập phiên trong khu vực kiểm thử trước.': 'No business scenario is active. Set it up in the testing area first.',
  'Chưa có hồ sơ. Hồ sơ phải được tiếp nhận từ App.': 'No cases. Cases must be received through the App.',
  'Đang đọc dữ liệu…': 'Loading data…', 'Hồ sơ': 'Case', 'Sản phẩm / SKU': 'Product / SKU', 'Trạng thái': 'Status', 'Tiếp nhận': 'Received',
  'Ngày dự kiến sửa xong': 'Expected finish date', 'Thao tác': 'Actions', 'Xem': 'View', 'Đóng': 'Close', 'Hủy': 'Cancel',
  'Đã tiếp nhận': 'Received', 'Đang kiểm tra': 'Checking', 'Đang sửa chữa': 'Repairing', 'Hoàn tất sửa chữa': 'Repaired', 'Đã trả khách': 'Returned',
  'Chi tiết hồ sơ bảo hành': 'Warranty case details', 'Chẩn đoán': 'Diagnose', 'Chuyển trạng thái': 'Change status',
  'Khách hàng phản ánh': 'Customer reported issue', 'Kỹ thuật viên chẩn đoán': 'Technician diagnosis', 'Các bệnh lỗi đã liên kết': 'Linked defects',
  'Chưa có chẩn đoán.': 'No diagnosis yet.', 'Lịch sử xử lý': 'Processing history', 'Người thực hiện': 'Actor', 'Thời gian': 'Time',
  'Chỉ bắt đầu sửa chữa khi có bệnh lỗi và ngày dự kiến sửa xong.': 'Repair requires defects and an expected finish date.',
  'Hồ sơ không còn thuộc phiên hiện tại. Đóng và đọc lại dữ liệu.': 'This case is no longer in the current scenario. Close and reload.',
  'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.': 'The outcome is unknown. Check the same operation before sending another.',
  'Không thể đọc hoặc lưu. Nội dung nhập được giữ lại. Hãy đọc lại dữ liệu.': 'Unable to read or save. Your input is retained. Reload the data.',
  'Hồ sơ đã thay đổi. Đọc lại hồ sơ và kiểm tra nội dung trước khi lưu.': 'The case has changed. Reload and review your input before saving.',
  'Quyền thao tác hiện không khả dụng.': 'This action is currently unavailable.',
  'Phiên nghiệp vụ đã đổi. Không thể áp dụng nội dung cũ cho phiên mới.': 'The scenario changed. The old draft cannot be applied to the new scenario.',
  'Kết quả cũ thuộc phiên đã lưu trữ. Cần đối chiếu dữ liệu lưu trữ trước khi tiếp tục.': 'The previous result belongs to an archived scenario. Archive verification is required before continuing.',
  'Hồ sơ hoàn tất hoặc đã trả khách chỉ được xem.': 'Repaired or returned cases are read-only.',
  'Bệnh lỗi không còn hoạt động. Đọc lại dữ liệu và kiểm tra lựa chọn.': 'A defect is no longer active. Reload and review the selection.',
  'Đã lưu thay đổi hồ sơ.': 'Case changes saved.',
  'Đã kiểm tra thao tác. Nội dung đang nhập vẫn được giữ; hãy đọc lại hồ sơ trước khi lưu.': 'The operation was checked. Your draft is retained; reload the case before saving.',
  'Đã đọc lại hồ sơ. Nội dung đang nhập được giữ lại; kiểm tra trước khi lưu.': 'Case reloaded. Your input was retained; review it before saving.',
  'Đã đối chiếu thao tác trong phiên lưu trữ. Dữ liệu phiên hiện tại được giữ nguyên.': 'The archived operation has been reconciled. Current scenario data is unchanged.',
  'Nhận dạng tạm': 'Temporary identity', 'Serial': 'Serial', 'Không có dữ liệu': 'Unavailable',
};
const STATES = { RECEIVED: 'Đã tiếp nhận', CHECKING: 'Đang kiểm tra', REPAIRING: 'Đang sửa chữa', REPAIRED: 'Hoàn tất sửa chữa', RETURNED: 'Đã trả khách' } as const;
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === 'string' ? value : '—';
function message(code: string) {
  if (code === 'RECOVERY_ARCHIVED_SCENARIO' || code === 'ARCHIVE_PROOF_REQUIRED') return 'Kết quả cũ thuộc phiên đã lưu trữ. Cần đối chiếu dữ liệu lưu trữ trước khi tiếp tục.';
  if (code === 'STALE_SCENARIO') return 'Phiên nghiệp vụ đã đổi. Không thể áp dụng nội dung cũ cho phiên mới.';
  if (code === 'OUTCOME_UNKNOWN' || code.startsWith('RECOVERY_')) return 'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.';
  if (code.includes('STALE') || code === 'READ_CONTEXT_CHANGED') return 'Hồ sơ đã thay đổi. Đọc lại hồ sơ và kiểm tra nội dung trước khi lưu.';
  if (['COMMAND_UNAVAILABLE','SESSION_EXPIRED','MOCK_COMMAND_FORBIDDEN','CONFIRMATION_REQUIRED'].includes(code)) return 'Quyền thao tác hiện không khả dụng.';
  if (code === 'REPAIR_REQUIREMENTS') return 'Chỉ bắt đầu sửa chữa khi có bệnh lỗi và ngày dự kiến sửa xong.';
  if (code === 'CASE_IMMUTABLE') return 'Hồ sơ hoàn tất hoặc đã trả khách chỉ được xem.';
  if (code === 'DEFECT_UNAVAILABLE') return 'Bệnh lỗi không còn hoạt động. Đọc lại dữ liệu và kiểm tra lựa chọn.';
  return 'Không thể đọc hoặc lưu. Nội dung nhập được giữ lại. Hãy đọc lại dữ liệu.';
}
export function frozenDefects(row: WarrantyCaseRecord) {
  return row.data.defectSnapshot.map(value => { const item = record(value), data = record(item.data); return { id: text(item.id), label: `${text(data.code)} · ${text(data.name)}` }; });
}
export function OperationalWarranty({ adapter, notify }: { adapter: WarrantyOperationalAdapter; notify: (message: string) => void }) {
  const tx = useUiCopy(COPY);
  const controller = useMemo(() => createWarrantyBinding(adapter, businessHttpAdapters.S02), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [selected, setSelected] = useState<string | null>(null), [editor, setEditor] = useState<WarrantyEditor | null>(null);
  const [transition, setTransition] = useState<{ id: string; version: number; fence: WarrantyFence; next: 'REPAIRING' | 'REPAIRED' | 'RETURNED' } | null>(null);
  const [localMessage, setLocalMessage] = useState('');
  const snapshot = state.snapshot, row = snapshot?.warrantyCases.find(r => r.id === selected);
  const editRow = snapshot?.warrantyCases.find(r => r.id === editor?.caseId);
  const unresolved = state.recovery.kind !== 'empty', locked = state.busy || unresolved || !snapshot;
  useEffect(() => {
    void controller.resume();
    const refresh = () => { if (document.visibilityState === 'visible') void controller.load(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  const badge = (r: WarrantyCaseRecord) => <StatusBadge tone={['REPAIRED','RETURNED'].includes(r.data.state) ? 'success' : 'neutral'}>{tx(STATES[r.data.state])}</StatusBadge>;
  const columns: TableColumn<WarrantyCaseRecord>[] = [
    { id: 'case', heading: tx('Hồ sơ'), render: r => <strong>{r.data.code}</strong> },
    { id: 'product', heading: tx('Sản phẩm / SKU'), render: r => `${text(record(r.data.productSnapshot).productName)} · ${text(record(r.data.productSnapshot).skuCode)}` },
    { id: 'state', heading: tx('Trạng thái'), render: badge },
    { id: 'received', heading: tx('Tiếp nhận'), render: r => warrantyLocalDate(r.data.receivedAt) },
    { id: 'due', heading: tx('Ngày dự kiến sửa xong'), render: r => r.data.expectedFinishDate ?? '—' },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', render: r => <Button variant="ghost" disabled={state.busy} onClick={() => { setSelected(r.id); setLocalMessage(''); }}>{tx('Xem')}</Button> },
  ];
  function openEditor() {
    if (!row || !snapshot || locked) return;
    setLocalMessage(''); setEditor({ caseId: row.id, version: row.version, fence: snapshot.token, draft: { caseId: row.id, technicianDiagnosis: row.data.technicianDiagnosis, defectIds: [...row.data.defectIds], expectedFinishDate: row.data.expectedFinishDate ?? '' } });
  }
  async function reloadEditor() {
    await controller.load(); const next = controller.getSnapshot();
    if (!next.snapshot || !editor) return;
    try { setEditor(refreshWarrantyEditor(editor, next.snapshot)); setLocalMessage('Đã đọc lại hồ sơ. Nội dung đang nhập được giữ lại; kiểm tra trước khi lưu.'); }
    catch (error) { setLocalMessage(message((error as { code: string }).code)); }
  }
  async function reconcile() {
    const result = await controller.retry();
    if (result) {
      if (result.archived) { setLocalMessage('Đã đối chiếu thao tác trong phiên lưu trữ. Dữ liệu phiên hiện tại được giữ nguyên.'); return; }
      if (editor) setLocalMessage('Đã kiểm tra thao tác. Nội dung đang nhập vẫn được giữ; hãy đọc lại hồ sơ trước khi lưu.');
      else { setSelected(result.caseId); setTransition(null); notify(tx('Đã lưu thay đổi hồ sơ.')); }
    }
  }
  const retry = unresolved && <Button disabled={state.busy} onClick={() => void reconcile()}>{tx('Kiểm tra lại thao tác')}</Button>;
  const next = row ? nextWarrantyState(row.data.state) : null;
  return <section className="s09-list" data-operational-warranty aria-label={tx('Hồ sơ phiên hiện tại')}>
    <h2>{tx('Hồ sơ phiên hiện tại')}</h2><Button variant="secondary" disabled={state.busy} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button>{retry}
    {state.busy && <p role="status">{tx('Đang đọc dữ liệu…')}</p>}{state.error && <p role="alert">{tx(message(state.error))}</p>}{localMessage && !editor && <p role="status">{tx(localMessage)}</p>}
    {snapshot && !snapshot.scenario && <p>{tx('Chưa có phiên nghiệp vụ. Thiết lập phiên trong khu vực kiểm thử trước.')}</p>}
    {snapshot?.scenario && <DataTable caption={tx('Hồ sơ phiên hiện tại')} captionVisibility="sr-only" columns={columns} rows={snapshot.warrantyCases} rowKey={r => r.id} appearance="refined" busy={state.busy} emptyContent={<p>{tx('Chưa có hồ sơ. Hồ sơ phải được tiếp nhận từ App.')}</p>} />}
    <GlobalModal open={!!selected && !editor && !transition} title={tx('Chi tiết hồ sơ bảo hành')} onClose={() => { if (!state.busy) setSelected(null); }} size="large" footer={<Button disabled={state.busy} onClick={() => setSelected(null)}>{tx('Đóng')}</Button>}>
      {!row || !snapshot ? <p role="status">{tx('Hồ sơ không còn thuộc phiên hiện tại. Đóng và đọc lại dữ liệu.')}</p> : <>
        <h3>{row.data.code}</h3><p>{badge(row)} · {tx(row.data.identityMode === 'TEMP_ONLY' ? 'Nhận dạng tạm' : 'Serial')}{row.data.physicalId && ` · ${snapshot.physical.find(p => p.id === row.data.physicalId)?.data.physicalCode ?? tx('Không có dữ liệu')}`}</p>
        <dl><dt>{tx('Sản phẩm / SKU')}</dt><dd>{text(record(row.data.productSnapshot).productName)} · {text(record(row.data.productSnapshot).skuCode)}</dd><dt>{tx('Khách hàng phản ánh')}</dt><dd>{row.data.customerReportedIssue}</dd><dt>{tx('Kỹ thuật viên chẩn đoán')}</dt><dd>{row.data.technicianDiagnosis || tx('Chưa có chẩn đoán.')}</dd><dt>{tx('Ngày dự kiến sửa xong')}</dt><dd>{row.data.expectedFinishDate ?? '—'}</dd></dl>
        <h3>{tx('Các bệnh lỗi đã liên kết')}</h3><ul>{frozenDefects(row).map(d => <li key={d.id}>{d.label}</li>)}</ul>
        <h3>{tx('Lịch sử xử lý')}</h3><ol>{caseTimeline(snapshot, row.id).map(event => { const data = record(event.data); return <li key={event.id}><strong>{tx(STATES[data.state as keyof typeof STATES] ?? String(data.state))}</strong> · <time dateTime={text(data.timestamp)}>{text(data.timestamp)}</time> · {tx('Người thực hiện')}: {text(data.actor)}</li>; })}</ol>
        {canEditWarrantyDiagnosis(row.data.state) && <Button disabled={locked} onClick={openEditor}>{tx('Chẩn đoán')}</Button>}
        {next && <Button disabled={locked || next === 'REPAIRING' && (!row.data.defectIds.length || !row.data.expectedFinishDate)} onClick={() => setTransition({ id: row.id, version: row.version, fence: snapshot.token, next })}>{tx(STATES[next])}</Button>}
        {next === 'REPAIRING' && (!row.data.defectIds.length || !row.data.expectedFinishDate) && <p>{tx('Chỉ bắt đầu sửa chữa khi có bệnh lỗi và ngày dự kiến sửa xong.')}</p>}
      </>}
      {localMessage && <p role="status">{tx(localMessage)}</p>}{state.error && <p role="alert">{tx(message(state.error))}</p>}<Button variant="secondary" disabled={state.busy} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button>{retry}
    </GlobalModal>
    <GlobalModal open={!!editor} title={tx('Chẩn đoán')} onClose={() => { if (!state.busy) setEditor(null); }} size="large" footer={<Button disabled={state.busy} onClick={() => setEditor(null)}>{tx('Hủy')}</Button>}>
      {editor && <WarrantyDiagnosisForm context={{ caseId: editor.caseId, state: editRow?.data.state ?? 'RECEIVED', intakeDate: editRow ? warrantyLocalDate(editRow.data.receivedAt) : '' }} customerReportedIssue={editRow?.data.customerReportedIssue ?? ''} historicalDefects={editRow ? frozenDefects(editRow) : []} activeDefects={state.defects.filter(d => d.row.status === 'active').map(d => ({ id: d.id, label: `${d.row.code} · ${d.row.name}` }))} draft={editor.draft} pending={locked || !snapshot || !sameWarrantyScope(snapshot, editor.fence) || editRow?.version !== editor.version} error={state.error ? tx(message(state.error)) : null} onDraftChange={draft => setEditor(previous => previous && { ...previous, draft })} onSubmit={async submission => { const captured = editor; const accepted = await controller.diagnose(submission, captured.version, captured.fence); if (accepted && !accepted.archived) { setEditor(previous => previous === captured ? null : previous); setSelected(accepted.caseId); notify(tx('Đã lưu thay đổi hồ sơ.')); } }} />}
      {localMessage && <p role="status">{tx(localMessage)}</p>}<Button variant="secondary" disabled={state.busy} onClick={() => void reloadEditor()}>{tx('Đọc lại dữ liệu')}</Button>{retry}
    </GlobalModal>
    <GlobalModal open={!!transition} title={tx('Chuyển trạng thái')} onClose={() => { if (!state.busy) setTransition(null); }} footer={<><Button disabled={state.busy} variant="secondary" onClick={() => setTransition(null)}>{tx('Hủy')}</Button><Button disabled={locked} onClick={async () => { if (!transition) return; const accepted = await controller.transition(transition.id, transition.version, transition.fence, transition.next); if (accepted && !accepted.archived) { setTransition(null); setSelected(accepted.caseId); notify(tx('Đã lưu thay đổi hồ sơ.')); } }}>{tx('Chuyển trạng thái')}</Button></>}>
      <p>{transition && tx(STATES[transition.next])}</p>{localMessage && <p role="status">{tx(localMessage)}</p>}{state.error && <p role="alert">{tx(message(state.error))}</p>}{retry}
    </GlobalModal>
  </section>;
}
