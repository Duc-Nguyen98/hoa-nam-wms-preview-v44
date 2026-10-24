import { useEffect, useMemo, useRef, useState } from 'react';
import type { OperationalCommand, OperationalSurface } from '../contracts/operational-preview';
import { readBrowserPreviewRuntime } from '../preview-mock/browser-runtime';
import { Button } from '../shared';
import { useShellPreferences } from '../shared/shell-preferences';
import type { OperationalQaCheck } from './operational-qa-session';
import type { CatalogQaRequest } from './catalog-qa-session';
import { QaJsonDetails } from './QaJsonDetails';

const checks: { id: OperationalQaCheck; vi: string; en: string }[] = [
  { id: 'actor-denied', vi: 'Từ chối quyền', en: 'Authority denial' },
  { id: 'stale-version', vi: 'Phiên bản cũ', en: 'Stale version' },
  { id: 'replay', vi: 'Gửi lại lệnh đã ghi', en: 'Replay committed command' },
  { id: 'storage-before', vi: 'Lỗi trước khi ghi', en: 'Precommit storage failure' },
  { id: 'storage-after', vi: 'Mất phản hồi sau khi ghi', en: 'Postcommit response loss' },
];
const resetChecks = [...checks.filter(c => c.id !== 'stale-version'),
  { id: 'scope-conflict' as const, vi: 'Xung đột phiên / thế hệ / dataset', en: 'Scenario / generation / dataset conflict' },
  { id: 'owner-denied' as const, vi: 'Từ chối tài khoản khác (chẩn đoán)', en: 'Different owner denial (diagnostic)' }];
const catalogChecks = [...checks, { id: 'policy-result' as const, vi: 'PV: kết quả policy không chèn lỗi', en: 'PV: policy result without injected failure' }];
type VisibleQaSession = { read: () => Promise<unknown>; lookupReceipts?: (entityId: string) => Promise<unknown>; restore: () => Promise<{ kind: string }>; reconcile: () => Promise<unknown>; run: (check: OperationalQaCheck, request: unknown) => Promise<unknown> };

/** Diagnostic input is an explicit existing contract request, never an actor,
 * permission or surface override. App checks stay in their own App entry. */
export function OperationalQaChecks({ surface }: { surface: OperationalSurface | 'CATALOG' }) {
  const { language } = useShellPreferences(), en = language === 'en';
  const session = useMemo<VisibleQaSession | undefined>(() => {
    try {
      const runtime = readBrowserPreviewRuntime();
      if (surface === 'CATALOG') {
        const s = runtime?.catalogQa?.();
        return s && { read: s.read, lookupReceipts: s.lookupReceipts, restore: s.restore, reconcile: s.reconcile, run: (c, r) => s.run(c, r as CatalogQaRequest) };
      }
      const s = runtime?.operationalQa?.(surface);
      return s && { read: s.read, restore: s.restore, reconcile: s.reconcile, run: (c, r) => s.run(c, r as OperationalCommand) };
    }
    catch { return undefined; }
  }, [surface]);
  const [requestText, setRequestText] = useState(''), [check, setCheck] = useState<OperationalQaCheck>('actor-denied');
  const [lookupEntityId, setLookupEntityId] = useState('');
  const [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [evidence, setEvidence] = useState<unknown>(null);
  const active = useRef(false), lock = useRef(false), generation = useRef(0);
  useEffect(() => {
    active.current = true; const token = ++generation.current;
    if (session) void session.read().then(() => session.restore()).then(value => {
      if (active.current && token === generation.current) { setPending(value.kind !== 'empty'); setEvidence(value); setReady(true); }
    }).catch(e => { if (active.current && token === generation.current) setError(e?.code ?? 'QA_READ_FAILED'); });
    return () => { active.current = false; generation.current++; };
  }, [session]);
  async function perform(kind: 'read' | 'lookup' | 'run' | 'reconcile') {
    if (!session || lock.current || ((kind === 'run' || kind === 'reconcile') && !confirmed)) return;
    lock.current = true; const token = ++generation.current;
    setBusy(true); setError(''); setEvidence(null); setReady(false);
    try {
      let result: unknown;
      if (kind === 'read') result = { snapshot: await session.read(), recovery: await session.restore() };
      else if (kind === 'lookup') {
        if (!session.lookupReceipts) throw Object.assign(new Error(), { code: 'QA_LOOKUP_UNAVAILABLE' });
        result = await session.lookupReceipts(lookupEntityId.trim());
      }
      else if (kind === 'reconcile') result = await session.reconcile();
      else {
        const request: unknown = JSON.parse(requestText);
        if (!request || typeof request !== 'object' || Array.isArray(request)) throw Object.assign(new Error(), { code: 'QA_REQUEST_OBJECT_REQUIRED' });
        result = await session.run(check, request as OperationalCommand);
      }
      if (active.current && token === generation.current) setEvidence(result);
    } catch (e) {
      if (active.current && token === generation.current) setError(e instanceof SyntaxError ? 'QA_INVALID_JSON' : (e as { code?: string })?.code ?? 'QA_OPERATION_FAILED');
    } finally {
      try {
        await session.read(); const recovery = await session.restore();
        if (active.current && token === generation.current) { setPending(recovery.kind !== 'empty'); setReady(true); }
      } catch (e) { if (active.current && token === generation.current) { setEvidence(null); setReady(false); setError((e as { code?: string })?.code ?? 'QA_READ_FAILED'); } }
      lock.current = false;
      if (active.current && token === generation.current) { setBusy(false); setConfirmed(false); }
    }
  }
  if (!session) return null;
  return <section data-operational-qa-checks={surface} aria-busy={busy}>
    <h2>{en ? 'Command failure checks (QA)' : 'Kiểm tra lỗi lệnh (QA)'} · {surface}</h2>
    {surface === 'CATALOG' && <p>{en ? 'Approved catalogue commands plus PV Create/Update in the fixed p05-v1 dataset. Use actual records and the current scenario. Stale checks require an older Defect/PV version. The PV policy check sends the reviewed request without injecting a failure and can commit valid changes.' : 'Lệnh danh mục đã duyệt và Tạo/Sửa PV trong dataset p05-v1 cố định. Dùng hồ sơ thực tế và phiên hiện tại. Kiểm tra phiên bản cũ cần version Bệnh lỗi/PV thực sự cũ. Kiểm tra policy PV gửi request đã xem xét, không chèn lỗi và có thể ghi thay đổi hợp lệ.'}</p>}
    {surface === 'QA' && <p role="note">{en ? 'Reset diagnostics archive your current isolated test scenario and start an empty generation if committed or retried. Preserve Owner data. The request must explicitly confirm reset; the review checkbox confirms this specific archive action. Scope conflict is distinct from aggregate version conflict.' : 'Kiểm tra reset có thể lưu trữ phiên kiểm thử cô lập hiện tại và bắt đầu thế hệ trống khi commit hoặc retry. Bảo toàn dữ liệu Owner. Request phải xác nhận reset; ô xác nhận bên dưới áp dụng chính thao tác lưu trữ này. Xung đột phiên khác với xung đột version hồ sơ.'}</p>}
    <p>{en ? 'Use the exact sourced request for your active scenario: command ID, epoch, generation, entity/version and payload. Replay keeps the original request. Stale checks require an actually older version. These observations do not certify E2E.' : 'Dùng request đúng contract của phiên hiện tại: command ID, epoch, generation, entity/version và payload. Replay giữ nguyên request gốc. Kiểm tra phiên bản cũ cần version thực sự đã cũ. Quan sát này không phải chứng nhận E2E.'}</p>
    <p>{en ? 'Postcommit failure can commit the command. Reconciliation may commit a precommit retry or recover the original result. No retry occurs on refresh. Only your own scenario is allowed.' : 'Lỗi sau ghi có thể đã commit lệnh. Đối chiếu có thể ghi lệnh lỗi trước commit hoặc lấy lại kết quả gốc. Đọc lại không tự retry. Chỉ áp dụng phiên thuộc tài khoản hiện tại.'}</p>
    {surface === 'CATALOG' && <p>{en ? 'Resolve pending catalogue commands before resetting the scenario. If a pending write belongs to an archived generation, its original intent stays retained and blocks new diagnostics; this panel cannot discard it.' : 'Đối chiếu xong lệnh danh mục đang chờ trước khi reset phiên. Nếu lệnh chưa rõ kết quả thuộc thế hệ đã lưu trữ, request gốc vẫn được giữ và chặn kiểm tra mới; bảng này không xóa request đó.'}</p>}
    <fieldset disabled={busy || pending}>
      <legend>{en ? 'Explicit diagnostic request' : 'Request kiểm thử tường minh'}</legend>
      <label>{en ? 'Check' : 'Phép kiểm tra'}<select data-qa-check value={check} onChange={e => { setCheck(e.target.value as OperationalQaCheck); setConfirmed(false); setEvidence(null); }}>{(surface === 'QA' ? resetChecks : surface === 'CATALOG' ? catalogChecks : checks).map(c => <option key={c.id} value={c.id}>{en ? c.en : c.vi}</option>)}</select></label>
      <label>{en ? 'Canonical request JSON' : 'Request JSON dùng chung'}<textarea data-qa-request rows={10} value={requestText} onChange={e => { setRequestText(e.target.value); setConfirmed(false); setEvidence(null); }} /></label>
    </fieldset>
    <label><input data-qa-confirm type="checkbox" disabled={busy || !ready} checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />{en ? 'I reviewed this exact request/recovery and its possible writes in my scenario.' : 'Tôi đã kiểm tra đúng request/khôi phục này và khả năng ghi dữ liệu trong phiên của mình.'}</label>
    <div className="op-actions">
      <Button disabled={busy} onClick={() => void perform('read')}>{en ? 'Read state and recovery' : 'Đọc trạng thái và khôi phục'}</Button>
      <Button data-qa-run disabled={busy || !ready || pending || !confirmed || !requestText.trim()} onClick={() => void perform('run')}>{en ? 'Run explicit check' : 'Chạy kiểm tra đã chọn'}</Button>
      <Button disabled={busy || !ready || !pending || !confirmed} onClick={() => void perform('reconcile')}>{en ? 'Reconcile original command' : 'Đối chiếu lệnh gốc'}</Button>
    </div>
    {session.lookupReceipts && <fieldset disabled={busy}>
      <legend>{en ? 'Committed catalogue receipts (read only)' : 'Receipt danh mục đã ghi (chỉ đọc)'}</legend>
      <p>{en ? 'Enter an actual catalogue record ID to read your stored requests and receipts in this dataset. This does not execute, retry or acknowledge a command.' : 'Nhập ID bản ghi danh mục thực tế để đọc request và receipt đã lưu của bạn trong dataset này. Thao tác này không thực thi, retry hoặc xác nhận xóa journal của lệnh.'}</p>
      <label>{en ? 'Canonical record ID' : 'ID bản ghi canonical'}<input data-qa-receipt-entity maxLength={200} value={lookupEntityId} onChange={e => { setLookupEntityId(e.target.value); setEvidence(null); }} /></label>
      <Button data-qa-receipt-lookup disabled={busy || !lookupEntityId.trim()} onClick={() => void perform('lookup')}>{en ? 'Read committed receipts' : 'Đọc receipt đã ghi'}</Button>
    </fieldset>}
    {pending && <p role="status">{en ? 'An original command is pending. Read its recovery record before explicitly reconciling.' : 'Có lệnh gốc đang chờ. Đọc bản ghi khôi phục trước khi chủ động đối chiếu.'}</p>}
    {error && <p role="alert"><code>{error}</code></p>}
    {evidence !== null && <QaJsonDetails label={en ? 'Observed evidence · NOT E2E VERIFIED' : 'Bằng chứng quan sát · CHƯA XÁC MINH E2E'} value={evidence} scope="command-evidence" observation/>}
  </section>;
}
