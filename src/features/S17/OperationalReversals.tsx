import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { BasicSelect, Button, DataTable, FormField, GlobalModal, StatusBadge, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { adoptReviewedReversal, createReversalBinding, EVIDENCE_MAX_BYTES, EVIDENCE_MEDIA_TYPES, reversalIssueOptions, type EvidenceData, type ReversalCreateDraft, type ReversalRecord, type ReversalTarget, type ReversalWebAdapter } from './reversal-binding';

export const REVERSAL_OPERATIONAL_COPY = {
  'Phiếu hoàn phiên hiện tại': 'Current session returns', 'Danh sách tham chiếu': 'Reference list', 'Tạo phiếu hoàn': 'Create return',
  'Đọc lại dữ liệu': 'Refresh data', 'Đang đọc dữ liệu…': 'Loading data…', 'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.': 'No active session. Set it up in the testing area.',
  'Chưa có phiếu hoàn trong phiên hiện tại.': 'No returns in the current session.', 'Phiếu hoàn': 'Return', 'Phiếu cấp gốc': 'Original issue', 'Trạng thái': 'Status', 'Nhận lại hàng': 'Physical return', 'Thao tác': 'Actions', 'Xem': 'View',
  'Nháp': 'Draft', 'Đã ghi sổ': 'Posted', 'Đã hủy': 'Cancelled', 'Chờ nhận lại': 'Pending return', 'Đã xác nhận nhận lại': 'Return confirmed',
  'Chi tiết phiếu hoàn': 'Return details', 'Đóng': 'Close', 'Hủy thao tác': 'Cancel action', 'Lưu': 'Save', 'Lý do hoàn': 'Return reason', 'Lý do hủy': 'Cancellation reason',
  'Chọn phiếu cấp gốc': 'Select original issue', 'Chưa có phiếu cấp bảo hành đã ghi sổ phù hợp.': 'No suitable posted warranty issue is available.',
  'Tôi xác nhận trả toàn bộ hàng của phiếu gốc và hàng chưa sử dụng.': 'I declare that all items from the original issue are returned unused.',
  'Chỉ hoàn toàn bộ phiếu cấp bảo hành đã ghi sổ. Số lượng và mã hàng giữ đúng phiếu gốc.': 'Only full returns of posted warranty issues are supported. Quantities and item identities follow the original issue.',
  'Tối đa 500 ký tự, một dòng.': 'Up to 500 characters, one line.', 'Tối đa 200 ký tự, một dòng.': 'Up to 200 characters, one line.',
  'Đính kèm bằng chứng': 'Attach evidence', 'Tệp bằng chứng': 'Evidence file', 'Tên bằng chứng': 'Evidence label',
  'PNG, JPEG, PDF hoặc TXT; dung lượng từ 1 byte đến 1 MiB (1.048.576 byte).': 'PNG, JPEG, PDF or TXT; size from 1 byte to 1 MiB (1,048,576 bytes).',
  'Chọn tệp bằng chứng trước khi lưu.': 'Select an evidence file before saving.', 'Chọn phiếu gốc và xác nhận hàng chưa sử dụng.': 'Select the original issue and declare the items unused.',
  'Bằng chứng đã lưu': 'Saved evidence', 'Tải bằng chứng': 'Download evidence', 'Chưa có bằng chứng.': 'No evidence attached.',
  'Xác nhận nhận lại hàng': 'Confirm physical return', 'Đã nhận lại đủ hàng chưa sử dụng theo phiếu gốc. Xác nhận này chưa tăng tồn kho.': 'All original unused items have physically returned. This confirmation does not increase stock.',
  'Ghi sổ hoàn kho': 'Post stock return', 'Ghi sổ hoàn kho theo đúng hàng và số lượng gốc. Phiếu cấp và bút toán gốc được giữ nguyên.': 'Post the exact original items and quantities back to stock. The original issue and stock events remain unchanged.',
  'Hủy phiếu hoàn': 'Cancel return', 'Hủy phiếu nháp không làm thay đổi tồn kho.': 'Cancelling a draft return does not change stock.',
  'SKU': 'SKU', 'Mã vật lý / BOX': 'Physical / BOX code', 'Số lượng hoàn': 'Return quantity', 'Đơn vị': 'Unit', 'Hồ sơ SKU không khả dụng': 'SKU unavailable', 'Mã không khả dụng': 'Code unavailable',
  'Ca bảo hành': 'Warranty case', 'Số bút toán hoàn': 'Compensation events', 'Phiếu không còn thuộc phiên hiện tại. Đóng và đọc lại dữ liệu.': 'This document is no longer in the current session. Close and refresh.',
  'Đã lưu phiếu hoàn.': 'Return saved.', 'Kiểm tra lại thao tác': 'Check pending operation',
  'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.': 'The outcome is unknown. Check the same operation before continuing.',
  'Phiếu hoặc phiên đã thay đổi. Đọc lại và kiểm tra dữ liệu; nội dung nhập được giữ nguyên.': 'The document or session changed. Refresh and review the data; your input is retained.',
  'Dữ liệu vừa đọc lại': 'Refreshed record', 'Phiên bản': 'Version', 'Dùng dữ liệu đã xem lại': 'Use reviewed state', 'Số bằng chứng': 'Evidence count',
  'Quyền thao tác hiện không khả dụng.': 'This action is currently unavailable.', 'Không thể hoàn tất. Nội dung nhập được giữ lại; đọc lại dữ liệu trước khi thử lại.': 'Unable to complete. Your input is retained; refresh before retrying.',
  'Cần bằng chứng hợp lệ trước khi xác nhận nhận lại hàng.': 'Valid evidence is required before confirming physical return.', 'Cần xác nhận nhận lại hàng trước khi ghi sổ.': 'Confirm physical return before posting.',
  'Phiếu gốc không còn đủ điều kiện hoàn; có thể đã phát sinh sử dụng tiếp hoặc phiếu hoàn khác.': 'The original issue is no longer eligible; subsequent consumption or another return may exist.',
  'Kiểm tra loại tệp, dung lượng và nội dung bằng chứng.': 'Check evidence file type, size and content.', 'Nội dung bắt buộc phải hợp lệ, đúng giới hạn và không chứa ký tự điều khiển.': 'Required text must respect the limits and contain no control characters.',
  'Đã đối chiếu thao tác của phiên đã lưu trữ. Danh sách hiện tại không thay đổi.': 'The archived operation has been reconciled. The current list is unchanged.',
  'Chưa xác minh được bằng chứng thao tác phiên cũ. Thao tác gốc được giữ lại.': 'The archived operation proof could not be verified. The original operation is retained.',
};
type Editor = { kind: 'create'; draft: ReversalCreateDraft } | { kind: 'attach'; target: ReversalTarget; code: string; file: File | null; label: string }
  | { kind: 'confirm' | 'post'; target: ReversalTarget; code: string } | { kind: 'cancel'; target: ReversalTarget; code: string; reason: string };
function message(code: string) {
  if (code === 'ARCHIVED_PROOF_UNAVAILABLE') return 'Chưa xác minh được bằng chứng thao tác phiên cũ. Thao tác gốc được giữ lại.';
  if (code === 'OUTCOME_UNKNOWN' || code.startsWith('RECOVERY_')) return 'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.';
  if (code.includes('STALE') || code === 'REVERSAL_IMMUTABLE') return 'Phiếu hoặc phiên đã thay đổi. Đọc lại và kiểm tra dữ liệu; nội dung nhập được giữ nguyên.';
  if (['COMMAND_UNAVAILABLE', 'SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN', 'CONFIRMATION_REQUIRED'].includes(code)) return 'Quyền thao tác hiện không khả dụng.';
  if (code === 'EVIDENCE_REQUIRED') return 'Cần bằng chứng hợp lệ trước khi xác nhận nhận lại hàng.';
  if (code.startsWith('EVIDENCE_')) return 'Kiểm tra loại tệp, dung lượng và nội dung bằng chứng.';
  if (code === 'PHYSICAL_RETURN_REQUIRED') return 'Cần xác nhận nhận lại hàng trước khi ghi sổ.';
  if (['INTERVENING_CONSUMPTION', 'REVERSAL_ALREADY_EXISTS', 'REVERSAL_TYPE_NOT_ALLOWED', 'ORIGINAL_EVENT_CHANGED'].includes(code)) return 'Phiếu gốc không còn đủ điều kiện hoàn; có thể đã phát sinh sử dụng tiếp hoặc phiếu hoàn khác.';
  if (code === 'UNUSED_RETURN_REQUIRED') return 'Chọn phiếu gốc và xác nhận hàng chưa sử dụng.';
  if (code === 'VALIDATION_FAILED') return 'Nội dung bắt buộc phải hợp lệ, đúng giới hạn và không chứa ký tự điều khiển.';
  return 'Không thể hoàn tất. Nội dung nhập được giữ lại; đọc lại dữ liệu trước khi thử lại.';
}
function EvidenceDownload({ evidence, label }: { evidence: EvidenceData; label: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const value = URL.createObjectURL(new Blob([Uint8Array.from(evidence.bytes)], { type: evidence.mediaType })); setUrl(value); return () => URL.revokeObjectURL(value); }, [evidence]);
  return <a className="s17-evidence-download" href={url || undefined} download={evidence.label} aria-label={`${label}: ${evidence.label}`}>{evidence.label} ({evidence.mediaType}, {evidence.byteLength} B)</a>;
}
export function OperationalReversals({ adapter: supplied, notify }: { adapter?: ReversalWebAdapter; notify: (message: string) => void }) {
  const tx = useUiCopy(REVERSAL_OPERATIONAL_COPY), adapter = useMemo(() => supplied ?? createOperationalWebAdapter(undefined, { scope: 'S17' }), [supplied]);
  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createReversalBinding(adapter, () => catalog.readSnapshot()); }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [selected, setSelected] = useState<string | null>(null), [editor, setEditor] = useState<Editor | null>(null), [localError, setLocalError] = useState('');
  const [reviewed, setReviewed] = useState<{ record: ReversalRecord; target: ReversalTarget } | null>(null);
  useEffect(() => { setReviewed(null); }, [editor?.kind, editor && editor.kind !== 'create' ? editor.target.id : null]);
  const snapshot = state.snapshot, row = snapshot?.reversals.find(r => r.id === selected), locked = state.busy || state.recovery || !snapshot;
  const original = row && snapshot?.partsIssues.find(r => r.id === row.data.originalIssueId), options = snapshot ? reversalIssueOptions(snapshot) : [];
  useEffect(() => {
    void controller.resume(); const refresh = () => { if (document.visibilityState === 'visible') void controller.load(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller]);
  useEffect(() => { if (!state.acceptedSequence) return; if (state.acceptedLocal) { setSelected(state.acceptedId); setEditor(null); setLocalError(''); } else if (!editor) setSelected(previous => previous ?? state.acceptedId); }, [state.acceptedSequence, state.acceptedId, state.acceptedLocal]);
  function open(kind: 'attach' | 'confirm' | 'post' | 'cancel') {
    if (!row || !snapshot || locked) return; setLocalError(''); const target = { id: row.id, version: row.version, fence: snapshot.token }, base = { target, code: row.data.code };
    setEditor(kind === 'attach' ? { ...base, kind, file: null, label: '' } : kind === 'cancel' ? { ...base, kind, reason: '' } : { ...base, kind });
  }
  async function refreshForReview() {
    setReviewed(null); await controller.load();
    const next = controller.getSnapshot();
    if (!editor || editor.kind === 'create' || !next.snapshot || next.error || next.recovery) return;
    const record = next.snapshot.reversals.find(r => r.id === editor.target.id);
    if (record) setReviewed({ record, target: { id: record.id, version: record.version, fence: next.snapshot.token } });
  }
  function useReviewedState() {
    const current = controller.getSnapshot();
    if (!editor || editor.kind === 'create' || !reviewed || !current.snapshot || current.busy || current.recovery) return;
    try { setEditor(adoptReviewedReversal(editor, current.snapshot, reviewed.target)); setReviewed(null); setLocalError(''); }
    catch (error) { setLocalError(message((error as { code?: string }).code ?? 'READ_FAILED')); }
  }
  async function submit() {
    if (!editor || locked) return; setLocalError(''); const before = state.acceptedSequence;
    if (editor.kind === 'create') {
      if (!editor.draft.originalIssueId || !editor.draft.returnedUnused) { setLocalError('Chọn phiếu gốc và xác nhận hàng chưa sử dụng.'); return; }
      await controller.create(editor.draft);
    } else if (editor.kind === 'attach') {
      if (!editor.file) { setLocalError('Chọn tệp bằng chứng trước khi lưu.'); return; }
      await controller.attach(editor.target, editor.file, editor.label);
    } else if (editor.kind === 'confirm') await controller.confirmReturn(editor.target);
    else if (editor.kind === 'post') await controller.post(editor.target);
    else if (editor.kind === 'cancel') await controller.cancel(editor.target, editor.reason);
    if (controller.getSnapshot().acceptedSequence > before) notify(tx('Đã lưu phiếu hoàn.'));
  }
  const badge = (r: ReversalRecord) => <StatusBadge tone={r.data.status === 'POSTED' ? 'success' : r.data.status === 'DRAFT' ? 'warning' : 'neutral'}>{tx(r.data.status === 'POSTED' ? 'Đã ghi sổ' : r.data.status === 'DRAFT' ? 'Nháp' : 'Đã hủy')}</StatusBadge>;
  const columns: TableColumn<ReversalRecord>[] = [
    { id: 'code', heading: tx('Phiếu hoàn'), render: r => <strong>{r.data.code}</strong> },
    { id: 'original', heading: tx('Phiếu cấp gốc'), render: r => snapshot?.partsIssues.find(i => i.id === r.data.originalIssueId)?.data.code ?? '—' },
    { id: 'status', heading: tx('Trạng thái'), render: badge },
    { id: 'return', heading: tx('Nhận lại hàng'), render: r => tx(r.data.physicalReturn === 'CONFIRMED' ? 'Đã xác nhận nhận lại' : 'Chờ nhận lại') },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', render: r => <Button variant="ghost" disabled={state.busy} onClick={() => setSelected(r.id)}>{tx('Xem')}</Button> },
  ];
  const controls = <><Button variant="secondary" disabled={state.busy || state.recovery} onClick={() => void refreshForReview()}>{tx('Đọc lại dữ liệu')}</Button>{state.recovery && <Button disabled={state.busy} onClick={() => void controller.retry()}>{tx('Kiểm tra lại thao tác')}</Button>}</>;
  const feedback = <>{state.error && <p role="alert">{tx(message(state.error))}</p>}{state.archivedReconciled && <p role="status">{tx('Đã đối chiếu thao tác của phiên đã lưu trữ. Danh sách hiện tại không thay đổi.')}</p>}</>;
  const title = editor?.kind === 'create' ? 'Tạo phiếu hoàn' : editor?.kind === 'attach' ? 'Đính kèm bằng chứng' : editor?.kind === 'confirm' ? 'Xác nhận nhận lại hàng' : editor?.kind === 'cancel' ? 'Hủy phiếu hoàn' : 'Ghi sổ hoàn kho';
  return <section className="s17-list hn-premium-panel" data-operational-reversals aria-label={tx('Phiếu hoàn phiên hiện tại')}>
    <div className="hn-card__body"><h2>{tx('Phiếu hoàn phiên hiện tại')}</h2><div className="s17-action-row"><Button disabled={locked || !snapshot?.scenario} onClick={() => { if (!snapshot) return; setLocalError(''); setEditor({ kind: 'create', draft: { originalIssueId: '', observedIssueVersion: 0, returnedUnused: false, reasonText: '', fence: snapshot.token } }); }}>{tx('Tạo phiếu hoàn')}</Button>{controls}</div>
    {state.busy && <p role="status">{tx('Đang đọc dữ liệu…')}</p>}{feedback}
    {snapshot && !snapshot.scenario && <p role="status">{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử.')}</p>}
    </div>
    {snapshot?.scenario && <DataTable caption={tx('Phiếu hoàn phiên hiện tại')} captionVisibility="sr-only" columns={columns} rows={snapshot.reversals} rowKey={r => r.id} appearance="refined" busy={state.busy} emptyContent={<p>{tx('Chưa có phiếu hoàn trong phiên hiện tại.')}</p>} />}
    <GlobalModal open={!!selected && !editor} title={tx('Chi tiết phiếu hoàn')} size="large" onClose={() => { if (!state.busy) setSelected(null); }} footer={<Button disabled={state.busy} onClick={() => setSelected(null)}>{tx('Đóng')}</Button>}>
      {!row || !snapshot || !original ? <p role="status">{tx('Phiếu không còn thuộc phiên hiện tại. Đóng và đọc lại dữ liệu.')}</p> : <>
        <dl className="s17-operational-fields" data-operational-reversal-id={row.id}><div><dt>{tx('Phiếu hoàn')}</dt><dd>{row.data.code}</dd></div><div><dt>{tx('Phiếu cấp gốc')}</dt><dd>{original.data.code}</dd></div><div><dt>{tx('Ca bảo hành')}</dt><dd>{snapshot.warrantyCases.find(c => c.id === original.data.caseId)?.data.code ?? '—'}</dd></div><div><dt>{tx('Trạng thái')}</dt><dd>{badge(row)}</dd></div><div><dt>{tx('Lý do hoàn')}</dt><dd>{row.data.reasonText}</dd></div><div><dt>{tx('Nhận lại hàng')}</dt><dd>{tx(row.data.physicalReturn === 'CONFIRMED' ? 'Đã xác nhận nhận lại' : 'Chờ nhận lại')}</dd></div><div><dt>{tx('Số bút toán hoàn')}</dt><dd>{row.data.postedCompensationEventIds.length}</dd></div>{row.data.cancelReason && <div><dt>{tx('Lý do hủy')}</dt><dd>{row.data.cancelReason}</dd></div>}</dl>
        <DataTable caption={tx('Số lượng hoàn')} rows={original.data.lines} rowKey={line => line.id} columns={[
          { id: 'sku', heading: tx('SKU'), render: line => state.catalog?.skus.find(s => s.id === line.skuId)?.code ?? tx('Hồ sơ SKU không khả dụng') },
          { id: 'physical', heading: tx('Mã vật lý / BOX'), render: line => line.boxId ? snapshot.boxes.find(b => b.id === line.boxId)?.data.physicalCode ?? tx('Mã không khả dụng') : line.physicalIds.map(id => snapshot.physical.find(p => p.id === id)?.data.physicalCode ?? tx('Mã không khả dụng')).join(', ') },
          { id: 'quantity', heading: tx('Số lượng hoàn'), render: line => line.quantity }, { id: 'unit', heading: tx('Đơn vị'), render: line => line.unit },
        ]} />
        <h3>{tx('Bằng chứng đã lưu')}</h3>{row.data.evidenceRefs.length ? <ul>{state.verifiedEvidence[row.id]?.map(e => <li key={e.attachmentRef}><EvidenceDownload evidence={e} label={tx('Tải bằng chứng')} /></li>)}</ul> : <p>{tx('Chưa có bằng chứng.')}</p>}
        {row.data.status === 'DRAFT' && <div><Button disabled={locked} onClick={() => open('attach')}>{tx('Đính kèm bằng chứng')}</Button>{row.data.physicalReturn === 'PENDING' ? <Button disabled={locked || !row.data.evidenceRefs.length} onClick={() => open('confirm')}>{tx('Xác nhận nhận lại hàng')}</Button> : <Button disabled={locked} onClick={() => open('post')}>{tx('Ghi sổ hoàn kho')}</Button>}<Button variant="secondary" disabled={locked} onClick={() => open('cancel')}>{tx('Hủy phiếu hoàn')}</Button></div>}
      </>}{feedback}{controls}
    </GlobalModal>
    <GlobalModal open={!!editor} title={tx(title)} onClose={() => { if (!state.busy) setEditor(null); }}
      className="s17-editor-modal"
      footer={<>
        <div className="s17-editor-footer-tools">{controls}</div>
        <Button type="button" variant="secondary" disabled={state.busy} onClick={() => setEditor(null)}>{tx('Hủy thao tác')}</Button>
        <Button type="submit" form="s17-editor-form" disabled={locked}>{tx(editor?.kind === 'confirm' || editor?.kind === 'post' || editor?.kind === 'cancel' ? title : 'Lưu')}</Button>
      </>}>
      <form id="s17-editor-form" className="s17-editor-form" noValidate aria-label={tx(title)} aria-busy={state.busy} onSubmit={event => { event.preventDefault(); void submit(); }}>
        {editor?.kind === 'create' && <>
          <p>{tx('Chỉ hoàn toàn bộ phiếu cấp bảo hành đã ghi sổ. Số lượng và mã hàng giữ đúng phiếu gốc.')}</p>
          <FormField label={tx('Phiếu cấp gốc')} required><BasicSelect value={editor.draft.originalIssueId} disabled={locked} onChange={event => { const issue = options.find(i => i.id === event.target.value); setEditor(previous => previous?.kind === 'create' ? { ...previous, draft: { ...previous.draft, originalIssueId: issue?.id ?? '', observedIssueVersion: issue?.version ?? 0 } } : previous); }}><option value="">{tx('Chọn phiếu cấp gốc')}</option>{options.map(issue => <option key={issue.id} value={issue.id}>{issue.data.code}</option>)}</BasicSelect></FormField>
          {!options.length && <p>{tx('Chưa có phiếu cấp bảo hành đã ghi sổ phù hợp.')}</p>}
          <FormField label={tx('Lý do hoàn')} required hint={tx('Tối đa 500 ký tự, một dòng.')}><input type="text" value={editor.draft.reasonText} disabled={state.busy} onChange={event => setEditor(previous => previous?.kind === 'create' ? { ...previous, draft: { ...previous.draft, reasonText: event.target.value } } : previous)} /></FormField>
          <label className="s17-checkbox-field">
            <input type="checkbox" checked={editor.draft.returnedUnused} disabled={state.busy} aria-required="true" onChange={event => setEditor(previous => previous?.kind === 'create' ? { ...previous, draft: { ...previous.draft, returnedUnused: event.target.checked } } : previous)} />
            <span>{tx('Tôi xác nhận trả toàn bộ hàng của phiếu gốc và hàng chưa sử dụng.')} <span className="s17-required" aria-hidden="true">*</span></span>
          </label>
        </>}
        {editor && editor.kind !== 'create' && <p><strong>{editor.code}</strong></p>}
        {editor?.kind === 'attach' && <>
          <FormField label={tx('Tệp bằng chứng')} required hint={tx('PNG, JPEG, PDF hoặc TXT; dung lượng từ 1 byte đến 1 MiB (1.048.576 byte).')}><input type="file" accept={EVIDENCE_MEDIA_TYPES.join(',')} disabled={state.busy} onChange={event => { const file = event.target.files?.[0] ?? null; setEditor(previous => previous?.kind === 'attach' ? { ...previous, file, label: previous.label || file?.name || '' } : previous); }} /></FormField>
          {editor.file && <p>{editor.file.name} ({editor.file.size} / {EVIDENCE_MAX_BYTES} B)</p>}
          <FormField label={tx('Tên bằng chứng')} required hint={tx('Tối đa 200 ký tự, một dòng.')}><input type="text" value={editor.label} disabled={state.busy} onChange={event => setEditor(previous => previous?.kind === 'attach' ? { ...previous, label: event.target.value } : previous)} /></FormField>
        </>}
        {editor?.kind === 'confirm' && <p>{tx('Đã nhận lại đủ hàng chưa sử dụng theo phiếu gốc. Xác nhận này chưa tăng tồn kho.')}</p>}
        {editor?.kind === 'post' && <p>{tx('Ghi sổ hoàn kho theo đúng hàng và số lượng gốc. Phiếu cấp và bút toán gốc được giữ nguyên.')}</p>}
        {editor?.kind === 'cancel' && <><p>{tx('Hủy phiếu nháp không làm thay đổi tồn kho.')}</p><FormField label={tx('Lý do hủy')} required hint={tx('Tối đa 500 ký tự, một dòng.')}><input type="text" disabled={state.busy} value={editor.reason} onChange={event => setEditor(previous => previous?.kind === 'cancel' ? { ...previous, reason: event.target.value } : previous)} /></FormField></>}
        {localError && <p role="alert">{tx(localError)}</p>}{feedback}
      </form>
      {reviewed && editor && editor.kind !== 'create' && <section aria-label={tx('Dữ liệu vừa đọc lại')}>
        <h3>{tx('Dữ liệu vừa đọc lại')}</h3><p>{reviewed.record.data.code} · {tx('Phiên bản')}: {reviewed.record.version}</p>
        <p>{tx('Trạng thái')}: {badge(reviewed.record)} · {tx('Nhận lại hàng')}: {tx(reviewed.record.data.physicalReturn === 'CONFIRMED' ? 'Đã xác nhận nhận lại' : 'Chờ nhận lại')}</p>
        <p>{tx('Lý do hoàn')}: {reviewed.record.data.reasonText} · {tx('Số bằng chứng')}: {reviewed.record.data.evidenceRefs.length}</p>
        <Button disabled={locked} onClick={useReviewedState}>{tx('Dùng dữ liệu đã xem lại')}</Button>
      </section>}
    </GlobalModal>
  </section>;
}
