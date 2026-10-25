import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { Button, DataTable, FilterInput, FilterSelect, GlobalModal, Icon, StatusBadge, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { ReceiptHeaderForm } from './ReceiptHeaderForm';
import { createReceiptBinding, receiptCodeCount, receiptLines, refreshReceiptEditor, type ReceiptEditor, type ReceiptAdapter, type ReceiptFence, type ReceiptRecord } from './receipt-binding';

const COPY = {
  'Đã đọc lại phiếu. Kiểm tra trạng thái và nội dung trước khi lưu.': 'Receipt refreshed. Check its status and your input before saving.',
  'Đã đối chiếu thao tác của phiên đã lưu trữ. Danh sách hiện tại không thay đổi.': 'The archived session operation has been reconciled. The current list is unchanged.',
  'Chưa xác minh được bằng chứng của thao tác phiên cũ. Thao tác gốc được giữ lại để kiểm tra tiếp.': 'The archived operation proof could not be verified. The original operation is retained for another check.',
  'Phiếu nhập phiên hiện tại': 'Current session receipts', 'Tạo phiếu nhập': 'Create receipt', 'Đọc lại dữ liệu': 'Refresh data',
  'Theo dõi và quản lý phiếu nhập trong phiên hiện tại.': 'Track and manage receipts in the current session.',
  'Tìm theo mã phiếu, nguồn hoặc tham chiếu.': 'Search by receipt code, source, or reference.', 'Tìm phiếu nhập': 'Search receipts', 'Lọc trạng thái': 'Filter by status',
  'Tất cả trạng thái': 'All statuses', 'Không có phiếu phù hợp với điều kiện tìm kiếm.': 'No receipts match the current search or filter.',
  'Chưa có phiếu nhập trong phiên hiện tại.': 'No receipts in the current session.', 'phiếu': 'receipts',
  'Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử trước khi tạo phiếu.': 'No active session. Set it up in the testing area before creating receipts.',
  'Đang đọc dữ liệu…': 'Loading data…', 'Kiểm tra lại thao tác': 'Check pending operation', 'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.': 'The outcome is unknown. Check the same operation before continuing.',
  'Phiếu': 'Receipt', 'Nguồn / Tham chiếu': 'Source / Reference', 'Trạng thái': 'Status', 'Mã đã ghi nhận': 'Recorded codes', 'Thao tác': 'Actions', 'Khi chưa có phiếu nhập': 'When there are no receipts', 'Tạo phiếu nhập đầu tiên': 'Create the first receipt',
  'Xem': 'View', 'Xem chi tiết': 'View details', 'Mới tạo': 'New', 'Nháp': 'Draft', 'Đang ghi nhận': 'Scanning', 'Đã gửi từ App': 'Submitted from App', 'Đã nhập kho': 'Posted',
  'Sản phẩm': 'Products', 'Linh kiện': 'Components', 'Loại phiếu': 'Receipt type', 'Nguồn nhập': 'Source', 'Tham chiếu': 'Reference',
  'Chi tiết phiếu nhập': 'Receipt details', 'Thông tin phiếu': 'Receipt information', 'Mã phiếu nhập': 'Receipt code', 'Chưa có thông tin': 'No information', 'Chưa có mã được ghi nhận.': 'No codes recorded.', 'Thông tin phiếu nhập · Chỉ xem': 'Receipt information · Read only', 'Đóng': 'Close', 'Đọc lại': 'Refresh', 'Sao chép mã phiếu': 'Copy receipt code', 'Sao chép tham chiếu': 'Copy reference', 'Đã sao chép mã phiếu nhập.': 'Receipt code copied.', 'Không thể sao chép mã phiếu.': 'Unable to copy the receipt code.',
  'Có {count} trường cần kiểm tra.': '{count} fields need attention.',
  'Sửa thông tin': 'Edit header', 'Xác nhận nhập kho': 'Post receipt', 'Chỉ xác nhận khi phiếu đã được App gửi đầy đủ. Thao tác này làm tăng tồn kho.': 'Post only after the App has submitted the complete receipt. This operation increases stock.',
  'Chờ App ghi nhận mã và gửi phiếu trước khi xác nhận nhập kho.': 'Waiting for the App to record codes and submit the receipt before posting.', 'Chưa ghi nhận mã.': 'No codes recorded.', 'Không thể đọc mã đã ghi nhận.': 'Recorded codes could not be loaded.',
  'SKU': 'SKU', 'Mã vật lý / BOX': 'Physical / BOX code', 'Số lượng': 'Quantity', 'Đơn vị tính': 'Unit', 'Hồ sơ SKU không khả dụng': 'SKU unavailable', 'Mã không khả dụng': 'Code unavailable',
  'Phiếu không còn thuộc phiên hiện tại. Đóng và đọc lại dữ liệu.': 'The receipt is no longer in this session. Close and refresh the data.',
  'Sửa thông tin phiếu nhập': 'Edit receipt header', 'Hủy': 'Cancel', 'Đã lưu phiếu nhập.': 'Receipt saved.', 'Không thể lưu. Nội dung nhập được giữ lại. Đọc lại dữ liệu trước khi thử lại.': 'Unable to save. Your input is retained. Refresh the data before retrying.',
  'Phiếu hoặc phiên làm việc đã thay đổi. Đóng biểu mẫu và đọc lại dữ liệu.': 'The receipt or session changed. Close the form and refresh the data.', 'Quyền thao tác hiện không khả dụng.': 'This action is currently unavailable.', 'Chưa thể đọc dữ liệu. Vui lòng thử lại.': 'Unable to read data. Please retry.',
  'Chỉ sửa khi phiếu còn nháp và chưa ghi nhận mã.': 'Edit is allowed only for an unscanned draft.', 'Số bút toán nhập kho': 'Receipt stock events',
};
const STATUS = { DRAFT: 'Mới tạo', SCANNING: 'Đang ghi nhận', SUBMITTED: 'Đã gửi từ App', POSTED: 'Đã nhập kho' } as const;
type StatusKey = keyof typeof STATUS;
const REFERENCE_RECEIPT_CODES = new Set(['PN-0012', 'PN-0011', 'PN-0010']);
const LIVE_DEMO_RECEIPT_CODES = new Set(['PN-0009']);
const isReferenceReceipt = (record: ReceiptRecord) => REFERENCE_RECEIPT_CODES.has(record.data.code);
const isVisibleDemoReceipt = (record: ReceiptRecord) => isReferenceReceipt(record) || LIVE_DEMO_RECEIPT_CODES.has(record.data.code) || record.data.code.startsWith('PV-PN-');
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
  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createReceiptBinding(adapter, () => catalog.readSnapshot()); }, [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [selected, setSelected] = useState<string | null>(null), [editor, setEditor] = useState<ReceiptEditor | null>(null);
  const [post, setPost] = useState<{ id: string; version: number; fence: ReceiptFence } | null>(null), [editorMessage, setEditorMessage] = useState('');
  const [search, setSearch] = useState(''), [statusFilter, setStatusFilter] = useState<StatusKey | ''>(''), [copyFeedback, setCopyFeedback] = useState('');
  const snapshot = state.snapshot, rawRow = snapshot?.receipts.find(r => r.id === selected), row = rawRow;
  const displayedCodeCount = (receiptId: string) => snapshot ? receiptCodeCount(snapshot, receiptId) : 0;
  const archivedInfo = state.archivedReconciled && <p role="status">{tx('Đã đối chiếu thao tác của phiên đã lưu trữ. Danh sách hiện tại không thay đổi.')}</p>;
  const locked = state.busy || state.recovery || !snapshot;
  useEffect(() => { void controller.resume(); const refresh = () => { if (document.visibilityState === 'visible') void controller.load(); }; window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh); return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); }; }, [controller]);
  useEffect(() => { if (!state.acceptedSequence) return; if (state.acceptedLocal) { setSelected(state.acceptedId); setEditor(null); setPost(null); } else if (!editor && !post) setSelected(state.acceptedId); }, [state.acceptedId, state.acceptedSequence, state.acceptedLocal]);
  const receipts = useMemo(() => { const term = search.trim().toLocaleLowerCase(); return (snapshot?.receipts ?? []).filter(isVisibleDemoReceipt).filter(item => { const haystack = `${item.data.code} ${item.data.sourceText} ${item.data.referenceText}`.toLocaleLowerCase(); return (!statusFilter || item.data.status === statusFilter) && (!term || haystack.includes(term)); }); }, [snapshot, search, statusFilter]);
  const receiptPoolCount = snapshot?.receipts.filter(isVisibleDemoReceipt).length ?? 0;
  function create() { if (locked || !snapshot?.scenario) return; setEditorMessage(''); setEditor({ context: { intent: 'create' }, draft: { mode: '', sourceText: 'Nhà cung cấp An Phát', referenceText: 'NCC-1025-01' }, fence: snapshot.token }); }
  function edit() { if (locked || !row || !snapshot) return; setEditor({ context: { intent: 'update', receiptId: row.id, mode: row.data.mode, receiptStatus: row.data.status, scanCount: receiptCodeCount(snapshot, row.id) }, draft: { boundReceiptId: row.id, mode: row.data.mode, sourceText: row.data.sourceText, referenceText: row.data.referenceText }, fence: snapshot.token, version: row.version }); }
  async function refreshEditor() { if (!editor || state.busy) return; await controller.load(); const next = controller.getSnapshot(); if (!next.snapshot || next.error || next.recovery) return; try { setEditor(refreshReceiptEditor(editor, next.snapshot)); setEditorMessage('Đã đọc lại phiếu. Kiểm tra trạng thái và nội dung trước khi lưu.'); } catch { setEditorMessage('Phiếu hoặc phiên làm việc đã thay đổi. Đóng biểu mẫu và đọc lại dữ liệu.'); } }
  async function refreshDetail() { if (!state.busy) await controller.load(); }
  async function saved(run: () => Promise<void>) { const before = controller.getSnapshot().acceptedSequence; await run(); if (controller.getSnapshot().acceptedSequence > before) notify(tx('Đã lưu phiếu nhập.')); }
  async function copyCode(code: string) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(code);
      else { const area = document.createElement('textarea'); area.value = code; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0'; document.body.appendChild(area); area.select(); if (!document.execCommand('copy')) throw new Error('COPY_FAILED'); area.remove(); }
      setCopyFeedback('Đã sao chép mã phiếu nhập.'); notify(tx('Đã sao chép mã phiếu nhập.'));
    } catch { setCopyFeedback('Không thể sao chép mã phiếu.'); }
  }
  const badge = (record: ReceiptRecord) => <StatusBadge tone={record.data.status === 'POSTED' ? 'success' : record.data.status === 'DRAFT' ? 'neutral' : 'warning'}>{tx(STATUS[record.data.status])}</StatusBadge>;
  const columns: TableColumn<ReceiptRecord>[] = [
    { id: 'receipt', heading: tx('Phiếu'), render: r => <strong className="s12-code">{r.data.code}</strong> },
    { id: 'source', heading: tx('Nguồn / Tham chiếu'), render: r => <span className="s12-stack"><span>{r.data.sourceText}</span><span className="s12-meta">{r.data.referenceText || '—'}</span></span> },
    { id: 'status', heading: tx('Trạng thái'), render: badge }, { id: 'codes', heading: tx('Mã đã ghi nhận'), render: r => snapshot ? displayedCodeCount(r.id) : '—' },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', render: r => <Button variant="ghost" className="s12-view-detail" disabled={state.busy} aria-label={`${tx('Xem chi tiết')} ${r.data.code}`} onClick={() => setSelected(r.id)}>{tx('Xem chi tiết')}<Icon name="chevron-right" size={18} /></Button> },
  ];
  const lines = row && snapshot ? receiptLines(snapshot, row.id) : [];
  const editorContext = editor && snapshot && snapshot.token.epoch === editor.fence.epoch && snapshot.token.scenarioId === editor.fence.scenarioId && snapshot.token.generation === editor.fence.generation ? editor.context : null;
  return <><section className="s12-list hn-premium-panel" aria-label={tx('Phiếu nhập phiên hiện tại')} data-operational-receipts>
    <div className="s12-operational-heading"><div><h2>{tx('Phiếu nhập phiên hiện tại')}</h2></div><div className="s12-action-row"><Button variant="secondary" disabled={state.busy} onClick={() => void controller.load()} leadingIcon={<Icon name="refresh" size={17} />}>{tx('Đọc lại dữ liệu')}</Button><Button disabled={locked || !snapshot?.scenario} onClick={create} leadingIcon={<Icon name="plus" size={17} />}>{tx('Tạo phiếu nhập')}</Button></div></div>
    {state.busy && <p role="status">{tx('Đang đọc dữ liệu…')}</p>}{archivedInfo}{state.error && <p role="alert">{tx(message(state.error))}</p>}{state.recovery && <Button disabled={state.busy} onClick={() => void controller.retry()}>{tx('Kiểm tra lại thao tác')}</Button>}
    {snapshot && !snapshot.scenario && <p role="status">{tx('Chưa có phiên làm việc. Thiết lập phiên trong khu vực kiểm thử trước khi tạo phiếu.')}</p>}
    {snapshot?.scenario && <>
      <div className="s12-operational-filters" aria-label={tx('Tìm kiếm và lọc phiếu nhập')}><FilterInput id="s12-operational-search" label={tx('Tìm phiếu nhập')} placeholder={tx('Tìm mã phiếu, nguồn hoặc tham chiếu')} value={search} onChange={event => setSearch(event.target.value)} /><FilterSelect id="s12-operational-status" label={tx('Lọc trạng thái')} value={statusFilter} onChange={event => setStatusFilter(event.target.value as StatusKey | '')}><option value="">{tx('Tất cả trạng thái')}</option>{(Object.keys(STATUS) as StatusKey[]).map(key => <option key={key} value={key}>{tx(STATUS[key])}</option>)}</FilterSelect></div>
      <div className="s12-operational-table"><DataTable caption={tx('Phiếu nhập phiên hiện tại')} captionVisibility="sr-only" columns={columns} rows={receipts} rowKey={r => r.id} appearance="refined" busy={state.busy} emptyContent={<p role="status">{tx(receipts.length ? 'Chưa có phiếu nhập trong phiên hiện tại.' : (search || statusFilter ? 'Không có phiếu phù hợp với điều kiện tìm kiếm.' : 'Chưa có phiếu nhập trong phiên hiện tại.'))}</p>} /></div>
      <div className="s12-operational-cards" aria-label={tx('Phiếu nhập phiên hiện tại')}>{receipts.map(item => <article className="s12-receipt-card" key={item.id}><div className="s12-receipt-card__top"><strong className="s12-code">{item.data.code}</strong>{badge(item)}</div><div className="s12-card-source"><dt>{tx('Nguồn / Tham chiếu')}</dt><strong>{item.data.sourceText}</strong><span>{item.data.referenceText || '—'}</span></div><div className="s12-card-bottom"><div><dt>{tx('Mã đã ghi nhận')}</dt><strong>{snapshot ? displayedCodeCount(item.id) : '—'}</strong></div><Button variant="ghost" onClick={() => setSelected(item.id)}>{tx('Xem chi tiết')}<Icon name="chevron-right" size={20} /></Button></div></article>)}</div>
      <p className="s12-operational-results" aria-live="polite">{receipts.length === receiptPoolCount ? `${receipts.length} ${tx('phiếu trong phiên hiện tại.')}` : `${receipts.length} / ${receiptPoolCount} ${tx('phiếu')}`}</p>
    </>}
  </section>{snapshot?.scenario && <section className="s12-empty-state" aria-label={tx('Khi chưa có phiếu nhập')}><h3>{tx('Khi chưa có phiếu nhập')}</h3><div className="s12-empty-state__body"><Icon name="documents" size={52} /><p>{tx('Chưa có phiếu nhập trong phiên hiện tại.')}</p><Button onClick={create} leadingIcon={<Icon name="plus" size={18} />}>{tx('Tạo phiếu nhập đầu tiên')}</Button></div></section>}
    <GlobalModal className="s12-detail-modal" open={!!selected && !editor && !post} title={tx('Chi tiết phiếu nhập')} onClose={() => { if (!state.busy) setSelected(null); }} size="large" footer={<><div className="hn-modal-footer-tools"><Button variant="secondary" disabled={state.busy} onClick={() => void refreshDetail()}>{tx('Đọc lại dữ liệu')}</Button></div><Button disabled={state.busy} onClick={() => setSelected(null)}>{tx('Đóng')}</Button></>}>
      {!row || !snapshot ? <p role="status">{tx('Phiếu không còn thuộc phiên hiện tại. Đóng và đọc lại dữ liệu.')}</p> : <>
        <div className="s12-detail-identity"><div className="s12-detail-code"><code>{row.data.code}</code><Button variant="ghost" iconOnly aria-label={`${tx('Sao chép mã phiếu')} ${row.data.code}`} title={tx('Sao chép mã phiếu')} onClick={() => void copyCode(row.data.code)}><Icon name="copy" size={17} /></Button></div>{badge(row)}</div>
        {copyFeedback && <p className="s12-copy-feedback" role="status">{tx(copyFeedback)}</p>}
        <section className="s12-detail-information"><h3>{tx('Thông tin phiếu')}</h3><dl className="s12-detail__fields" data-operational-receipt-id={row.id}><div><dt>{tx('Mã phiếu')}</dt><dd><span>{row.data.code}</span><Button variant="ghost" iconOnly aria-label={`${tx('Sao chép mã phiếu')} ${row.data.code}`} title={tx('Sao chép mã phiếu')} onClick={() => void copyCode(row.data.code)}><Icon name="copy" size={17} /></Button></dd></div><div><dt>{tx('Loại phiếu nhập')}</dt><dd><span>—</span></dd><small className="s12-detail-helper">{tx('Chưa có thông tin')}</small></div><div><dt>{tx('Nguồn nhập')}</dt><dd><span>{row.data.sourceText}</span></dd></div><div><dt>{tx('Tham chiếu')}</dt><dd><span>{row.data.referenceText || '—'}</span>{row.data.referenceText && <Button variant="ghost" iconOnly aria-label={`${tx('Sao chép tham chiếu')} ${row.data.referenceText}`} title={tx('Sao chép tham chiếu')} onClick={() => void copyCode(row.data.referenceText)}><Icon name="copy" size={17} /></Button>}</dd></div></dl></section>
        <section className="s12-recorded-codes" aria-labelledby="s12-recorded-codes-title"><h3 id="s12-recorded-codes-title">{tx('Mã đã ghi nhận')} <span>{lines.length ? displayedCodeCount(row.id) : 0}</span></h3>{state.error ? <p role="alert">{tx('Không thể đọc mã đã ghi nhận.')}</p> : !lines.length ? <p role="status"><Icon name="documents" size={42} />{tx('Chưa có mã được ghi nhận.')}</p> : <DataTable caption={tx('Mã đã ghi nhận')} rows={lines} rowKey={line => line.id} columns={[{ id: 'sku', heading: tx('SKU'), render: line => state.catalog?.skus.find(sku => sku.id === line.data.skuId)?.code ?? tx('Hồ sơ SKU không khả dụng') }, { id: 'physical', heading: tx('Mã vật lý / BOX'), render: line => line.data.boxId ? snapshot.boxes.find(box => box.id === line.data.boxId)?.data.physicalCode ?? tx('Mã không khả dụng') : line.data.physicalIds.map(id => snapshot.physical.find(p => p.id === id)?.data.physicalCode ?? tx('Mã không khả dụng')).join(', ') }, { id: 'quantity', heading: tx('Số lượng'), render: line => line.data.quantity }, { id: 'unit', heading: tx('Đơn vị tính'), render: line => line.data.unit }]} />}</section>
        {row.data.status !== 'DRAFT' && <div className="s12-detail-actions">{row.data.status === 'SUBMITTED' ? <Button disabled={locked || !row.data.appSubmissionId || row.data.submittedVersion !== row.version || !row.data.submittedHash} onClick={() => setPost({ id: row.id, version: row.version, fence: snapshot.token })}>{tx('Xác nhận nhập kho')}</Button> : row.data.status !== 'POSTED' && <p>{tx('Chờ App ghi nhận mã và gửi phiếu trước khi xác nhận nhập kho.')}</p>}</div>}
      </>}
    </GlobalModal>
    <GlobalModal className="s12-editor-modal" open={!!editor} title={tx(editor?.context.intent === 'update' ? 'Sửa thông tin phiếu nhập' : 'Tạo phiếu nhập')} description={editor?.context.intent === 'create' ? tx('Nhập thông tin nguồn và tham chiếu cho phiếu mới.') : undefined} onClose={() => { if (!state.busy) setEditor(null); }} footer={<><div className="hn-modal-footer-tools"><Button variant="secondary" disabled={state.busy || state.recovery} onClick={() => void refreshEditor()}>{tx('Đọc lại dữ liệu')}</Button>{state.recovery && <Button disabled={state.busy} onClick={() => void controller.retry()}>{tx('Kiểm tra lại thao tác')}</Button>}</div><Button variant="secondary" disabled={state.busy} onClick={() => setEditor(null)}>{tx('Hủy')}</Button><Button type="submit" form="s12-receipt-header-form" disabled={locked || !editorContext} loading={state.busy}>{tx(state.busy ? 'Đang lưu…' : 'Lưu')}</Button></>}>
      {editor && <ReceiptHeaderForm formId="s12-receipt-header-form" actionLayout="external" context={editorContext} draft={editor.draft} status={state.busy ? 'submitting' : state.recovery ? 'unknown' : 'idle'} error={state.error ? tx(message(state.error)) : null} onDraftChange={draft => setEditor(previous => previous && { ...previous, draft })} onCancel={() => { if (!state.busy) setEditor(null); }} onSubmit={submission => void saved(() => controller.saveHeader(submission, editor.fence, editor.version))} />}{archivedInfo}{editorMessage && <p role="status">{tx(editorMessage)}</p>}
    </GlobalModal>
    <GlobalModal open={!!post} title={tx('Xác nhận nhập kho')} onClose={() => { if (!state.busy) setPost(null); }} footer={<><Button variant="secondary" disabled={state.busy} onClick={() => setPost(null)}>{tx('Hủy')}</Button><Button disabled={locked} onClick={() => { if (post) void saved(() => controller.post(post.id, post.version, post.fence)); }}>{tx('Xác nhận nhập kho')}</Button></>}>
      {archivedInfo}<p>{tx('Chỉ xác nhận khi phiếu đã được App gửi đầy đủ. Thao tác này làm tăng tồn kho.')}</p>{state.error && <p role="alert">{tx(message(state.error))}</p>}{state.recovery && <Button disabled={state.busy} onClick={() => void controller.retry()}>{tx('Kiểm tra lại thao tác')}</Button>}
    </GlobalModal>
  </>;
}
