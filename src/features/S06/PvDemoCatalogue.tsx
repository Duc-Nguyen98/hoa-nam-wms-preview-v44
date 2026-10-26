import { useEffect, useMemo, useRef, useState } from 'react';
import { pvMasterHref, type PvDemoAdapter, type PvDemoSnapshot, type PvProfile } from '../../contracts/pv-demo';
import { createPvDemoAdapter } from '../../data/http/pv-demo-adapter';
import { Button, CatalogueSummary, DataTable, Feedback, FilterInput, FilterSelect, GlobalModal, Icon, Pagination, SummaryMetric, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { usePvDemo } from './usePvDemo';
import { PvDemoForm } from './PvDemoForm';
import { pvAssetPath, pvBuildRequest, pvMasterEligible, pvMasters, pvPreviewRows } from './pv-demo-model';
import { PV_DEMO_COPY } from './pv-demo-copy';
import type { PvDemoDraft } from './PvDemoDraft';
import './pv-demo-form.css';

type FormSession = { key: number; snapshot: PvDemoSnapshot; profile?: PvProfile };
export function PvDemoCatalogue({ adapter: supplied, onBlockedChange, onFeedback }: {
  adapter?: PvDemoAdapter; onBlockedChange: (blocked: boolean) => void;
  onFeedback: (message: string) => void;
}) {
  const adapter = useMemo(() => supplied ?? createPvDemoAdapter(), [supplied]);
  const tx = useUiCopy(PV_DEMO_COPY), serial = useRef(0), activeCommandId = useRef<string | null>(null);
  const [form, setForm] = useState<FormSession | null>(null), [saved, setSaved] = useState(false);
  const [detail, setDetail] = useState<{ id: string; snapshot: PvDemoSnapshot } | null>(null);
  const [preview, setPreview] = useState<PvDemoSnapshot | null>(null);
  const [search, setSearch] = useState(''), [visibility, setVisibility] = useState('all');
  const [sort, setSort] = useState('updated'), [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10);
  const state = usePvDemo(adapter, (_next, outcome, newer) => {
    if (activeCommandId.current !== outcome.receipt.commandId) return;
    setSaved(true);
    activeCommandId.current = null;
    if (!newer && !outcome.replayed) onFeedback(tx(!outcome.receipt.changed ? 'Không có thay đổi.' :
      outcome.receipt.command === 'pv-products.create' ? 'Đã thêm sản phẩm.' : 'Đã lưu thay đổi.'));
  });
  const snapshot = state.snapshot;
  const ready = state.phase === 'ready' && !state.busy && adapter.available;
  const uncertain = ['pending', 'blocked', 'readback'].includes(state.phase);
  // Recovery uncertainty locks writes, but must still allow a safe exit to the readonly source catalogue.
  useEffect(() => { onBlockedChange(!!form || state.busy); }, [form, state.busy, onBlockedChange]);
  useEffect(() => () => onBlockedChange(false), [onBlockedChange]);
  useEffect(() => {
    if (!ready || detail?.snapshot !== snapshot) setDetail(null);
    if (!ready || preview !== snapshot) setPreview(null);
  }, [ready, snapshot, detail, preview]);
  useEffect(() => {
    // A definitive rejection releases this form's ID; unknown outcomes retain it.
    if (ready && !state.request) activeCommandId.current = null;
  }, [ready, state.request]);
  const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi').trim();
  const filtered = useMemo(() => {
    if (!snapshot) return [];
    const query = fold(search);
    const rows = snapshot.profiles.filter(row => (visibility === 'all' || row.visibility === visibility) &&
      [row.displayName, pvMasters(snapshot, row.skuId)?.sku.code ?? '', pvMasters(snapshot, row.skuId)?.product.code ?? ''].some(value => fold(value).includes(query)));
    return rows.sort((a, b) => (sort === 'updated' ? b.updatedAt.localeCompare(a.updatedAt) :
      a.displayName.localeCompare(b.displayName, 'vi') * (sort === 'desc' ? -1 : 1)) || a.id.localeCompare(b.id));
  }, [snapshot, search, visibility, sort]);
  const currentPage = Math.max(1, Math.min(page, Math.ceil(filtered.length / pageSize) || 1));
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = ready && detail?.snapshot === snapshot ? snapshot?.profiles.find(row => row.id === detail.id) : undefined;
  function openForm(profile?: PvProfile) {
    if (!snapshot || !ready) return;
    activeCommandId.current = null;
    state.clearIssue(); setSaved(false); setForm({ key: ++serial.current, snapshot, profile });
  }
  async function reloadForm() {
    if (!form || state.busy) return;
    // Use the hook's guarded recovery/read path; never overwrite a draft on background refresh.
    await state.recover();
    setReloadRequested(true);
  }
  const [reloadRequested, setReloadRequested] = useState(false);
  useEffect(() => {
    if (!reloadRequested || state.busy) return;
    setReloadRequested(false);
    if (!snapshot || state.phase !== 'ready' || !form) return;
    const profile = form.profile ? snapshot.profiles.find(row => row.id === form.profile!.id) : undefined;
    if (form.profile && !profile) return;
    setForm({ key: ++serial.current, snapshot, profile }); state.clearIssue();
  }, [reloadRequested, state.busy, snapshot, state.phase]);
  function save(draft: PvDemoDraft) {
    if (!form || !ready || activeCommandId.current !== null) return;
    const commandId = crypto.randomUUID();
    const request = pvBuildRequest(form.snapshot, draft, commandId, form.profile);
    if (request) { activeCommandId.current = commandId; void state.execute(request); }
  }
  async function openPreview() {
    if (!ready) return;
    const next = await state.recover();
    if (next) setPreview(next);
  }
  const columns: TableColumn<PvProfile>[] = [
    { id: 'name', heading: tx('Tên hiển thị PV'), render: row => <span>{row.displayName}{!row.masterAvailable && <small className="pv-demo-master-warning">{tx('Sản phẩm liên kết không khả dụng')}</small>}</span> },
    { id: 'sku', heading: 'SKU', render: row => snapshot && pvMasters(snapshot, row.skuId)?.sku.code || row.skuId },
    { id: 'visibility', heading: tx('Trạng thái hiển thị'), render: row => tx(row.visibility === 'visible' ? 'Đang hiển thị' : 'Đang ẩn') },
    { id: 'updated', heading: tx('Cập nhật'), render: row => row.updatedAt },
    { id: 'actions', heading: tx('Thao tác'), kind: 'actions', render: row => <>
      <Button variant="ghost" iconOnly title={tx('Chi tiết')} aria-label={`${tx('Chi tiết')} ${row.displayName}`} disabled={!ready} onClick={() => { if (ready && snapshot) setDetail({ id: row.id, snapshot }); }}><Icon name="eye" /></Button>
      <Button variant="ghost" iconOnly title={tx('Chỉnh sửa')} aria-label={`${tx('Chỉnh sửa')} ${row.displayName}`}
        disabled={!ready || !row.masterAvailable || !snapshot || !pvMasterEligible(snapshot, row.skuId)} onClick={() => openForm(row)}><Icon name="edit" /></Button>
    </> },
  ];
  return <section className="pv-demo-catalogue" aria-label={tx('Catalog PV Demo')}>
    <div className="pv-demo-toolbar"><h2>{tx('Catalog PV Demo')}</h2>
      <Button variant="secondary" onClick={() => void state.recover()} disabled={state.busy || !!form}><Icon name="refresh" />{tx('Làm mới')}</Button>
      <Button variant="secondary" onClick={() => void openPreview()} disabled={!ready}><Icon name="eye" />{tx('Xem trước catalog Demo')}</Button>
      <Button onClick={() => openForm()} disabled={!ready}><Icon name="plus" />{tx('Thêm sản phẩm')}</Button>
    </div>
    {state.phase === 'loading' && <p role="status">{tx('Đang kiểm tra kết quả lưu.')}</p>}
    {state.issue && !form && <Feedback tone="warning" title={tx(state.issue.message)} live />}
    {uncertain && !form && <div className="pv-demo-recovery"><Feedback title={tx('Đang kiểm tra kết quả lưu.')} live />
      <Button onClick={() => void state.recover()} disabled={state.busy}>{tx('Kiểm tra lại')}</Button>
      {state.phase === 'pending' && <Button onClick={() => void state.recover(true)} disabled={state.busy}>{tx('Tiếp tục yêu cầu đang chờ')}</Button>}
    </div>}
    {snapshot && <>
      <CatalogueSummary label={tx('Catalog PV Demo')}><SummaryMetric label={tx('Tổng sản phẩm')} value={snapshot.summary.total} icon="box" />
        <SummaryMetric label={tx('Đang hiển thị')} value={snapshot.summary.visible} icon="eye" /><SummaryMetric label={tx('Đang ẩn')} value={snapshot.summary.hidden} icon="eye-off" />
        <SummaryMetric label={tx('Chưa có ảnh')} value={snapshot.summary.missingImage} icon="image" /></CatalogueSummary>
      <div className="pv-demo-toolbar">
        <FilterInput label={tx('Tìm kiếm')} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
        <FilterSelect label={tx('Trạng thái hiển thị')} value={visibility} onChange={event => { setVisibility(event.target.value); setPage(1); }}>
          <option value="all">{tx('Tất cả')}</option><option value="visible">{tx('Đang hiển thị')}</option><option value="hidden">{tx('Đang ẩn')}</option>
        </FilterSelect>
        <FilterSelect label={tx('Sắp xếp')} value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}>
          <option value="updated">{tx('Cập nhật mới nhất')}</option><option value="asc">{tx('Tên A–Z')}</option><option value="desc">{tx('Tên Z–A')}</option>
        </FilterSelect>
      </div>
      <DataTable caption={tx('Catalog PV Demo')} columns={columns} rows={rows} rowKey={row => row.id} busy={state.busy}
        emptyStateKind="no-results" emptyContent={<p role="status">{tx('Chưa có hồ sơ phù hợp.')}</p>} />
      <Pagination page={currentPage} pageSize={pageSize} filteredTotal={filtered.length} displayedCount={rows.length}
        canGoPrevious={currentPage > 1} canGoNext={currentPage * pageSize < filtered.length} onPageChange={setPage}
        pageSizeOptions={[10, 15, 25, 50]} onPageSizeChange={value => { setPageSize(value); setPage(1); }} />
    </>}
    <GlobalModal open={!!selected} title={tx('Chi tiết hồ sơ PV Demo')} onClose={() => setDetail(null)}
      footer={<Button onClick={() => setDetail(null)}>{tx('Đóng')}</Button>}>
      {selected && snapshot ? <dl className="pv-demo-form__context">
        <div><dt>{tx('Hồ sơ')}</dt><dd>{selected.id}</dd></div><div><dt>{tx('Phiên bản')}</dt><dd>{selected.version}</dd></div>
        <div><dt>{tx('Tên hiển thị PV')}</dt><dd>{selected.displayName}</dd></div>
        <div><dt>{tx('Sản phẩm')}</dt><dd><a href={pvMasterHref('S03', selected.productId)}>{pvMasters(snapshot, selected.skuId)?.product.code ?? selected.productId}</a></dd></div>
        <div><dt>SKU</dt><dd><a href={pvMasterHref('S04', selected.skuId)}>{pvMasters(snapshot, selected.skuId)?.sku.code ?? selected.skuId}</a></dd></div>
        <div><dt>{tx('Trạng thái hiển thị')}</dt><dd>{tx(selected.visibility === 'visible' ? 'Đang hiển thị' : 'Đang ẩn')}</dd></div>
        <div><dt>{tx('Cập nhật')}</dt><dd>{selected.updatedAt}</dd></div>
        <div><dt>{tx('Ảnh sản phẩm')}</dt><dd>{pvAssetPath(snapshot, selected.imageAssetId) ? <img className="pv-demo-image" src={pvAssetPath(snapshot, selected.imageAssetId)!} alt={selected.displayName} /> : tx('Không có ảnh')}</dd></div>
        {!selected.masterAvailable && <div><dd>{tx('Sản phẩm liên kết không khả dụng')}</dd></div>}
      </dl> : <p role="status">{tx('Không tìm thấy hồ sơ.')}</p>}
    </GlobalModal>
    <GlobalModal open={ready && preview !== null && preview === snapshot} title={tx('Xem trước catalog Demo')} onClose={() => setPreview(null)} size="large"
      footer={<Button onClick={() => setPreview(null)}>{tx('Đóng')}</Button>}>
      {snapshot && <ul className="pv-demo-preview">{pvPreviewRows(snapshot).map(row => <li key={row.id}>
        {pvAssetPath(snapshot, row.imageAssetId) ? <img className="pv-demo-image" src={pvAssetPath(snapshot, row.imageAssetId)!} alt="" /> : <Icon name="image" aria-label={tx('Không có ảnh')} />}
        <strong>{row.displayName}</strong>
      </li>)}</ul>}
      {(!snapshot || !pvPreviewRows(snapshot).length) && <p>{tx('Chưa có sản phẩm để xem trước.')}</p>}
    </GlobalModal>
    {form && <PvDemoForm key={form.key} snapshot={form.snapshot} profile={form.profile} busy={state.busy} locked={uncertain}
      uncertain={uncertain} issue={state.issue} saved={saved} onSave={save} onRecover={() => void state.recover(state.phase === 'pending')}
      onReload={() => void reloadForm()} onClosed={() => { activeCommandId.current = null; setForm(null); setSaved(false); state.clearIssue(); }} />}
  </section>;
}
