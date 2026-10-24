import { useEffect, useRef, useState } from 'react';
import type { CatalogCreateAdapter, CatalogCreateOutcome, CatalogCreateRequest, CatalogSnapshot } from '../../contracts/catalog-create';
import type { CommandRecoveryResult } from '../../data/command-recovery';
import { BasicSelect, Button } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { SkuCatalogDialog } from './SkuCatalogDialog';
import { SKU_CATALOG_COPY } from './sku-catalog-copy';
import { assertSkuAccepted, emptySkuDraft, isSkuCatalogScopeBusy, skuCreatePayload, type SkuCatalogDraft } from './sku-catalog';

type Recovery = CommandRecoveryResult<CatalogCreateRequest<'sku'>, CatalogCreateOutcome>;
type Failure = { code?: string; status?: number | null; outcomeUnknown?: boolean; details?: { field?: string } };
const pendingMessage = 'Chưa xác nhận được kết quả. Kiểm tra lại cùng thao tác để tránh tạo trùng.';

export function SkuCreateDialog({ adapter, origin, onClose, onAccepted, onUnavailable }: {
  adapter: CatalogCreateAdapter<'sku'>; origin: HTMLElement | null; onClose: () => void;
  onAccepted: (snapshot: CatalogSnapshot, id: string) => void; onUnavailable: () => void;
}) {
  const tx = useUiCopy(SKU_CATALOG_COPY);
  const [snapshot, setSnapshot] = useState<CatalogSnapshot | null>(null);
  const [draft, setDraft] = useState<SkuCatalogDraft>(emptySkuDraft);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [recovery, setRecovery] = useState(false), [needsReload, setNeedsReload] = useState(false);
  const [message, setMessage] = useState(''), [field, setField] = useState(''), [duplicate, setDuplicate] = useState(false);
  const mounted = useRef(false), busy = useRef(false), generation = useRef(0);
  const initialRead = useRef<(() => Promise<void>) | null>(null);
  const current = (token: number) => mounted.current && generation.current === token;

  function restoreDraft(result: Recovery) {
    if (result.kind === 'pending' || result.kind === 'committed') {
      setDraft({ ...result.request.payload, barcode: result.request.payload.barcode ?? '' });
    }
  }
  async function accept(request: CatalogCreateRequest<'sku'>, outcome: CatalogCreateOutcome, token: number) {
    const accepted = await adapter.readSnapshot();
    assertSkuAccepted(accepted, request, outcome);
    if (!current(token)) return;
    await adapter.recovery.acknowledge(request.commandId);
    if (!current(token)) return;
    onAccepted(accepted, outcome.receipt.entityId);
  }
  async function readCurrent() {
    if (busy.current) return;
    busy.current = true;
    const token = ++generation.current;
    setLoading(true); setMessage(''); setField('');
    try {
      if (!adapter.available) throw { code: 'COMMAND_UNAVAILABLE', status: 403 };
      const restored = await adapter.recovery.restore();
      if (!current(token)) return;
      restoreDraft(restored);
      setRecovery(restored.kind !== 'empty');
      if (restored.kind === 'blocked') throw { code: restored.code, outcomeUnknown: true };
      if (restored.kind === 'committed') {
        await accept(restored.request, restored.outcome, token); return;
      }
      const next = await adapter.readSnapshot();
      if (!current(token)) return;
      setSnapshot(next); setNeedsReload(false);
      if (restored.kind === 'pending') setMessage(pendingMessage);
      else { setRecovery(false); }
    } catch (error) {
      if (!current(token)) return;
      setSnapshot(null); onUnavailable();
      const failure = error as Failure;
      if (failure.outcomeUnknown) setRecovery(true);
      setMessage(failure.outcomeUnknown ? pendingMessage : failure.status === 403 || failure.status === 401
        ? 'Quyền tạo SKU hiện không khả dụng.' : 'Chưa thể đọc dữ liệu. Vui lòng thử lại.');
    } finally {
      if (current(token)) { busy.current = false; setLoading(false); }
    }
  }
  useEffect(() => {
    if (!field || loading || saving) return;
    const control = document.getElementById('sku-create-' + (field === 'observedProductVersion' ? 'productId' : field));
    control?.focus({ preventScroll: true });
    control?.scrollIntoView({ block: 'nearest' });
  }, [field, loading, saving]);
  useEffect(() => {
    if (loading) return;
    const input = document.querySelector<HTMLInputElement>('#sku-create-code:not(:disabled)');
    input?.focus({ preventScroll: true });
  }, [loading]);
  initialRead.current = readCurrent;
  useEffect(() => {
    mounted.current = true; busy.current = false;
    void initialRead.current?.();
    return () => { mounted.current = false; ++generation.current; };
  }, [adapter]);

  async function reconcile() {
    if (busy.current) return;
    busy.current = true; setSaving(true); setMessage('');
    const token = ++generation.current;
    try {
      let result = await adapter.recovery.restore();
      if (!current(token)) return;
      restoreDraft(result);
      if (result.kind === 'pending') result = await adapter.recovery.retry();
      if (!current(token)) return;
      restoreDraft(result);
      if (result.kind === 'committed') await accept(result.request, result.outcome, token);
      else if (result.kind === 'empty') {
        setRecovery(false);
        const next = await adapter.readSnapshot();
        if (!current(token)) return;
        setSnapshot(next); setNeedsReload(false);
      } else { setRecovery(true); setMessage(pendingMessage); }
    } catch {
      if (current(token)) { setRecovery(true); setSnapshot(null); onUnavailable(); setMessage(pendingMessage); }
    } finally { if (current(token)) { busy.current = false; setSaving(false); } }
  }
  async function save() {
    if (busy.current || !snapshot || recovery || needsReload) return;
    let request: CatalogCreateRequest<'sku'>;
    try {
      const payload = skuCreatePayload(draft, snapshot.products);
      request = { commandId: crypto.randomUUID(), epoch: snapshot.epoch, command: 'skus.create', payload };
    } catch (error) {
      setField((error as Failure).details?.field ?? ''); setDuplicate(false);
      setMessage('Kiểm tra lại các trường được đánh dấu.'); return;
    }
    busy.current = true; setSaving(true); setMessage(''); setField('');
    const token = ++generation.current;
    try {
      const outcome = await adapter.execute(request);
      if (!current(token)) return;
      setRecovery(true);
      await accept(request, outcome, token);
    } catch (error) {
      if (!current(token)) return;
      const failure = error as Failure;
      if (isSkuCatalogScopeBusy(failure)) {
        // This request never dispatched. The journal belongs to another operation;
        // keep this form's input and context instead of adopting that operation.
        setRecovery(false);
        setMessage('Một thao tác khác đang chờ xác nhận. Nội dung đang nhập được giữ lại; hãy thử lại sau.');
        return;
      }
      // Only the durable journal can prove there is no pending command to replace.
      let restored: Recovery;
      try { restored = await adapter.recovery.restore(); }
      catch { restored = { kind: 'blocked', code: 'RECOVERY_UNAVAILABLE' }; }
      if (!current(token)) return;
      restoreDraft(restored);
      const unresolved = restored.kind !== 'empty';
      setRecovery(unresolved);
      if (unresolved) { setMessage(pendingMessage); setSnapshot(null); onUnavailable(); }
      else {
        setField(failure.details?.field ?? ''); setDuplicate(failure.code === 'DUPLICATE_VALUE');
        if (failure.status === 401 || failure.status === 403) {
          setSnapshot(null); onUnavailable(); setMessage('Quyền tạo SKU hiện không khả dụng.');
        } else if (['STALE_VERSION', 'STALE_PRODUCT_VERSION', 'STALE_DEMO_EPOCH', 'PRODUCT_UNAVAILABLE'].includes(failure.code ?? '')) {
          setNeedsReload(true); setMessage('Sản phẩm hoặc phiên làm việc đã thay đổi. Đọc lại dữ liệu trước khi lưu.');
        } else setMessage(failure.details?.field ? 'Kiểm tra lại các trường được đánh dấu.' : 'Không thể lưu. Dữ liệu nhập được giữ lại.');
      }
    } finally { if (current(token)) { busy.current = false; setSaving(false); } }
  }
  function close() {
    if (busy.current) return;
    onClose();
  }
  function change(key: keyof SkuCatalogDraft, value: string) {
    setDraft(previous => ({ ...previous, [key]: value })); setField(''); setMessage('');
  }
  const locked = loading || saving || recovery || needsReload || !snapshot;
  const products = snapshot?.products.filter(product => product.status === 'active') ?? [];
  const selected = snapshot?.products.find(product => product.id === draft.productId);
  const hint = (key: string) => duplicate ? 'Giá trị này đã tồn tại.' : key === 'code'
    ? 'Mã gồm 1–40 chữ cái ASCII, chữ số hoặc dấu gạch ngang; bắt đầu bằng chữ hoặc số.'
    : key === 'barcode' ? 'Mã vạch tối đa 64 ký tự ASCII hiển thị, không có khoảng trắng.' : 'Bắt buộc chọn một giá trị.';
  const error = (key: string) => field === key && <p className="sku-create-error" id={`sku-create-${key}-error`}>{tx(hint(key))}</p>;
  return <SkuCatalogDialog title="Thêm SKU" origin={origin} busy={saving || loading} onClose={close} footer={<>
    <Button variant="secondary" disabled={saving || loading} onClick={close}>{tx(recovery ? 'Đóng' : 'Hủy')}</Button>
    {recovery ? <Button disabled={saving || loading} onClick={() => void reconcile()}>{tx(saving ? 'Đang lưu…' : 'Kiểm tra lại thao tác')}</Button>
      : needsReload || !snapshot ? <Button disabled={saving || loading} onClick={() => void readCurrent()}>{tx('Đọc lại dữ liệu')}</Button>
      : <Button type="submit" form="sku-create-form" disabled={locked || !products.length}>{tx(saving ? 'Đang lưu…' : 'Lưu')}</Button>}
  </>}>
    {loading && <p role="status">{tx('Đang đọc dữ liệu…')}</p>}
    <form id="sku-create-form" className="sku-create-form" noValidate onSubmit={event => { event.preventDefault(); void save(); }}>
      <label htmlFor="sku-create-code">{tx('Mã SKU')} *<input id="sku-create-code" value={draft.code} disabled={locked} autoComplete="off" aria-invalid={field === 'code'} aria-describedby={field === 'code' ? 'sku-create-code-error' : undefined} onChange={event => change('code', event.target.value)} />{error('code')}</label>
      <label htmlFor="sku-create-productId">{tx('Sản phẩm')} *<BasicSelect id="sku-create-productId" value={draft.productId} disabled={locked} aria-invalid={field === 'productId' || field === 'observedProductVersion'} aria-describedby={field === 'productId' || field === 'observedProductVersion' ? 'sku-create-' + field + '-error' : undefined} onChange={event => change('productId', event.target.value)}><option value="">{tx('Chọn sản phẩm')}</option>{draft.productId && !products.some(product => product.id === draft.productId) && <option value={draft.productId} disabled>{draft.productId}</option>}{products.map(product => <option key={product.id} value={product.id}>{product.code} · {product.name}</option>)}</BasicSelect>{error('productId')}{error('observedProductVersion')}</label>
      {snapshot && !products.length && <p className="sku-create-guide">{tx('Chưa có sản phẩm mới đang hoạt động. Tạo sản phẩm trước khi thêm SKU.')} <a href="#/preview/S03">{tx('Mở danh mục sản phẩm')}</a></p>}
      <div className="sku-create-derived"><p>{tx('Thông tin lấy từ sản phẩm đã chọn.')}</p><dl className="sku-detail__fields">{(['name', 'group', 'unit'] as const).map((key, index) => <div key={key}><dt>{tx(['Tên sản phẩm', 'Nhóm hàng', 'Đơn vị tính'][index])}</dt><dd data-derived-field={key}>{selected?.[key] ?? '—'}</dd></div>)}</dl></div>
      <label htmlFor="sku-create-barcode">{tx('Mã vạch (không bắt buộc)')}<input id="sku-create-barcode" value={draft.barcode} disabled={locked} autoComplete="off" aria-invalid={field === 'barcode'} aria-describedby={field === 'barcode' ? 'sku-create-barcode-error' : undefined} onChange={event => change('barcode', event.target.value)} />{error('barcode')}</label>
      <label htmlFor="sku-create-status">{tx('Trạng thái')} *<BasicSelect id="sku-create-status" value={draft.status} disabled={locked} aria-invalid={field === 'status'} aria-describedby={field === 'status' ? 'sku-create-status-error' : undefined} onChange={event => change('status', event.target.value)}><option value="">{tx('Chọn trạng thái')}</option><option value="active">{tx('Đang hoạt động')}</option><option value="inactive">{tx('Ngừng sử dụng')}</option></BasicSelect>{error('status')}</label>
    </form>
    {message && <p className="sku-create-message" role="alert">{tx(message)}</p>}
  </SkuCatalogDialog>;
}
