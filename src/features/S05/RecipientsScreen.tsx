import { useShellPreferences } from '../../shared/shell-preferences';
import { formatBusinessDate } from '../../i18n/format-business-date';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { DEFAULT_RECIPIENTS_QUERY, resetRecipientsQuery } from '../../contracts/recipients';
import type { RecipientRow, RecipientSortKey, RecipientsDataAdapter, RecipientsQuery } from '../../contracts/recipients';
import { createRecipientsRuntimeController } from '../../controllers/recipients-runtime';
import { getRecipientsPresentation } from '../../controllers/recipients-presentation';
import { recordReviewDiagnostic, recordUnresolvedAction } from '../../app/review-diagnostics';
import { CatalogueHeader, CatalogueSummary, SummaryMetric, CatalogueListHeader, CatalogueToolbar, NoticeSlot, ordinalColumn, Button, DataTable, FilterSelect, GlobalShell, Icon, InitialReadState, Pagination, StatusBadge } from '../../shared';
import type { TableColumn } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { revealRecipientControl } from './recipient-focus';
import { RecipientNotice, type RecipientFeedback } from './RecipientNotice';
import { RecipientDetailDialog } from './RecipientDetailDialog';
import { RecipientUpdateDialog } from './RecipientUpdateDialog';
import type { RecipientUpdateAdapter } from './recipient-update-command';
import type { CatalogCreateAdapter } from '../../contracts/catalog-create';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { RecipientCatalog } from './RecipientCatalog';
import { RECIPIENT_CATALOG_COPY } from './recipient-catalog-copy';
import './recipients.css';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { CATALOGUE_EN_COPY } from '../../i18n/catalogue-copy';

const RECIPIENT_EN_COPY = { ...CATALOGUE_EN_COPY, ...RECIPIENT_CATALOG_COPY, 'Chưa có thông tin phân loại.': 'Classification information is not available yet.', 'Đã lưu thông tin nơi nhận.':'Recipient information saved.' };

const queries = ['(pointer: coarse)', '(orientation: portrait)', '(max-width: 1023px)'];
function subscribeLayout(update: () => void) {
  const media = queries.map(q => matchMedia(q));
  media.forEach(m => m.addEventListener('change', update));
  return () => media.forEach(m => m.removeEventListener('change', update));
}
function getLayout() {
  const [touch, portrait, narrow] = queries.map(q => matchMedia(q).matches);
  return touch || narrow ? (portrait || narrow ? 'portrait' : 'landscape') : 'desktop';
}
type ReadAction = 'initial' | 'filter' | 'reset' | 'page' | 'sort' | 'refresh';

export function RecipientsScreen({ adapter, updateAdapter, catalogCreateAdapter }: { adapter?: RecipientsDataAdapter; updateAdapter?: RecipientUpdateAdapter; catalogCreateAdapter?: CatalogCreateAdapter<'recipient'> } = {}) {
  const tx = useUiCopy(RECIPIENT_EN_COPY);
  const { language } = useShellPreferences();
  const controller = useMemo(() => createRecipientsRuntimeController(adapter), [adapter]);
  const catalogAdapter = useMemo(() => catalogCreateAdapter ?? createCatalogCreateAdapter('recipient'), [catalogCreateAdapter]);
  const [cohort, setCohort] = useState<'source' | 'new'>('source');
  const [creating, setCreating] = useState(false);
  const createOrigin = useRef<HTMLElement | null>(null);
  const presentation = useMemo(getRecipientsPresentation, []);
  const layout = useSyncExternalStore(subscribeLayout, getLayout, () => 'desktop');
  const runtime = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = runtime.model;
  const query = runtime.intendedQuery ?? DEFAULT_RECIPIENTS_QUERY;
  const [refreshing, setRefreshing] = useState(false);
  const [tableScroll, setTableScroll] = useState({ overflow: false, atStart: true, atEnd: true });
  const readSequence = useRef(0);
  const [notice, setNotice] = useState<RecipientFeedback | null>(null);
  const [detailRow, setDetailRow] = useState<RecipientRow | null>(null);
  const [editingKey,setEditingKey]=useState<string|null>(null);
  const editOrigin=useRef<HTMLElement|null>(null);
  const detailOrigin = useRef<HTMLElement | null>(null);
  const localizedNotice = useMemo(() => notice && { ...notice, message: tx(notice.message) }, [notice, tx]);
  const sequence = useRef(0);
  const screen = useRef<HTMLDivElement>(null);
  const focusFrame = useRef<number | null>(null);
  const lastFocusedRow = useRef<{element:HTMLElement;code:string} | null>(null);
  const lastFocusedHeading = useRef<HTMLElement | null>(null);
  const notify = useCallback((message:string, origin:HTMLElement|null = document.activeElement instanceof HTMLElement ? document.activeElement : null, tone:RecipientFeedback['tone'] = 'info') => setNotice({message,origin,sequence:++sequence.current,tone,container:document.body}), []);
  const notifyCatalog = useCallback((message: string) => notify(message, null, 'success'), [notify]);

  const settleRead = useCallback((outcome: Awaited<ReturnType<typeof controller.load>>, action: ReadAction, origin: HTMLElement | null) => {
    if (outcome.kind === 'superseded') return;
    setRefreshing(false);
    if (outcome.kind === 'error') {
      recordReviewDiagnostic({kind:'runtime-error',key:'S05_READ',detail:String(outcome.error)});
      if (controller.getSnapshot().model) notify('Chưa thể đọc danh sách. Vui lòng thử lại.',origin,'error');
    } else if (outcome.result.kind === 'blocked') {
      recordReviewDiagnostic({kind:'blocked-query',key:`S05:${outcome.result.reason}`,detail:outcome.result.detail});
      if (controller.getSnapshot().model) notify('Lựa chọn này chưa khả dụng trong bản xem trước. Danh sách đang hiển thị được giữ nguyên.',origin);
    } else {
      if (action === 'refresh') notify('Đã cập nhật danh sách nơi nhận.',origin,'success');
      if (action === 'reset') notify('Đã đặt lại bộ lọc nơi nhận.',origin,'success');
    }
  }, [controller, notify]);
  useEffect(() => {
    const id = ++readSequence.current;
    void controller.load().then(outcome => { if (id === readSequence.current) settleRead(outcome,'initial',null); });
    return () => { ++readSequence.current; controller.clear(); };
  }, [controller,settleRead]);
  useLayoutEffect(() => {
    const heading = lastFocusedHeading.current;
    if (heading && !heading.isConnected && document.activeElement === document.body) {
      screen.current?.querySelector<HTMLElement>('thead .hn-table-sort')?.focus({preventScroll:true});
    }
    const previous = lastFocusedRow.current;
    if (previous && !previous.element.isConnected && document.activeElement === document.body) {
      screen.current?.querySelector<HTMLElement>(`[data-recipient-code="${CSS.escape(previous.code)}"]`)?.focus({preventScroll:true});
    }
    const active = document.activeElement;
    if (active instanceof HTMLElement && screen.current?.contains(active)) revealRecipientControl(active);
  }, [layout]);
  useEffect(() => {
    const reveal = () => {
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
      focusFrame.current = requestAnimationFrame(() => {
        const active = document.activeElement;
        if (active instanceof HTMLElement && screen.current?.contains(active) && !document.querySelector('dialog[open]')) revealRecipientControl(active);
      });
    };
    const observer = new ResizeObserver(reveal);
    if (screen.current) observer.observe(screen.current);
    window.addEventListener('resize',reveal);
    return () => { observer.disconnect(); window.removeEventListener('resize',reveal); if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current); };
  }, []);
  useLayoutEffect(() => {
    const region=screen.current?.querySelector<HTMLElement>('.recipient-table .hn-table-scroll');
    if (!region) return;
    region.id='recipient-table-region';
    const measure=()=>{
      const maximum=region.scrollWidth-region.clientWidth;
      const overflow=maximum>1;
      const next={overflow,atStart:region.scrollLeft<=1,atEnd:region.scrollLeft>=maximum-1};
      // The controls disappear when all columns fit. Move their keyboard focus
      // into a visible heading before hiding them; never leave focus in hidden UI.
      if(!overflow && document.activeElement?.closest('.recipient-scroll-hint')) {
        region.querySelector<HTMLButtonElement>('thead button')?.focus({preventScroll:true});
      }
      setTableScroll(current=>current.overflow===next.overflow&&current.atStart===next.atStart&&current.atEnd===next.atEnd?current:next);
      if(overflow)region.setAttribute('aria-describedby','recipient-table-scroll-hint');
      else region.removeAttribute('aria-describedby');
    };
    const observer=new ResizeObserver(measure);
    observer.observe(region);
    const table=region.querySelector('table');
    if(table)observer.observe(table);
    region.addEventListener('scroll',measure,{passive:true});
    measure();
    return ()=>{observer.disconnect();region.removeEventListener('scroll',measure);};
  }, [Boolean(model),layout]);
  function openDetail(row: RecipientRow, origin: HTMLElement) {
    detailOrigin.current = origin;
    setNotice(null);
    setDetailRow(row);
  }
  function closeDetail() {
    setDetailRow(null);
    const opener = detailOrigin.current;
    detailOrigin.current = null;
    requestAnimationFrame(() => {
      // Native dialog close restores focus before this frame. If the user has
      // already moved to another control, preserve that newer focus intent.
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.isConnected && active !== document.body &&
        active !== document.documentElement && active !== opener && !active.closest('.recipient-detail-dialog')) return;
      const target = opener?.isConnected ? opener : screen.current?.querySelector<HTMLElement>('thead button');
      target?.focus({ preventScroll: true });
    });
  }
  function closeEdit() {
    setEditingKey(null);
    const target=editOrigin.current;editOrigin.current=null;
    requestAnimationFrame(()=>{
      const active=document.activeElement;
      if(active instanceof HTMLElement && active!==document.body && active!==document.documentElement && !active.closest('.recipient-update-dialog'))return;
      (target?.isConnected?target:screen.current?.querySelector<HTMLElement>('thead button'))?.focus({preventScroll:true});
    });
  }
  function openCreate() {
    if (!catalogAdapter.available) { unavailable('S05:add', 'Thêm nơi nhận chưa khả dụng trong bản xem trước.'); return; }
    createOrigin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setNotice(null);
    setCreating(true);
  }
  function closeCreate() {
    setCreating(false);
    requestAnimationFrame(() => createOrigin.current?.isConnected && createOrigin.current.focus({ preventScroll: true }));
  }
  function createdRecipient() {
    setCreating(false);
    setCohort('new');
    notify('Đã tạo nơi nhận.', createOrigin.current, 'success');
  }
  async function afterSave() {
    const outcome=await controller.load(controller.getSnapshot().acceptedQuery??DEFAULT_RECIPIENTS_QUERY);
    if(outcome.kind!=='superseded'&&(outcome.kind==='error'||outcome.result.kind!=='ready'))throw Error('S05_REFRESH_FAILED');
    notify('Đã lưu thông tin nơi nhận.',editOrigin.current,'success');
  }
  function scrollTable(direction: -1 | 1) {
    const region=screen.current?.querySelector<HTMLElement>('.recipient-table .hn-table-scroll');
    if(!region || (direction<0?tableScroll.atStart:tableScroll.atEnd)) return;
    const fixedCell=region.querySelector<HTMLElement>('thead th:last-child');
    const fixedWidth=fixedCell&&getComputedStyle(fixedCell).position==='sticky'?fixedCell.getBoundingClientRect().width:0;
    region.scrollBy({left:direction*Math.max(80,region.clientWidth-fixedWidth-32),behavior:'instant'});
  }
  function read(operation: () => ReturnType<typeof controller.load>, action:ReadAction) {
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = ++readSequence.current;
    setNotice(null);
    setRefreshing(action === 'refresh');
    void operation().then(outcome => { if (id === readSequence.current) settleRead(outcome,action,origin); });
  }
  function retryInitialRead() { read(() => controller.load(runtime.acceptedQuery ?? runtime.intendedQuery ?? DEFAULT_RECIPIENTS_QUERY), 'initial'); }
  function unavailable(key:string,message:string) { recordUnresolvedAction(key); notify(message); }
  function changeQuery(patch:Partial<RecipientsQuery>, action:ReadAction = 'filter') { read(()=>controller.update(patch),action); }
  function sortBy(key:string) {
    const current = controller.getSnapshot().intendedQuery?.sort;
    changeQuery({sort:{key:key as RecipientSortKey,direction:current?.key===key&&current.direction==='asc'?'desc':'asc'}},'sort');
  }
  const acceptedLabel = model ? [model.query.search.trim() && tx('Tìm “{query}”', { query: model.query.search.trim() }), model.query.type !== 'all' && model.query.type, model.query.status !== 'all' && tx(model.query.status==='active'?'Đang sử dụng':'Ngừng sử dụng')].filter(Boolean).join(' · ') || tx('Tất cả') : tx('Tất cả');
  const editButton = (row:RecipientRow) => <Button variant="secondary" className="recipient-edit" data-recipient-code={row.code} aria-label={tx('Sửa {code}', { code: row.code })} onClick={event=>{
    if(!updateAdapter?.available){unavailable(`S05:edit:${row.key}`,'Sửa nơi nhận chưa khả dụng trong bản xem trước.');return;}
    editOrigin.current=event.currentTarget;setNotice(null);setEditingKey(row.key);
  }}><Icon name="edit" width={17} height={17}/>{tx("Sửa")}</Button>;
  const columns:TableColumn<RecipientRow>[] = [
    ordinalColumn(model?.pagination.page, model?.pagination.pageSize),
    {id:'recipient',heading: tx("Nơi nhận"),sortKey:'name',sortLabel: tx("Tên nơi nhận"),render:row=><button type="button" className="recipient-identity recipient-detail-opener" aria-label={tx("Xem {code}", { code: row.code })} aria-haspopup="dialog" data-recipient-code={row.code} onClick={event => openDetail(row,event.currentTarget)}><span className="recipient-avatar"><Icon name={row.type==='Khách công trình'?'building':'users'} width={22} height={22}/></span><span className="recipient-copy"><strong className="recipient-name">{row.name}</strong><span className="recipient-code">{row.code}</span></span></button>},
    {id:'type',heading: tx("Loại nơi nhận"),sortKey:'type',render:row=>row.type},
    {id:'market',heading: tx("Thị trường / Khu vực"),sortKey:'market',sortLabel: tx("Thị trường"),render:row=><span className="recipient-stack"><span>{row.market}</span><span>{row.area}</span></span>},
    {id:'contact',heading: tx("Liên hệ"),sortKey:'contact',sortLabel: tx("Người liên hệ"),render:row=><span className="recipient-stack"><span>{row.contact}</span><span className="recipient-phone">{row.phone}</span></span>},
    {id:'address',heading: tx("Địa chỉ"),sortKey:'address',render:row=>row.address},
    {id:'status',heading:tx('Trạng thái'),sortKey:'statusLabel',sortLabel: tx("Trạng thái"),render:row=><span className="recipient-status"><StatusBadge tone={row.status==='active'?'success':'neutral'}>{tx(row.statusLabel)}</StatusBadge></span>},
    {id:'action',heading: tx("Thao tác"),kind:'actions',render:editButton},
  ];
  return <GlobalShell title={tx("Danh mục đại lý & nơi nhận")} variant="wms" activeKey="S05" navigation={S00_SHELL_NAVIGATION} profile={presentation.profile}>
    <div className="recipient-screen hn-catalogue-screen" data-screen="S05" data-visual-variant="premium" data-table-layout={layout} ref={screen} onFocusCapture={event=>{
      const element=event.target;
      if (!(element instanceof HTMLElement)) return;
      lastFocusedHeading.current=element.closest('thead .hn-table-sort') as HTMLElement|null;
      if (element.dataset.recipientCode) lastFocusedRow.current={element,code:element.dataset.recipientCode};
      else lastFocusedRow.current=null;
      if (focusFrame.current!==null) cancelAnimationFrame(focusFrame.current);
      focusFrame.current=requestAnimationFrame(()=>{if(element.isConnected&&document.activeElement===element&&!document.querySelector('dialog[open]'))revealRecipientControl(element);});
    }}>
      <CatalogueHeader title={tx("Danh mục đại lý & nơi nhận")} breadcrumb={tx("Đại lý & nơi nhận")} description={tx("Quản lý thông tin nơi nhận phục vụ nghiệp vụ xuất kho")} action={tx("Thêm nơi nhận")} onAction={openCreate} />
      <div className="recipient-cohort-switch">
        <FilterSelect id="recipient-catalog-scope" data-recipient-scope={cohort} label={tx('Tập dữ liệu')} aria-label={tx('Tập dữ liệu')} value={cohort} onChange={event => setCohort(event.target.value as 'source' | 'new')}>
          <option value="source">{tx('Dữ liệu hiện có')}</option><option value="new">{tx('Hồ sơ tạo mới')}</option>
        </FilterSelect>
      </div>
      {!model&&<InitialReadState label={tx("Danh sách nơi nhận")} loading={runtime.loading || runtime.debouncing} error={runtime.error} blocked={Boolean(runtime.blocker)} onRetry={retryInitialRead} />}
      {model&&<>
        <CatalogueSummary label={tx("Số liệu nguồn")}>
          <SummaryMetric label={tx("Tổng số nơi nhận")} value={model.summary.total} detail={<>{tx("nơi nhận")}<span className="recipient-summary-date">{tx('Số liệu nguồn')} · {tx("Mốc")}{' '}{formatBusinessDate(model.summary.auditDate, language)}</span></>} icon="building"/>
          <div className="recipient-summary-types"><h2>{tx("Phân loại")}</h2>{model.summary.staticLabels.length > 0 ? <div>{model.summary.staticLabels.map((label,i)=><span key={label} className="recipient-type-label"><Icon name={i===0?'building':'users'} width={17} height={17}/>{label}</span>)}</div> : <p className="recipient-summary-empty">{tx('Chưa có thông tin phân loại.')}</p>}</div>
        </CatalogueSummary>
        <section hidden={cohort !== 'source'} data-recipient-cohort="source" className="recipient-panel recipient-list hn-premium-panel" aria-labelledby="recipient-list-title">
          <CatalogueListHeader id="recipient-list-title" title={tx("Danh sách nơi nhận")} count={`${model.pagination.total} ${tx('nơi nhận')}`}/>
          <p className="recipient-data-scope">{tx('Tìm kiếm, lọc và sắp xếp trong {count} bản ghi được cung cấp. Tổng hợp toàn danh mục hiển thị riêng ở trên.', { count: model.source.recordCount })}</p>
          <CatalogueToolbar id="recipient" label={tx("Bộ lọc nơi nhận")} searchLabel={tx("Tìm nơi nhận")} searchHint={tx("Theo mã, tên, thị trường hoặc khu vực")} searchValue={query.search} onSearchChange={search=>changeQuery({search})} applyMode="immediate" acceptedLabel={acceptedLabel} onReset={()=>read(()=>controller.reset(resetRecipientsQuery()),'reset')} onRefresh={()=>read(()=>controller.load(model.query),'refresh')} busy={refreshing}>
            <FilterSelect id="recipient-type" label={tx("Loại nơi nhận")} aria-label={tx("Loại nơi nhận")} value={query.type} onChange={e=>changeQuery({type:e.target.value})}><option value="all">{tx("Tất cả")}</option>{model.filterOptions.observedTypes.map(type=><option key={type} value={type}>{type}</option>)}</FilterSelect>
            <FilterSelect id="recipient-status" label={tx("Trạng thái")} aria-label={tx("Trạng thái")} value={query.status} onChange={e=>changeQuery({status:e.target.value as RecipientsQuery['status']})}><option value="all">{tx("Tất cả")}</option><option value="active">{tx("Đang sử dụng")}</option><option value="inactive">{tx("Ngừng sử dụng")}</option></FilterSelect>
          </CatalogueToolbar>
          <NoticeSlot name="table" />
          <div className="recipient-table" aria-busy={runtime.loading || runtime.debouncing}>
            <div className="recipient-scroll-hint" hidden={!tableScroll.overflow}>
              <span id="recipient-table-scroll-hint">{tx("Cuộn bảng bằng nút mũi tên")}</span>
              <div className="recipient-scroll-actions" role="group" aria-label={tx("Cuộn ngang bảng nơi nhận")}>
                <Button variant="secondary" aria-label={tx("Cuộn bảng sang trái")} aria-controls="recipient-table-region" aria-disabled={tableScroll.atStart} onClick={()=>scrollTable(-1)}><Icon name="chevron-left" width={18} height={18}/></Button>
                <Button variant="secondary" aria-label={tx("Cuộn bảng sang phải")} aria-controls="recipient-table-region" aria-disabled={tableScroll.atEnd} onClick={()=>scrollTable(1)}><Icon name="chevron-right" width={18} height={18}/></Button>
              </div>
            </div>
            <DataTable caption={tx("Danh sách nơi nhận")} columns={columns} rows={model.rows} rowKey={row=>row.key} sort={model.query.sort} onSort={sortBy} emptyStateKind="no-results" onResetFilters={()=>read(()=>controller.reset(resetRecipientsQuery()),"reset")} emptyContent={<p>{tx("Không tìm thấy nơi nhận phù hợp. Hãy đổi điều kiện hoặc đặt lại bộ lọc.")}</p>} scrollResetKey={JSON.stringify(model.query)} busy={runtime.loading || runtime.debouncing} appearance="refined"/>
          </div>
          <Pagination variant="products" unit={tx("nơi nhận")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page>1} canGoNext={model.pagination.page<model.pagination.pageCount} onPageChange={page=>changeQuery({page},'page')} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize=>changeQuery({pageSize})}/>
          <NoticeSlot name="pagination" />
        </section>
      </>}
      <RecipientCatalog adapter={catalogAdapter} active={cohort === 'new'} creating={creating} onCloseCreate={closeCreate} onCreated={createdRecipient} notify={notifyCatalog}/>
      <RecipientDetailDialog row={detailRow} onClose={closeDetail} />
      {editingKey&&updateAdapter&&<RecipientUpdateDialog rowKey={editingKey} adapter={updateAdapter} onClose={closeEdit} onSaved={afterSave}/>}
      {localizedNotice&&<RecipientNotice feedback={localizedNotice} onClose={()=>setNotice(null)}/>}
    </div>
  </GlobalShell>;
}
