import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogCreateAdapter, CatalogSnapshot } from '../../contracts/catalog-create';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { Button } from '../../shared';
import { OperationalProfileForm } from './OperationalProfileForm';
import { createProfileBinding, isProfileCommand, profileEligibility, profileReadPending } from './operational-profile-binding';
import type { OperationalProfileDraft, OperationalProfileValidationError } from './operational-profile-form';
import type { SkuFeedback } from './SkuNotice';

const COPY = {
  'Cấu hình theo dõi SKU': 'SKU tracking profile',
  'Đang đọc cấu hình…': 'Loading tracking profile…',
  'Đọc lại dữ liệu': 'Reload data',
  'Chưa có phiên nghiệp vụ. Thiết lập phiên tại QA / Build Metadata trước khi tạo cấu hình.': 'No business scenario is active. Set up the scenario in QA / Build Metadata before creating a profile.',
  'SKU này chưa được chọn trong phiên nghiệp vụ hiện tại.': 'This SKU is not selected in the current business scenario.',
  'SKU hoặc sản phẩm liên kết hiện không hoạt động.': 'The SKU or its linked product is not active.',
  'Chưa đọc được cấu hình. Đọc lại dữ liệu để tiếp tục.': 'The tracking profile could not be read. Reload the data to continue.',
  'Cấu hình đã tạo · Chỉ xem': 'Created profile · Read only',
  'Sản phẩm theo serial': 'Product by serial', 'Linh kiện theo BOX': 'Component by BOX',
  'Cách theo dõi': 'Tracking method', 'Đơn vị tính': 'Unit',
  'Một thao tác đang chờ xác nhận. Kiểm tra lại cùng thao tác trước khi tạo cấu hình khác.': 'An operation is awaiting confirmation. Check the same operation before creating another profile.',
  'Thao tác cần xác nhận thuộc SKU khác. Việc kiểm tra lại sẽ giữ nguyên SKU và nội dung của thao tác đó.': 'The operation awaiting confirmation belongs to another SKU. Checking it again keeps its original SKU and content.',
  'Kiểm tra lại thao tác': 'Check operation again',
  'Đã xác minh cấu hình theo dõi SKU.': 'The SKU tracking profile has been verified.',
  'Đã xác minh thao tác trong phiên đã lưu trữ. Dữ liệu phiên hiện tại không thay đổi.': 'The archived operation has been verified. Current scenario data is unchanged.',
  'Phiên nghiệp vụ đã đổi. Kết quả cũ cần được đối chiếu trong dữ liệu lưu trữ trước khi tiếp tục.': 'The business scenario has changed. The previous result must be checked against the archive before continuing.',
  'Không thể xác minh kết quả. Nội dung đang nhập được giữ lại; hãy đọc lại dữ liệu hoặc kiểm tra thao tác đang chờ.': 'The result could not be verified. Your input is retained; reload the data or check the pending operation.',
  'SKU hoặc sản phẩm đã thay đổi. Đọc lại dữ liệu trước khi gửi lại.': 'The SKU or product has changed. Reload the data before submitting again.',
  'Phiên đăng nhập hoặc quyền thao tác không khả dụng.': 'The session or permission for this action is unavailable.',
};
function message(code: string | null) {
  if (code === 'RECOVERY_ARCHIVED_SCENARIO') return 'Phiên nghiệp vụ đã đổi. Kết quả cũ cần được đối chiếu trong dữ liệu lưu trữ trước khi tiếp tục.';
  if (['STALE_MASTER_VERSION', 'READ_CONTEXT_CHANGED', 'STALE_SCENARIO', 'SKU_CHANGED'].includes(code ?? '')) return 'SKU hoặc sản phẩm đã thay đổi. Đọc lại dữ liệu trước khi gửi lại.';
  if (['SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN', 'COMMAND_UNAVAILABLE', 'CONFIRMATION_REQUIRED', 'RECOVERY_ACTOR_MISMATCH'].includes(code ?? '')) return 'Phiên đăng nhập hoặc quyền thao tác không khả dụng.';
  return 'Không thể xác minh kết quả. Nội dung đang nhập được giữ lại; hãy đọc lại dữ liệu hoặc kiểm tra thao tác đang chờ.';
}

export function OperationalProfilePanel({ skuId, catalogAdapter, onCatalogRead, notify }: {
  skuId: string; catalogAdapter: CatalogCreateAdapter<'sku'>;
  onCatalogRead: (snapshot: CatalogSnapshot) => void;
  notify: (message: string, tone?: SkuFeedback['tone']) => void;
}) {
  const tx = useUiCopy(COPY);
  const adapter = useMemo(() => createOperationalWebAdapter(undefined, { scope: 'S04' }), []);
  const controller = useMemo(() => createProfileBinding(adapter, catalogAdapter, skuId), [adapter, catalogAdapter, skuId]);
  const [state, setState] = useState(controller.getState);
  const [draft, setDraft] = useState<OperationalProfileDraft>({ skuId, tracking: '' });
  const [validationError, setValidationError] = useState<OperationalProfileValidationError | null>(null);
  const callbacks = useRef({ onCatalogRead, notify });
  callbacks.current = { onCatalogRead, notify };
  useEffect(() => {
    const unsubscribe = controller.subscribe(setState);
    void controller.read();
    const refresh = () => { if (document.visibilityState === 'visible') void controller.read(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      unsubscribe(); controller.invalidate();
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [controller]);
  useEffect(() => { if (state.catalog) callbacks.current.onCatalogRead(state.catalog); }, [state.catalog]);
  useEffect(() => {
    if (state.acceptedSkuId) callbacks.current.notify('Đã xác minh cấu hình theo dõi SKU.', 'success');
  }, [state.acceptedSkuId]);
  useEffect(() => {
    if (state.archivedCommandId) callbacks.current.notify('Đã xác minh thao tác trong phiên đã lưu trữ. Dữ liệu phiên hiện tại không thay đổi.', 'info');
  }, [state.archivedCommandId]);
  const { sku, product, profile, reason } = profileEligibility(state, skuId);
  const reading = profileReadPending(state);
  const unresolved = state.recovery.kind !== 'empty';
  const recoveryRequest = state.recovery.kind === 'pending' || state.recovery.kind === 'committed' ? state.recovery.request : null;
  const otherSku = recoveryRequest && isProfileCommand(recoveryRequest) && recoveryRequest.payload.skuId !== skuId;
  const reasonCopy = reason === 'SCENARIO_REQUIRED' ? 'Chưa có phiên nghiệp vụ. Thiết lập phiên tại QA / Build Metadata trước khi tạo cấu hình.'
    : reason === 'SKU_OUTSIDE_SCENARIO' ? 'SKU này chưa được chọn trong phiên nghiệp vụ hiện tại.'
      : reason === 'SKU_UNAVAILABLE' ? 'SKU hoặc sản phẩm liên kết hiện không hoạt động.'
        : 'Chưa đọc được cấu hình. Đọc lại dữ liệu để tiếp tục.';
  return <section aria-label={tx('Cấu hình theo dõi SKU')} data-operational-profile-sku={skuId} aria-busy={reading}>
    <h3>{tx('Cấu hình theo dõi SKU')}</h3>
    {reading && <p role="status">{tx('Đang đọc cấu hình…')}</p>}
    {state.error && <p role="alert">{tx(message(state.error))}</p>}
    {!state.error && state.recovery.kind === 'blocked' && state.recovery.code !== 'READ_REQUIRED' && <p role="alert">{tx(message(state.recovery.code))}</p>}
    {profile ? <><p>{tx('Cấu hình đã tạo · Chỉ xem')}</p><dl className="sku-detail__fields" data-operational-profile-id={profile.id}>
      <div><dt>{tx('Cách theo dõi')}</dt><dd>{tx(profile.data.tracking === 'PRODUCT_SERIAL' ? 'Sản phẩm theo serial' : 'Linh kiện theo BOX')}</dd></div>
      <div><dt>{tx('Đơn vị tính')}</dt><dd>{profile.data.unit}</dd></div>
    </dl></> : reason ? (reason === 'READ_REQUIRED' && reading ? null : <p role="status">{tx(reasonCopy)}</p>) : unresolved ? null : <OperationalProfileForm
      context={sku && product ? { skuId: sku.id, skuCode: sku.code, productName: product.name, inheritedUnit: product.unit } : null}
      draft={draft} pending={state.busy} validationError={validationError}
      onDraftChange={setDraft} onValidationError={setValidationError}
      onSubmit={selection => void controller.create(selection)} />}
    {recoveryRequest && !state.busy && <p role="status">{tx(otherSku
      ? 'Thao tác cần xác nhận thuộc SKU khác. Việc kiểm tra lại sẽ giữ nguyên SKU và nội dung của thao tác đó.'
      : 'Một thao tác đang chờ xác nhận. Kiểm tra lại cùng thao tác trước khi tạo cấu hình khác.')}</p>}
    <Button variant="secondary" disabled={state.busy} onClick={() => void controller.read()}>{tx('Đọc lại dữ liệu')}</Button>
    {recoveryRequest && <Button variant="secondary" disabled={state.busy} onClick={() => void controller.reconcile()}>{tx('Kiểm tra lại thao tác')}</Button>}
  </section>;
}
