import { useEffect, useId, useRef, useState } from 'react';
import type { PvDemoSnapshot, PvProfile } from '../../contracts/pv-demo';
import { BasicSelect, Button, ConfirmDialog, Feedback, FormField, GlobalModal, Icon } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { emptyPvDemoDraft, isPvDemoDraftDirty, selectPvDemoSku, type PvDemoDraft } from './PvDemoDraft';
import { pvAssetPath, pvCreateChoices, pvDraftErrors, pvHasEditableChange, pvMasters, pvProfileDraft } from './pv-demo-model';
import { PV_DEMO_COPY } from './pv-demo-copy';
import './pv-demo-form.css';

export interface PvFormIssue { message: string; field?: keyof PvDemoDraft; conflict?: boolean }
export function PvDemoForm({ snapshot, profile, busy, locked, uncertain, issue, saved, onSave, onRecover, onReload, onClosed }: {
  snapshot: PvDemoSnapshot; profile?: PvProfile; busy: boolean; locked: boolean; uncertain: boolean; issue: PvFormIssue | null;
  saved: boolean; onSave: (draft: PvDemoDraft) => void; onRecover: () => void; onReload: () => void; onClosed: () => void;
}) {
  const tx = useUiCopy(PV_DEMO_COPY), id = useId(), nameRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null), closedCallback = useRef(onClosed);
  closedCallback.current = onClosed;
  const [initial] = useState<PvDemoDraft>(() => profile ? pvProfileDraft(profile) : emptyPvDemoDraft());
  const [draft, setDraft] = useState(initial), [open, setOpen] = useState(true);
  const [confirmation, setConfirmation] = useState<'close' | 'reload' | null>(null);
  const [touched, setTouched] = useState(false);
  const closing = useRef(false);
  useEffect(() => { if (saved) { closing.current = true; setConfirmation(null); setOpen(false); } }, [saved]);
  useEffect(() => {
    const dialog = dialogRef.current;
    const closed = () => { if (closing.current) queueMicrotask(() => closedCallback.current()); };
    dialog?.addEventListener('close', closed);
    return () => dialog?.removeEventListener('close', closed);
  }, []);
  useEffect(() => {
    if (issue?.field) dialogRef.current?.querySelector<HTMLElement>(`[name="${issue.field}"]`)?.focus();
  }, [issue]);
  const dirty = isPvDemoDraftDirty(initial, draft), selected = pvMasters(snapshot, draft.skuId);
  const choices = profile ? snapshot.skus.filter(sku => sku.id === profile.skuId) : pvCreateChoices(snapshot);
  const errors = pvDraftErrors(snapshot, draft, profile);
  const disabled = busy || locked;
  const canSave = !disabled && !issue?.conflict && !Object.keys(errors).length && (!profile || pvHasEditableChange(profile, draft));
  const imagePath = pvAssetPath(snapshot, draft.imageAssetId);
  const errorText = (field: keyof PvDemoDraft) => {
    if (issue?.field === field) return tx(issue.message);
    if (!touched) return undefined;
    const error = errors[field];
    if (!error) return undefined;
    return tx(error === 'control-character' ? 'Tên hiển thị không được chứa ký tự điều khiển hoặc xuống dòng.' :
      error === 'too-long' ? 'Tên hiển thị không quá 120 ký tự Unicode.' :
        error === 'DUPLICATE_VALUE' ? 'SKU đã có hồ sơ PV.' : field === 'skuId' ? 'Chọn SKU khả dụng.' :
          field === 'imageAssetId' ? 'Ảnh không khả dụng.' : field === 'visibility' ? 'Chọn trạng thái hiển thị.' : 'Nhập tên hiển thị PV.');
  };
  function close() { closing.current = true; setConfirmation(null); setOpen(false); }
  function requestClose() { if (disabled) return; if (dirty) setConfirmation('close'); else close(); }
  function reload() { if (disabled) return; if (dirty) setConfirmation('reload'); else onReload(); }
  function submit() {
    setTouched(true);
    if (!canSave) {
      const field = Object.keys(errors)[0];
      if (field) dialogRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
      return;
    }
    onSave({ ...draft });
  }
  return <>
    <GlobalModal open={open} size="large" className="pv-demo-form" initialFocusRef={nameRef} dialogRef={dialogRef}
      title={tx(profile ? 'Chỉnh sửa hồ sơ PV Demo' : 'Thêm hồ sơ PV Demo')} closeLabel={tx('Đóng')} onClose={requestClose}
      footer={<><Button variant="secondary" onClick={requestClose} disabled={disabled}>{tx('Hủy')}</Button>
        {uncertain ? <Button onClick={onRecover} disabled={busy}>{tx('Kiểm tra lại')}</Button> :
          <Button type="submit" form={id} disabled={!canSave} loading={busy}>{tx(busy ? 'Đang lưu…' : profile ? 'Lưu thay đổi' : 'Lưu sản phẩm')}</Button>}</>}>
      <form id={id} noValidate onSubmit={event => { event.preventDefault(); submit(); }} aria-busy={busy}>
        {issue && <Feedback title={tx(issue.message)} tone="error" live />}
        {uncertain && <Feedback title={tx('Đang kiểm tra kết quả lưu.')} live />}
        {touched && Object.keys(errors).length > 0 && <Feedback title={tx('Kiểm tra các trường được đánh dấu.')} tone="error" live />}
        {issue?.conflict && <Button variant="secondary" onClick={reload} disabled={disabled}>{tx('Tải dữ liệu mới nhất')}</Button>}
        {profile && <dl className="pv-demo-form__context"><div><dt>{tx('Hồ sơ')}</dt><dd>{profile.id}</dd></div><div><dt>{tx('Phiên bản')}</dt><dd>{profile.version}</dd></div></dl>}
        <FormField label="SKU" required error={errorText('skuId')}>
          <BasicSelect name="skuId" value={draft.skuId} disabled={!!profile || !choices.length || disabled}
            onChange={event => {
              const master = pvMasters(snapshot, event.target.value);
              if (master) setDraft(current => selectPvDemoSku(current, master.sku.id, master.product.name));
            }}>
            <option value="" disabled>{tx(choices.length ? 'Chọn SKU' : 'Chưa có SKU khả dụng.')}</option>
            {choices.map(sku => <option key={sku.id} value={sku.id}>{sku.code} / {pvMasters(snapshot, sku.id)?.product.name}</option>)}
          </BasicSelect>
        </FormField>
        {selected && <dl className="pv-demo-form__context">
          <div><dt>{tx('Mã sản phẩm')}</dt><dd>{selected.product.code}</dd></div><div><dt>SKU</dt><dd>{selected.sku.code}</dd></div>
          <div><dt>{tx('Tên sản phẩm')}</dt><dd>{selected.product.name}</dd></div>
          <div><dt>{tx('Nhóm sản phẩm')}</dt><dd>{selected.product.group}</dd></div><div><dt>{tx('Đơn vị tính')}</dt><dd>{selected.product.unit}</dd></div>
        </dl>}
        <FormField label={tx('Tên hiển thị PV')} required error={errorText('displayName')}>
          <input ref={nameRef} name="displayName" value={draft.displayName} autoComplete="off" disabled={disabled}
            onChange={event => setDraft(current => ({ ...current, displayName: event.target.value }))} onBlur={() => setTouched(true)} />
        </FormField>
        <FormField label={tx('Trạng thái hiển thị')} required error={errorText('visibility')}>
          <BasicSelect name="visibility" value={draft.visibility} disabled={disabled} onBlur={() => setTouched(true)}
            onChange={event => { const value = event.target.value; if (value === 'hidden' || value === 'visible') setDraft(current => ({ ...current, visibility: value })); }}>
            <option value="" disabled>{tx('Chọn trạng thái')}</option><option value="hidden">{tx('Đang ẩn')}</option><option value="visible">{tx('Đang hiển thị')}</option>
          </BasicSelect>
        </FormField>
        <FormField label={tx('Ảnh sản phẩm')} error={errorText('imageAssetId')}>
          <BasicSelect name="imageAssetId" value={draft.imageAssetId ?? ''} disabled={disabled || !snapshot.assets.length}
            onChange={event => setDraft(current => ({ ...current, imageAssetId: event.target.value || null }))}>
            <option value="">{tx('Không có ảnh')}</option>{snapshot.assets.map(asset => <option key={asset.assetId} value={asset.assetId}>{asset.assetId}</option>)}
          </BasicSelect>
        </FormField>
        <div className="pv-demo-form__image">{imagePath ? <img src={imagePath} alt={draft.displayName} /> : <Icon name="image" aria-hidden="true" />}
          {draft.imageAssetId !== null && <Button variant="secondary" onClick={() => setDraft(current => ({ ...current, imageAssetId: null }))} disabled={disabled}>{tx('Tháo ảnh')}</Button>}
        </div>
      </form>
    </GlobalModal>
    <ConfirmDialog open={confirmation !== null} title={tx('Bỏ thay đổi chưa lưu?')} description={tx('Các thay đổi hiện tại sẽ không được lưu.')}
      cancelLabel={tx('Tiếp tục chỉnh sửa')} confirmLabel={tx('Bỏ thay đổi')} onCancel={() => setConfirmation(null)}
      onConfirm={() => { if (confirmation === 'reload') { setConfirmation(null); onReload(); } else close(); }} />
  </>;
}
