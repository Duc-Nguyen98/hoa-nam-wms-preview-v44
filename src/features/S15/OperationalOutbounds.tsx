import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { Button, DataTable, GlobalModal, StatusBadge, Icon, PageState, Pagination, FilterSelect, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { createOutboundBinding, type OutboundAdapter, type OutboundIntent, type OutboundRecord } from './outbound-binding';
import { useGlobalToast } from '../../toast/GlobalToastProvider';
import { outboundRecipient, queryOutbounds } from './outbound-presentation';
import { OUTBOUND_DESIGN_EN } from './outbound-design-copy';
import type { CatalogSnapshot } from '../../contracts/catalog-create';
import { copyText } from '../../shared/copy-text';
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
export function OperationalOutbounds({ adapter: supplied, notify, readCatalog }: { adapter?: OutboundAdapter; notify: (message: string) => void; readCatalog?: () => Promise<CatalogSnapshot> }) {
  const tx = useUiCopy({ ...OUTBOUND_OPERATIONAL_COPY, ...OUTBOUND_DESIGN_EN });
  const adapter = useMemo(() => supplied ?? createOperationalWebAdapter(undefined, { scope: 'S15' }), [supplied]);
  const controller = useMemo(() => { const catalog = createCatalogCreateAdapter('sku'); return createOutboundBinding(adapter, readCatalog ?? (() => catalog.readSnapshot())); }, [adapter, readCatalog]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [selected, setSelected] = useState<string | null>(null), [intent, setIntent] = useState<OutboundIntent | null>(null);
  const panel = useRef<HTMLElement>(null), returnSelection = useRef<{ id: string; fence: OutboundIntent['fence'] } | null>(null);
  const snapshot = state.snapshot, selection=returnSelection.current;
  const sameSession=!selection || (snapshot && snapshot.token.epoch===selection.fence.epoch && snapshot.token.scenarioId===selection.fence.scenarioId && snapshot.token.generation===selection.fence.generation);
  const row=sameSession?snapshot?.outbounds.find(r=>r.id===selected):undefined, locked=state.busy||state.recovery||!snapshot;
  const toast=useGlobalToast();
  const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[page,setPage]=useState(1),[pageSize,setPageSize]=useState(10);
  const filtered=queryOutbounds(snapshot?.outbounds??[],search,status,state.catalog?.recipients),pageCount=Math.max(1,Math.ceil(filtered.length/pageSize)),currentPage=Math.min(page,pageCount),rows=filtered.slice((currentPage-1)*pageSize,currentPage*pageSize);
  const reset=()=>{setSearch('');setStatus('');setPage(1);};
  const forbidden=['FORBIDDEN','MOCK_COMMAND_FORBIDDEN'].includes(state.error);
  const expired=state.error==='SESSION_EXPIRED';
  const copyValue=async(value:string,origin:HTMLButtonElement)=>{let success=false;try{await copyText(value);success=true;}catch{}toast.notify({origin,tone:success?'success':'error',dedupeKey:'s15-copy',message:language=>success?({vi:'Đã sao chép.',en:'Copied.','zh-CN':'已复制。'}[language]):({vi:'Không thể sao chép. Vui lòng thử lại.',en:'Unable to copy. Please try again.','zh-CN':'无法复制，请重试。'}[language])});};
  const codeValue=(label:string,value:string,full=false)=><div className={`s15-copy-value${full?' s15-copy-value--full':''}`}><code title={value}>{value}</code><Button variant="ghost" iconOnly aria-label={tx('Sao chép {label}',{label:tx(label)})} data-s15-copy={label} onClick={event=>void copyValue(value,event.currentTarget)}><Icon name="copy" size={20}/></Button></div>;
  const openRow=(r:OutboundRecord)=>{if(snapshot)returnSelection.current={id:r.id,fence:snapshot.token};setSelected(r.id);};
  const viewButton=(r:OutboundRecord)=><Button variant="ghost" className="s15-view-button" aria-haspopup="dialog" data-s15-operational-action={r.id} onClick={()=>openRow(r)}>{tx('Xem chi tiết')}<Icon name="chevron-right" size={20}/></Button>;
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
        .find(element => element.getAttribute('data-s15-operational-action') === target.id && element.getClientRects().length>0 && !element.matches(':disabled'))
      : null;
    return action ?? root.querySelector<HTMLElement>('[data-s15-operational-heading]');
  }
  async function confirm() {
    if (!intent) return;
    const before = controller.getSnapshot().acceptedSequence; await controller.act(intent);
    if (controller.getSnapshot().acceptedSequence > before) notify(tx(intent.command === 'outbound.receive' ? 'Đã tiếp nhận phiếu xuất.' : 'Đã xác nhận xuất kho.'));
  }
  const badge = (r: OutboundRecord) => <StatusBadge tone={r.data.status === 'POSTED' ? 'success' : r.data.status === 'DRAFT' ? 'neutral' : 'warning'}>{tx(STATUS[r.data.status])}</StatusBadge>;
  const recipient=(r:OutboundRecord)=>outboundRecipient(r,state.catalog?.recipients);
  const columns:TableColumn<OutboundRecord>[]=[
    {id:'code',heading:tx('Phiếu xuất'),render:r=>codeValue('Mã phiếu',r.data.code)},
    {id:'recipient',heading:tx('Người nhận'),render:r=><div className="s15-recipient-cell"><strong>{recipient(r)?.name??tx('Chưa được cung cấp')}</strong>{recipient(r)?.address&&<span><Icon name="map-pin" size={18}/>{recipient(r)?.address}</span>}{recipient(r)?.contact&&<span><Icon name="users" size={18}/>{recipient(r)?.contact}</span>}</div>},
    {id:'status',heading:tx('Trạng thái'),render:badge},
    {id:'action',heading:tx('Thao tác'),kind:'actions',render:viewButton},
  ];
  const archiveInfo = state.archivedReconciled && <p role="status">{tx('Đã đối chiếu thao tác của phiên đã lưu trữ. Danh sách hiện tại không thay đổi.')}</p>;
  const controls = outboundReadControls(state);
  const readControls = <><Button variant="secondary" disabled={controls.readDisabled} leadingIcon={<Icon name="refresh" size={20}/>} onClick={() => void controller.load()}>{tx('Đọc lại dữ liệu')}</Button>{controls.showReconcile && <Button disabled={state.busy} onClick={() => void controller.retry()}>{tx('Kiểm tra lại thao tác')}</Button>}</>;
  const rec = row && recipient(row);
  const initialLoading=!snapshot&&(state.busy||!state.error);
  const listSummary=<><span>{tx('{count} phiếu trong phiên hiện tại.',{count:filtered.length})}</span><span><Icon name="info" size={20}/>{tx('Thông tin phiếu được đồng bộ từ App quét.')}</span></>;
  return <><section ref={panel} className="s15-list hn-premium-panel" aria-label={tx('Phiếu xuất phiên hiện tại')} data-operational-outbounds>
    <div className="s15-operational-heading"><h2 tabIndex={-1} data-s15-operational-heading>{tx('Phiếu xuất phiên hiện tại')}{snapshot?` (${filtered.length})`:''}</h2><div className="s15-action-row">{readControls}</div></div>
    <div className="s15-operational-filters"><label className="s15-search"><span>{tx('Tìm kiếm')}</span><div><Icon name="search" size={22}/><input id="s15-operational-search" type="search" value={search} placeholder={tx('Tìm mã phiếu hoặc người nhận')} onChange={event=>{setSearch(event.target.value);setPage(1);}}/></div></label><FilterSelect label={tx('Trạng thái')} value={status} onChange={event=>{setStatus(event.target.value);setPage(1);}}><option value="">{tx('Tất cả trạng thái')}</option>{Object.entries(STATUS).map(([key,label])=><option key={key} value={key}>{tx(label)}</option>)}</FilterSelect><Button variant="secondary" leadingIcon={<Icon name="refresh" size={20}/>} onClick={reset}>{tx('Đặt lại')}</Button></div>
    {archiveInfo}{snapshot&&state.busy&&<p role="status" className="s15-refreshing">{tx('Dữ liệu đang được cập nhật.')}</p>}
    {!snapshot?<PageState kind={initialLoading?'loading':controls.showReconcile?'stale':expired?'unauthorized':forbidden?'forbidden':'error'} title={tx(initialLoading?'Đang đọc dữ liệu…':controls.showReconcile?'Kiểm tra lại thao tác':expired?'Phiên đăng nhập đã hết hạn':forbidden?'Không có quyền':'Lỗi tải dữ liệu')} description={tx(initialLoading?'Vui lòng chờ trong giây lát.':controls.showReconcile?outboundErrorMessage(state):expired?'Vui lòng đăng nhập lại để tiếp tục.':forbidden?'Bạn không có quyền xem thông tin phiếu này.':'Không thể tải danh sách phiếu xuất.')} onRetry={!forbidden&&!expired&&!controls.readDisabled?()=>void controller.load():undefined} action={forbidden||expired?<Button onClick={()=>{location.hash='#/preview/S01';}}>{tx('Tổng quan')}</Button>:undefined}/>:!filtered.length?<PageState kind={search||status?'no-results':'empty'} title={tx(search||status?'Không có kết quả':'Chưa có phiếu')} description={tx(search||status?'Không tìm thấy phiếu phù hợp.':'Chưa có phiếu xuất trong phiên hiện tại.')} action={<Button onClick={search||status?reset:()=>void controller.load()}>{tx(search||status?'Xóa bộ lọc':'Đọc lại dữ liệu')}</Button>}>{!search&&!status&&<p>{tx('Phiếu sẽ xuất hiện sau khi được gửi từ App quét.')}</p>}</PageState>:<><div className="s15-operational-table"><DataTable caption={tx('Phiếu xuất phiên hiện tại')} captionVisibility="sr-only" columns={columns} rows={rows} rowKey={r=>r.id} appearance="refined" busy={state.busy}/></div><div className="s15-operational-cards">{rows.map(r=><article key={r.id} className="s15-outbound-card"><div><span className="s15-field-label">{tx('Mã phiếu xuất')}</span>{codeValue('Mã phiếu',r.data.code)}{badge(r)}</div><div className="s15-card-recipient"><Icon name="user" size={32}/><div><span className="s15-field-label">{tx('Người nhận')}</span><strong>{recipient(r)?.name??tx('Chưa được cung cấp')}</strong></div></div>{viewButton(r)}</article>)}</div></>}
    {snapshot&&state.error&&<p role="alert">{tx(outboundErrorMessage(state))}</p>}
    {snapshot&&<div className="s15-operational-footer s15-operational-footer--desktop">{listSummary}</div>}
    {filtered.length>10&&<Pagination variant="products" unit={tx('phiếu')} page={currentPage} pageSize={pageSize} filteredTotal={filtered.length} displayedCount={rows.length} canGoPrevious={currentPage>1} canGoNext={currentPage<pageCount} onPageChange={setPage} pageSizeOptions={[10,20,50]} onPageSizeChange={size=>{setPageSize(size);setPage(1);}}/>}
    <GlobalModal className="s15-operational-detail" resolveReturnFocus={resolveDetailReturnFocus} open={!!selected&&!intent} title={tx('Chi tiết phiếu xuất')} description={tx('Thông tin được gửi từ App quét')} size="large" onClose={()=>setSelected(null)} footer={<><div className="hn-modal-footer-tools">{readControls}</div><Button onClick={()=>setSelected(null)}>{tx('Đóng')}</Button></>}>
      {!row||!snapshot?<PageState kind={initialLoading?'loading':state.error?(expired?'unauthorized':forbidden?'forbidden':'error'):'record-not-found'} title={tx(state.busy?'Đang đọc dữ liệu…':state.error?(expired?'Phiên đăng nhập đã hết hạn':forbidden?'Không có quyền':'Lỗi tải dữ liệu'):'Không tìm thấy phiếu')} description={tx(state.busy?'Vui lòng chờ trong giây lát.':state.error?(expired?'Vui lòng đăng nhập lại để tiếp tục.':forbidden?'Bạn không có quyền xem thông tin phiếu này.':'Không thể tải danh sách phiếu xuất.'):'Không tìm thấy phiếu xuất được yêu cầu.')} action={!state.busy&&<Button onClick={()=>setSelected(null)}>{tx('Quay lại danh sách')}</Button>}/>:<div className="s15-detail-sections" data-operational-outbound-id={row.id}>
        <section className="s15-status-panel"><h3>{tx('Trạng thái xuất kho')}</h3>{badge(row)}<dl><div><dt>{tx('Số bút toán xuất kho')}</dt><dd>{row.data.postedEventIds.length}</dd></div></dl></section>
        <section><div className="s15-section-heading"><h3>{tx('Người nhận')}</h3><span>{tx(row.data.recipientSnapshot?'Thông tin tại thời điểm App gửi':rec?'Người nhận hiện tại':'Thông tin tại thời điểm App gửi')}</span></div>{rec?<dl className="s15-recipient-grid">{([['building','Tên đơn vị',rec.name],['map-pin','Địa chỉ nhận hàng',rec.address],['user','Liên hệ',[rec.contact,rec.phone].filter(Boolean).join(' · ')]] as const).map(([icon,label,value])=><div key={label}><Icon name={icon} size={28}/><div><dt>{tx(label)}</dt><dd>{value||tx('Chưa được cung cấp')}{label==='Tên đơn vị'&&rec.code&&<small className="s15-recipient-code">{rec.code}</small>}</dd></div></div>)}</dl>:<p>{tx('Chưa có snapshot người nhận từ App.')}</p>}</section>
        <section><h3>{tx('Mã đã chọn')}</h3><div className="s15-selected-lines"><table><caption className="hn-sr-only">{tx('Mã đã chọn')}</caption><thead><tr><th>{tx('SKU')}</th><th>{tx('Số lượng yêu cầu')}</th><th>{tx('Mã đã chọn')}</th></tr></thead><tbody>{row.data.requestedLines.map(line=>{const physical=row.data.allocatedPhysicalIds.map(id=>snapshot.physical.find(p=>p.id===id)).filter(p=>p?.data.skuId===line.skuId);return <tr key={line.id}><td>{state.catalog?.skus.find(sku=>sku.id===line.skuId)?.code??tx('Hồ sơ SKU không khả dụng')}</td><td>{line.quantity}</td><td>{physical.length?physical.map(p=>p&&<div key={p.id}>{codeValue('Mã đã chọn',p.data.physicalCode,true)}</div>):'—'}</td></tr>;})}</tbody></table></div>{row.data.allocatedPhysicalIds.some(id=>!snapshot.physical.some(p=>p.id===id))&&<p role="status">{tx('Mã không khả dụng')}</p>}</section>
        <section><h3>{tx('Thông tin truy vết')}</h3><dl className="s15-trace-grid"><div><dt>{tx('Mã phiếu')}</dt><dd>{codeValue('Mã phiếu',row.data.code,true)}</dd></div><div><dt>{tx('Mã tạo yêu cầu')}</dt><dd>{codeValue('Mã tạo yêu cầu',row.data.appRequestId,true)}</dd></div></dl></section>
        {['SUBMITTED', 'READY'].includes(row.data.status) ? <Button disabled={locked} onClick={() => setIntent({ id: row.id, code: row.data.code, version: row.version, fence: snapshot.token, command: row.data.status === 'SUBMITTED' ? 'outbound.receive' : 'outbound.post' })}>{tx(row.data.status === 'SUBMITTED' ? 'Tiếp nhận phiếu' : 'Xác nhận xuất kho')}</Button>
          : row.data.status !== 'POSTED' && <p>{tx('Chờ App quét và gửi đủ mã trước khi tiếp nhận.')}</p>}
      </div>}
      {state.error && <p role="alert">{tx(outboundErrorMessage(state))}</p>}{archiveInfo}
    </GlobalModal>
    <GlobalModal open={!!intent} title={tx(intent?.command === 'outbound.receive' ? 'Tiếp nhận phiếu' : 'Xác nhận xuất kho')} onClose={() => { if (!state.busy) setIntent(null); }} footer={<><div className="hn-modal-footer-tools">{readControls}</div><Button variant="secondary" disabled={state.busy} onClick={() => setIntent(null)}>{tx('Hủy')}</Button><Button disabled={locked} onClick={() => void confirm()}>{tx(intent?.command === 'outbound.receive' ? 'Tiếp nhận phiếu' : 'Xác nhận xuất kho')}</Button></>}>
      <p><strong>{intent?.code}</strong></p><p>{tx(intent?.command === 'outbound.receive' ? 'Tiếp nhận phiếu App đã gửi. Tồn kho chưa thay đổi.' : 'Xác nhận xuất đúng các mã đã được App gửi. Thao tác này làm giảm tồn kho.')}</p>
      {state.error && <p role="alert">{tx(outboundErrorMessage(state))}</p>}{archiveInfo}
    </GlobalModal>
  </section>{snapshot&&<div className="s15-operational-footer s15-operational-footer--tablet">{listSummary}</div>}</>;
}
