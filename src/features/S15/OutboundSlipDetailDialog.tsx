import {useEffect,useRef} from 'react';
import type {OutboundSlipRow} from '../../contracts/outbound-slips';
import {Icon,StatusBadge} from '../../shared';
import {acquireBodyScrollLock} from '../../shared/body-scroll-lock';
import {OPERATIONS_EN_COPY} from '../../i18n/operations-copy';
import {useUiCopy} from '../../i18n/use-ui-copy';

export const OUTBOUND_DETAIL_COPY={...OPERATIONS_EN_COPY,'Chi tiết phiếu xuất kho':'Outbound slip details','Đóng chi tiết phiếu xuất kho':'Close outbound slip details','Mở/Xem phiếu ở chế độ chỉ đọc.':'Open/View slips in read-only mode.','Mở {code} ở chế độ chỉ đọc':'Open {code} in read-only mode','Quét và đối chiếu tiếp tục trên Scanner App.':'Scanning and reconciliation continue in the Scanner App.','Thông tin phiếu hiện không còn trong danh sách đã tải. Vui lòng tải lại danh sách.':'This slip is no longer in the loaded list. Reload the list.','Chi tiết dòng hàng và liên kết chưa có dữ liệu.':'Line item details and related links have not been supplied.','Xem {code}':'View {code}'};
const fields=[['issueCode','Phiếu xuất'],['requestCode','Mã toa yêu cầu'],['recipient','Người nhận'],['createdAt','Ngày tạo'],['note','Ghi chú'],['reconciliation','Đối chiếu'],['status','Trạng thái']] as const;

/** W4-05A: only the selected accepted row. No line/quantity inference or joins. */
export function OutboundSlipDetailDialog({row,issueCode,onClose}:{row:OutboundSlipRow|null;issueCode:string;onClose:()=>void}){
  const tx=useUiCopy(OUTBOUND_DETAIL_COPY),dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null),backdrop=useRef(false);
  const releaseResources=useRef<()=>void>(()=>{});
  useEffect(()=>{dialog.current?.showModal();const unlock=acquireBodyScrollLock();const frame=requestAnimationFrame(()=>{if(dialog.current?.open)close.current?.focus({preventScroll:true});});const release=()=>{cancelAnimationFrame(frame);unlock();};releaseResources.current=release;return release;},[]);
  // Native close removes the modal before its queued close event. Release the
  // scroll lock in that same action; unmount and external close remain safe.
  const dismiss=()=>{releaseResources.current();dialog.current?.close();};
  return <dialog ref={dialog} className="hn-shell-dialog s15-detail-dialog" data-issue-code={issueCode} aria-labelledby="s15-detail-title" onClose={()=>{releaseResources.current();onClose();}} onCancel={event=>{event.preventDefault();dismiss();}} onKeyDown={event=>{
    if(event.key!=='Tab')return;const buttons=[...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')],first=buttons[0],last=buttons.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }} onPointerDown={event=>{backdrop.current=event.target===event.currentTarget;}} onPointerCancel={()=>{backdrop.current=false;}} onClick={event=>{if(backdrop.current&&event.target===event.currentTarget)dismiss();backdrop.current=false;}}>
    <header className="s15-detail-dialog__header"><div><p>{tx('Chi tiết phiếu xuất kho')}</p><h2 id="s15-detail-title">{issueCode}</h2></div><button ref={close} type="button" className="hn-button hn-button--ghost" aria-label={tx('Đóng chi tiết phiếu xuất kho')} onClick={dismiss}><Icon name="close" size={18}/></button></header>
    <div className="s15-detail-dialog__body">{row?<><dl>{fields.map(([key,label])=><div key={key} className={key==='note'?'s15-detail-dialog__wide':undefined}><dt>{tx(label)}</dt><dd data-field={key}>{key==='status'?<StatusBadge tone={row.status==='Đã xuất'?'success':row.status==='Đang quét xuất hàng'?'warning':'neutral'}>{tx(row.status)}</StatusBadge>:row[key]}</dd></div>)}</dl>{row.status==='Đang quét xuất hàng'&&<p>{tx('Quét và đối chiếu tiếp tục trên Scanner App.')}</p>}<p className="s15-detail-dialog__limit">{tx('Chi tiết dòng hàng và liên kết chưa có dữ liệu.')}</p></>:<p role="alert" data-detail-unavailable="true">{tx('Thông tin phiếu hiện không còn trong danh sách đã tải. Vui lòng tải lại danh sách.')}</p>}</div>
    <footer><button type="button" className="hn-button hn-button--secondary" onClick={dismiss}>{tx('Đóng')}</button></footer>
  </dialog>;
}
