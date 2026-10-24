import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { CATALOGUE_EN_COPY } from '../../i18n/catalogue-copy';
import { assertRecipientUpdateContext, assertRecipientUpdateReceipt, createRecipientUpdateRequest, type RecipientContactDraft, type RecipientContactErrors, type RecipientUpdateAdapter, type RecipientUpdateContext, type RecipientUpdateRequest } from './recipient-update-command';

const COPY={...CATALOGUE_EN_COPY,'Sửa thông tin nơi nhận':'Edit recipient information','Đóng sửa nơi nhận':'Close recipient editor','Đang đọc thông tin…':'Loading recipient information…','Tên nơi nhận':'Recipient name','Người liên hệ':'Contact person','Điện thoại':'Phone','Mã nơi nhận':'Recipient code','Lưu':'Save','Hủy':'Cancel','Đang lưu…':'Saving…','Thử lại cùng thao tác':'Retry same operation','Đọc lại bản mới nhất':'Reload latest record','Không có thay đổi để lưu.':'There are no changes to save.','Không thể đọc quyền hoặc thông tin hiện tại. Vui lòng thử lại.':'Unable to read current permissions or record. Please try again.','Thông tin đã thay đổi. Đọc lại bản mới nhất sẽ thay nội dung đang nhập.':'The record has changed. Reloading the latest record will replace your draft.','Quyền sửa không khả dụng cho bản ghi này.':'Editing is unavailable for this record.','Chưa xác nhận được kết quả. Thử lại cùng thao tác để tránh ghi trùng.':'The result is unconfirmed. Retry the same operation to avoid duplicate writes.','Kiểm tra lại các trường được đánh dấu.':'Check the marked fields.','Tên nơi nhận cần 1–120 ký tự, không chứa ký tự điều khiển.':'Recipient name requires 1–120 characters without control characters.','Người liên hệ tối đa 100 ký tự, không chứa ký tự điều khiển.':'Contact person allows up to 100 characters without control characters.','Điện thoại tối đa 32 ký tự và có 6–15 chữ số; chỉ dùng số, khoảng trắng, +, -, (, ).':'Phone allows up to 32 characters and 6–15 digits; use digits, spaces, +, -, (, ).','Giá trị phải là chuỗi.':'Value must be text.','Chỉ sửa tên, người liên hệ và điện thoại. Các thông tin còn lại được giữ nguyên.':'Only name, contact person and phone are editable. Other information remains unchanged.','Chưa cập nhật được danh sách. Dữ liệu đã lưu; hãy làm mới danh sách.':'The record was saved, but the list could not refresh. Refresh the list.','Thông tin đã lưu.':'Information saved.','Thử lại':'Retry'};
type ErrorLike={code?:string;status?:number;outcomeUnknown?:boolean;details?:{fieldErrors?:RecipientContactErrors}};
const draftFrom=(context:RecipientUpdateContext):RecipientContactDraft=>({name:context.row.name,contact:context.row.contact,phone:context.row.phone});

export function RecipientUpdateDialog({rowKey,adapter,onClose,onSaved}:{rowKey:string;adapter:RecipientUpdateAdapter;onClose:()=>void;onSaved:()=>Promise<void>}) {
  const tx=useUiCopy(COPY);
  const dialog=useRef<HTMLDialogElement>(null), nameInput=useRef<HTMLInputElement>(null);
  const [context,setContext]=useState<RecipientUpdateContext|null>(null);
  const [draft,setDraft]=useState<RecipientContactDraft>({name:'',contact:'',phone:''});
  const [errors,setErrors]=useState<RecipientContactErrors>({});
  const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[conflict,setConflict]=useState(false),[uncertain,setUncertain]=useState(false),[committed,setCommitted]=useState(false);
  const request=useRef<RecipientUpdateRequest|null>(null), generation=useRef(0), busy=useRef(false), mounted=useRef(true);
  async function readCurrent() {
    // A second pointer click can reach Retry after Save commits but before its
    // refresh/acknowledgement finishes. Never invalidate that active generation.
    if(busy.current)return;
    const token=++generation.current; setLoading(true);setMessage('');setErrors({});
    try {
      if(!adapter.available)throw {code:'MOCK_COMMAND_FORBIDDEN'};
      const next=await adapter.readContext(rowKey);assertRecipientUpdateContext(next,rowKey);
      const restored=await adapter.recovery?.restore(rowKey);
      if(!mounted.current||token!==generation.current)return;
      if(restored?.kind==='blocked')throw {code:restored.code,outcomeUnknown:true};
      setContext(next);setDraft(draftFrom(next));setConflict(false);setUncertain(false);setCommitted(false);request.current=null;
      if(restored?.kind==='pending') {
        if(restored.request.entityId!==next.entityId)throw {code:'RECOVERY_STATE_INVALID',outcomeUnknown:true};
        request.current=restored.request;
        setDraft({...draftFrom(next),...restored.request.payload});setUncertain(true);
        setMessage('Chưa xác nhận được kết quả. Thử lại cùng thao tác để tránh ghi trùng.');
      } else if(restored?.kind==='committed') {
        assertRecipientUpdateReceipt(restored.outcome.receipt,restored.request);
        setCommitted(true);
        try {
          await adapter.invalidate();if(!mounted.current||token!==generation.current)return;
          await onSaved();if(!mounted.current||token!==generation.current)return;
          await adapter.recovery?.acknowledge(rowKey,restored.request.commandId);if(mounted.current&&token===generation.current)onClose();
        }
        catch {if(mounted.current&&token===generation.current)setMessage('Chưa cập nhật được danh sách. Dữ liệu đã lưu; hãy làm mới danh sách.');}
        return;
      }
      requestAnimationFrame(()=>nameInput.current?.focus({preventScroll:true}));
    } catch(error) {
      if(!mounted.current||token!==generation.current)return;
      setContext(null);setMessage((error as ErrorLike)?.code==='MOCK_COMMAND_FORBIDDEN'?'Quyền sửa không khả dụng cho bản ghi này.':'Không thể đọc quyền hoặc thông tin hiện tại. Vui lòng thử lại.');
    } finally {if(mounted.current&&token===generation.current)setLoading(false);}
  }
  useEffect(()=>{
    mounted.current=true;busy.current=false;setSaving(false);dialog.current?.showModal();const unlock=acquireBodyScrollLock();void readCurrent();
    return()=>{mounted.current=false;++generation.current;unlock();};
  },[rowKey,adapter]);
  function close(){if(!busy.current&&!uncertain)onClose();}
  async function save() {
    if(!context||busy.current||conflict||committed)return;
    setErrors({});setMessage('');
    try {
      request.current??=createRecipientUpdateRequest(context,draft);
      if(!request.current){setMessage('Không có thay đổi để lưu.');return;}
    }catch(error){setErrors((error as ErrorLike).details?.fieldErrors??{});setMessage('Kiểm tra lại các trường được đánh dấu.');return;}
    const token=generation.current;
    busy.current=true;setSaving(true);
    try {
      const sent=request.current;
      const outcome=await adapter.execute(sent);
      const receipt=outcome.receipt;
      assertRecipientUpdateReceipt(receipt,sent);
      if(!mounted.current||token!==generation.current)return;
      request.current=null;setUncertain(false);setCommitted(true);
      try {
        await adapter.invalidate();if(!mounted.current||token!==generation.current)return;
        await onSaved();if(!mounted.current||token!==generation.current)return;
        await adapter.recovery?.acknowledge(rowKey,sent.commandId);if(mounted.current&&token===generation.current)onClose();
      }
      catch {if(mounted.current&&token===generation.current)setMessage('Chưa cập nhật được danh sách. Dữ liệu đã lưu; hãy làm mới danh sách.');}
    }catch(error){
      if(!mounted.current||token!==generation.current)return;
      const failure=error as ErrorLike;
      let unresolved=failure.outcomeUnknown===true;
      if(unresolved&&adapter.recovery&&(failure.code==='STALE_VERSION'||failure.code==='STALE_DEMO_EPOCH')) {
        // A reset before first dispatch can fail before any durable intent exists.
        // Only a verified empty journal permits replacing that obsolete local draft.
        try {const journal=await adapter.recovery.restore(rowKey);if(journal.kind==='empty')unresolved=false;} catch { /* Preserve unresolved intent. */ }
        if(!mounted.current||token!==generation.current)return;
      }
      if(!unresolved&&(failure.code==='STALE_VERSION'||failure.code==='STALE_DEMO_EPOCH')) {request.current=null;setUncertain(false);setConflict(true);setMessage('Thông tin đã thay đổi. Đọc lại bản mới nhất sẽ thay nội dung đang nhập.');}
      else if(!failure.outcomeUnknown&&failure.status===422&&failure.code!=='INVALID_RECEIPT') {request.current=null;setUncertain(false);setErrors(failure.details?.fieldErrors??{});setMessage('Kiểm tra lại các trường được đánh dấu.');}
      else if(!failure.outcomeUnknown&&(failure.status===403||failure.status===401||failure.code==='MOCK_COMMAND_FORBIDDEN')) {request.current=null;setUncertain(false);setContext(null);setMessage('Quyền sửa không khả dụng cho bản ghi này.');}
      else {setUncertain(true);setMessage('Chưa xác nhận được kết quả. Thử lại cùng thao tác để tránh ghi trùng.');}
    } finally {if(token===generation.current){busy.current=false;if(mounted.current)setSaving(false);}}
  }
  const locked=saving||uncertain||conflict||committed;
  return <dialog ref={dialog} className="hn-shell-dialog recipient-detail-dialog recipient-update-dialog" aria-labelledby="recipient-update-title" onCancel={event=>{event.preventDefault();close();}} onKeyDown={event=>{
    if(event.key!=='Tab')return;
    const controls=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled])')];const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }}>
    <form className="recipient-detail-dialog__panel" onSubmit={event=>{event.preventDefault();void save();}} noValidate>
      <header className="recipient-detail-dialog__header"><div><h2 id="recipient-update-title">{tx('Sửa thông tin nơi nhận')}</h2><p className="recipient-detail-dialog__code">{tx('Mã nơi nhận')}: <strong>{context?.row.code??rowKey}</strong></p></div><button type="button" className="hn-button hn-button--ghost recipient-detail-dialog__close" disabled={saving||uncertain} aria-label={tx('Đóng sửa nơi nhận')} onClick={close}><Icon name="close" width={18} height={18}/></button></header>
      <div className="recipient-detail-dialog__body">
        {loading?<p role="status">{tx('Đang đọc thông tin…')}</p>:context&&<>
          <p className="recipient-update-hint">{tx('Chỉ sửa tên, người liên hệ và điện thoại. Các thông tin còn lại được giữ nguyên.')}</p>
          {(['name','contact','phone'] as const).map((field,index)=><div className="recipient-update-field" key={field}><label htmlFor={`recipient-update-${field}`}>{tx(['Tên nơi nhận','Người liên hệ','Điện thoại'][index])}{field==='name'?' *':''}</label><input ref={field==='name'?nameInput:undefined} id={`recipient-update-${field}`} value={draft[field]} required={field==='name'} type={field==='phone'?'tel':'text'} autoComplete="off" disabled={locked} aria-invalid={!!errors[field]} aria-describedby={errors[field]?`recipient-update-${field}-error`:undefined} onChange={event=>setDraft(value=>({...value,[field]:event.target.value}))}/>{errors[field]&&<p className="recipient-update-error" id={`recipient-update-${field}-error`}>{tx(errors[field])}</p>}</div>)}
        </>}
        {message&&<p className="recipient-update-message" role="alert">{tx(message)}</p>}
      </div>
      <footer className="recipient-detail-dialog__footer recipient-update-footer">
        <button type="button" className="hn-button hn-button--secondary" disabled={saving||uncertain} onClick={close}>{tx(committed?'Đóng':'Hủy')}</button>
        {!loading&&!context&&<button type="button" className="hn-button hn-button--secondary" disabled={saving} onClick={()=>void readCurrent()}>{tx('Thử lại')}</button>}
        {committed&&<button type="button" className="hn-button hn-button--secondary" disabled={loading||saving} onClick={()=>void readCurrent()}>{tx('Thử lại')}</button>}
        {conflict&&<button type="button" className="hn-button hn-button--secondary" onClick={()=>void readCurrent()}>{tx('Đọc lại bản mới nhất')}</button>}
        {context&&!committed&&!conflict&&<button type="submit" className="hn-button hn-button--primary" disabled={loading||saving}>{tx(saving?'Đang lưu…':uncertain?'Thử lại cùng thao tác':'Lưu')}</button>}
      </footer>
    </form>
  </dialog>;
}
