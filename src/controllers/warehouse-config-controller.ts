import type { EditableField, FieldErrors, WarehouseCommandOutcome, WarehouseConfigAdapter, WarehouseDraft, WarehouseRead, WarehouseRecoveryResult, WarehouseUpdateRequest } from '../contracts/warehouse-config';
import { createWarehouseConfigFixtureAdapter } from '../data/adapters/warehouse-config-fixture-adapter';
import { isWarehouseCommandOutcome } from '../data/http/warehouse-command-adapter';

const editableFields: readonly EditableField[] = ['name', 'contact_person', 'phone'];
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
function validRequest(value: Readonly<WarehouseUpdateRequest>): boolean {
  return !!value && value.warehouseId === 'warehouse-hn-01' && uuid(value.commandId) && uuid(value.epoch)
    && Number.isSafeInteger(value.expectedVersion) && value.expectedVersion > 0
    && editableFields.every(key => typeof value[key] === 'string')
    && Object.keys(value).length === 7;
}
/** Exact phone algorithm from validation.constants.ts at b2e1180. Formatting is
 * normalized only for validation; entered strings are never silently rewritten. */
export function validateWarehouseDraft(draft: WarehouseDraft): FieldErrors {
  const errors: FieldErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = 'Nhập tên kho.';
  else if (name.length > 200) errors.name = 'Tên kho tối đa 200 ký tự.';
  if (draft.contact_person.length > 200) errors.contact_person = 'Người liên hệ tối đa 200 ký tự.';
  const phone = draft.phone.trim();
  if (phone) {
    const cleaned = phone.replace(/[\s\-().]/g, '');
    if (!cleaned.length) errors.phone = 'Số điện thoại không được để trống';
    else if (cleaned.length > 10) errors.phone = 'Số điện thoại không được vượt quá 10 ký tự';
    else if (!/^(03|05|07|08|09)[0-9]{8}$/.test(cleaned)) errors.phone = 'Số điện thoại không hợp lệ (định dạng: 0xxxxxxxxx, đầu số 03/05/07/08/09)';
  }
  return errors;
}

export function createWarehouseConfigController(adapter: WarehouseConfigAdapter = createWarehouseConfigFixtureAdapter(), options: { commandId?: () => string } = {}) {
  // Clone at the boundary so a caller cannot mutate the accepted snapshot/draft.
  let read: WarehouseRead = structuredClone(adapter.read());
  const canView = () => read.kind === 'available' && read.access.permissionCodes.includes('warehouse.view');
  const canEdit = () => canView() && read.kind === 'available' && read.access.permissionCodes.includes('warehouse.manage');
  let initial: WarehouseDraft | null = canView() && read.kind === 'available'
    ? { name: read.snapshot.name, contact_person: read.snapshot.contact_person, phone: read.snapshot.phone } : null;
  let draft = initial ? { ...initial } : null;
  let touched: Partial<Record<EditableField, boolean>> = {};
  let serverErrors: FieldErrors = {};
  let feedback = '';
  const recovery = adapter.command?.recovery;
  let commandState: 'idle' | 'submitting' | 'saved' | 'error' | 'conflict' | 'outcome-unknown' | 'saved-refresh-error' | 'restoring' | 'recovery-blocked' = recovery ? 'restoring' : 'idle';
  let initialization: Promise<ReturnType<typeof view>> | undefined;
  let errorCode = '';
  let pendingCommand: Readonly<WarehouseUpdateRequest> | undefined;
  let outcome: WarehouseCommandOutcome | undefined;
  let privateStateHidden = false;
  let refreshing = false;
  const locked = () => refreshing || ['submitting', 'outcome-unknown', 'saved-refresh-error', 'restoring', 'recovery-blocked'].includes(commandState)
    || Boolean(recovery && outcome);
  const assigned = () => adapter.command?.available === true && read.kind === 'available'
    && read.snapshot.id === 'warehouse-hn-01' && !!read.commandContext?.epoch
    && Number.isSafeInteger(read.commandContext.version) && read.commandContext.version > 0 && !!adapter.readAsync;
  function accept(next: WarehouseRead) {
    privateStateHidden = false;
    read = structuredClone(next);
    initial = canView() && read.kind === 'available'
      ? { name: read.snapshot.name, contact_person: read.snapshot.contact_person, phone: read.snapshot.phone } : null;
    draft = initial ? { ...initial } : null;
    touched = {};
    serverErrors = {};
  }
  function validate() {
    const state = view();
    const firstInvalid = draft ? editableFields.find(field => state.errors[field]) : undefined;
    if (firstInvalid) touched = { name: true, contact_person: true, phone: true };
    return { ...view(), firstInvalid };
  }
  function view() {
    const errors = draft ? { ...validateWarehouseDraft(draft), ...serverErrors } : {};
    const dirty = Boolean(draft && initial && editableFields.some(key => draft![key] !== initial![key]));
    return {
      snapshot: !privateStateHidden && canView() && read.kind === 'available' ? { ...read.snapshot } : null,
      draft: !privateStateHidden && draft ? { ...draft } : null,
      // Authority and temporary interaction locks are distinct presentation facts.
      canManage: canEdit(),
      interactionLocked: locked(),
      canEdit: canEdit() && !locked(), dirty, errors,
      visibleErrors: Object.fromEntries(Object.entries(errors).filter(([key]) => touched[key as EditableField])) as FieldErrors,
      saveEnabled: !recovery && commandState === 'outcome-unknown' ? canEdit() && !refreshing && assigned() : canEdit() && !locked() && assigned() && dirty && !Object.keys(errors).length
        && ['idle', 'error', 'saved', 'outcome-unknown'].includes(commandState),
      feedback, commandState, refreshing, errorCode, receipt: !privateStateHidden && outcome ? structuredClone(outcome.receipt) : null,
      canReload: !refreshing && ['conflict', 'saved-refresh-error'].includes(commandState),
      canRecover: Boolean(recovery) && !refreshing && ['outcome-unknown', 'recovery-blocked'].includes(commandState),
      canContinue: Boolean(recovery && outcome) && commandState === 'saved' && !refreshing,
      restoring: commandState === 'restoring',
      statusLabel: read.kind === 'available' && read.snapshot.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động',
      sourceMessage: read.kind === 'source-unselected' ? read.message : !canView() ? 'Chưa có quyền xem cấu hình kho trong ngữ cảnh được cung cấp.' : '',
      statusEditable: false as const,
      addressEditable: false as const,
      writeAssigned: assigned(),
    };
  }
  function receiptMatches(result: WarehouseCommandOutcome, request: Readonly<WarehouseUpdateRequest>) {
    const snapshot = read.kind === 'available' ? read.snapshot : null;
    return isWarehouseCommandOutcome(result, request) && read.kind === 'available'
      && (['id', 'code', 'address', 'status'] as const).every(field => result.receipt.record.data[field] === snapshot![field]);
  }
  function canonicalMatches(next: WarehouseRead) {
    if (!outcome || next.kind !== 'available' || !next.commandContext || !next.access.permissionCodes.includes('warehouse.view')) return false;
    const receipt = outcome.receipt;
    return next.commandContext.epoch === receipt.epoch && Number.isSafeInteger(next.commandContext.version) && next.commandContext.version >= receipt.version
      && next.snapshot.id === 'warehouse-hn-01'
      && (next.commandContext.version !== receipt.version || (Object.keys(receipt.record.data) as (keyof typeof next.snapshot)[])
        .every(field => next.snapshot[field] === receipt.record.data[field]));
  }
  async function refreshCommitted() {
    try {
      if (!await recoveryAuthorityValid()) return view();
      if (!adapter.readAsync) throw Error('Canonical refresh unavailable');
      const next = await adapter.readAsync();
      if (!await recoveryAuthorityValid()) return view();
      if (next.kind !== 'available' || !next.access.permissionCodes.includes('warehouse.view')) privateStateHidden = true;
      if (!canonicalMatches(next)) throw Error('Canonical refresh mismatch');
      accept(next); if (!recovery) pendingCommand = undefined; commandState = 'saved'; errorCode = '';
      feedback = outcome!.receipt.changed ? 'Đã lưu thay đổi cấu hình kho.' : 'Thông tin kho không thay đổi.';
    } catch {
      if (!await recoveryAuthorityValid()) return view();
      commandState = 'saved-refresh-error'; feedback = 'Thay đổi đã được ghi nhận nhưng chưa tải lại được thông tin kho. Vui lòng tải lại.';
    }
    return view();
  }
  function blockRecovery(code: string) {
    commandState = 'recovery-blocked'; errorCode = code;
    feedback = 'Chưa thể kiểm tra yêu cầu lưu trước đó. Yêu cầu vẫn được giữ; khôi phục phiên phù hợp rồi kiểm tra lại.';
    return view();
  }
  async function recoveryAuthorityValid() {
    if (!recovery) return true;
    try {
      const restored = await recovery.restore();
      if (restored.kind === 'blocked') { await consumeRecovery(restored, false); return false; }
      if (restored.kind === 'empty' || !pendingCommand || !validRequest(restored.request)
        || (Object.keys(pendingCommand) as (keyof WarehouseUpdateRequest)[]).some(key => pendingCommand![key] !== restored.request[key])) {
        await consumeRecovery({ kind: 'blocked', code: 'RECOVERY_ENTRY_MISMATCH' }, false); return false;
      }
      return true;
    } catch { await consumeRecovery({ kind: 'blocked', code: 'RECOVERY_UNAVAILABLE' }, false); return false; }
  }
  async function consumeRecovery(result: WarehouseRecoveryResult, allowEmpty: boolean) {
    if (result.kind === 'blocked') {
      // A changed/expired actor never sees the previous actor's draft or receipt.
      pendingCommand = undefined; outcome = undefined; draft = null; privateStateHidden = true;
      return blockRecovery(result.code);
    }
    if (result.kind === 'empty') {
      if (!allowEmpty) return blockRecovery('RECOVERY_ENTRY_MISSING');
      if (privateStateHidden) {
        try {
          if (!adapter.readAsync || !recovery?.readCurrent) return blockRecovery('RECOVERY_CONTEXT_UNAVAILABLE');
          // The empty journal carries no actor identity. Bind the fallback read
          // and final journal check to the same authority before revealing it.
          const current = await recovery.readCurrent(async () => ({ next: await adapter.readAsync!(), restored: await recovery.restore() }));
          if (current.restored.kind !== 'empty') return blockRecovery(current.restored.kind === 'blocked' ? current.restored.code : 'RECOVERY_CONTEXT_CHANGED');
          accept(current.next);
        }
        catch { return blockRecovery('RECOVERY_UNAVAILABLE'); }
      }
      commandState = 'idle'; errorCode = ''; feedback = ''; return view();
    }
    if (!validRequest(result.request)) return blockRecovery('INVALID_RECOVERY_REQUEST');
    if (pendingCommand && (Object.keys(pendingCommand) as (keyof WarehouseUpdateRequest)[]).some(key => pendingCommand![key] !== result.request[key])) return blockRecovery('RECOVERY_REQUEST_MISMATCH');
    pendingCommand = Object.freeze(structuredClone(result.request));
    privateStateHidden = false;
    draft = canView() ? { name: pendingCommand.name, contact_person: pendingCommand.contact_person, phone: pendingCommand.phone } : null;
    if (result.kind === 'pending') {
      commandState = 'outcome-unknown'; errorCode = result.code ?? '';
      feedback = 'Chưa xác định được kết quả lưu. Thử lại cùng yêu cầu để kiểm tra kết quả.';
      return view();
    }
    if (!receiptMatches(result.outcome, pendingCommand)) return blockRecovery('INVALID_RECOVERY_RECEIPT');
    outcome = structuredClone(result.outcome);
    return refreshCommitted();
  }
  function initializeRecovery() {
    if (!recovery) return Promise.resolve(view());
    initialization ??= Promise.resolve().then(() => recovery.restore()).then(result => consumeRecovery(result, true))
      .catch(() => blockRecovery('RECOVERY_UNAVAILABLE'));
    return initialization;
  }
  async function retryRecovery() {
    if (!recovery || !view().canRecover) return view();
    const allowEmpty = !pendingCommand && !outcome;
    commandState = 'submitting'; errorCode = ''; feedback = '';
    try { return await consumeRecovery(await recovery.retry(), allowEmpty); }
    catch { commandState = 'outcome-unknown'; errorCode = 'RECOVERY_UNAVAILABLE'; feedback = 'Chưa xác định được kết quả lưu. Thử lại cùng yêu cầu để kiểm tra kết quả.'; return view(); }
  }
  return {
    view,
    initializeRecovery,
    retryRecovery,
    async continueAfterSave() {
      if (!recovery || !view().canContinue || !outcome) return view();
      refreshing = true;
      try {
        // Re-check the actor-bound entry before acknowledgement, including across auth changes.
        const restored = await recovery.restore();
        if (restored.kind === 'blocked') return consumeRecovery(restored, false);
        if (restored.kind !== 'committed' || !pendingCommand || !receiptMatches(restored.outcome, pendingCommand)
          || (Object.keys(pendingCommand) as (keyof WarehouseUpdateRequest)[]).some(key => pendingCommand![key] !== restored.request[key])) return blockRecovery('RECOVERY_RECEIPT_MISMATCH');
        const next = await adapter.readAsync!();
        if (!await recoveryAuthorityValid()) return view();
        if (next.kind !== 'available' || !next.access.permissionCodes.includes('warehouse.view')) privateStateHidden = true;
        if (!canonicalMatches(next)) throw Error('Canonical refresh mismatch');
        await recovery.acknowledge(outcome.receipt.commandId);
        accept(next); pendingCommand = undefined; outcome = undefined; commandState = 'idle'; feedback = ''; errorCode = '';
      } catch {
        if (!await recoveryAuthorityValid()) return view();
        commandState = 'saved-refresh-error'; feedback = 'Thay đổi đã được ghi nhận nhưng chưa tải lại được thông tin kho. Vui lòng tải lại.';
      }
      finally { refreshing = false; }
      return view();
    },
    update(field: EditableField, value: string) {
      if (!view().canEdit || !draft || !editableFields.includes(field)) return view();
      draft = { ...draft, [field]: value };
      delete serverErrors[field];
      feedback = '';
      if (commandState !== 'conflict') { commandState = 'idle'; errorCode = ''; }
      pendingCommand = undefined; outcome = undefined;
      return view();
    },
    blur(field: EditableField) { touched = { ...touched, [field]: true }; return view(); },
    submit() {
      const state = validate();
      if (!state.canEdit || !draft || state.firstInvalid) return state;
      if (!state.dirty) return { ...state, firstInvalid: undefined };
      // Honest local feedback only. No request, success, timer, timestamp or mutation.
      feedback = 'Chưa thể lưu thay đổi trong phạm vi hiện tại. Luồng lưu chưa được bàn giao; nội dung bạn nhập vẫn được giữ và chưa cập nhật thông tin kho.';
      return { ...view(), firstInvalid: undefined };
    },
    async submitAsync() {
      if (recovery && view().canRecover) return { ...await retryRecovery(), firstInvalid: undefined };
      const state = validate();
      if (state.firstInvalid || !state.saveEnabled || !draft || read.kind !== 'available' || !adapter.command || !read.commandContext) return state;
      try {
        pendingCommand ??= Object.freeze({ ...draft, warehouseId: 'warehouse-hn-01' as const,
          commandId: (options.commandId ?? (() => crypto.randomUUID()))(), epoch: read.commandContext.epoch, expectedVersion: read.commandContext.version });
        if (!validRequest(pendingCommand)) throw Error('Invalid command coordinates');
      } catch {
        pendingCommand = undefined; commandState = 'error'; errorCode = 'INVALID_COMMAND_REQUEST';
        feedback = 'Không thể lưu thay đổi. Bản nháp được giữ lại.'; return { ...view(), firstInvalid: undefined };
      }
      const recovering = commandState === 'outcome-unknown';
      commandState = 'submitting'; feedback = ''; errorCode = '';
      try {
        const result = await adapter.command.update(pendingCommand);
        if (!receiptMatches(result, pendingCommand)) throw { code: 'INVALID_RESPONSE' };
        outcome = structuredClone(result);
      } catch (error) {
        const failure = (error ?? {}) as { code?: string; status?: number; details?: { fieldErrors?: FieldErrors } };
        errorCode = failure?.code ?? 'NETWORK_ERROR';
        const knownPrecommitFailure = ['MOCK_COMMAND_FAILED', 'MOCK_STORAGE_UNAVAILABLE', 'MOCK_STATE_INVALID'].includes(errorCode);
        const unknown = recovering || !failure?.status || ['NETWORK_ERROR', 'REQUEST_TIMEOUT', 'INVALID_RESPONSE', 'ERR_CANCELED'].includes(errorCode)
          || failure.status === 408 || (failure.status >= 500 && !knownPrecommitFailure);
        commandState = unknown ? 'outcome-unknown' : failure.status === 409 ? 'conflict' : 'error';
        feedback = unknown ? 'Chưa xác định được kết quả lưu. Thử lại cùng yêu cầu để kiểm tra kết quả.'
          : failure.status === 409 ? 'Dữ liệu đã thay đổi. Bản nháp được giữ lại; tải lại để đối chiếu trước khi lưu.'
          : 'Không thể lưu thay đổi. Bản nháp được giữ lại.';
        if (failure.status === 422 && failure.details?.fieldErrors) {
          for (const field of editableFields) {
            const message = failure.details.fieldErrors[field];
            if (typeof message === 'string') { serverErrors[field] = message; touched[field] = true; }
          }
        }
        if (!unknown) pendingCommand = undefined;
        if (recovery) {
          // The journal decides whether dispatch occurred; a rejection after an earlier
          // uncertain attempt cannot be interpreted as rollback by the form.
          try {
            const restored = await recovery.restore();
            if (restored.kind !== 'empty') { await consumeRecovery(restored, false); return { ...view(), firstInvalid: undefined }; }
            if (unknown) blockRecovery('RECOVERY_ENTRY_MISSING');
          } catch { blockRecovery('RECOVERY_UNAVAILABLE'); }
        }
        return { ...view(), firstInvalid: editableFields.find(field => serverErrors[field]) };
      }
      await refreshCommitted();
      return { ...view(), firstInvalid: undefined };
    },
    /** Explicit reconciliation discards the local draft only after a successful canonical read. */
    async reload() {
      if (!adapter.readAsync || refreshing || ['submitting', 'outcome-unknown', 'restoring', 'recovery-blocked'].includes(commandState)) return view();
      refreshing = true;
      try {
        if (outcome) await refreshCommitted();
        else { const next = await adapter.readAsync(); if (next.kind !== 'available') throw Error('Canonical read unavailable'); accept(next); pendingCommand = undefined; commandState = 'idle'; feedback = ''; errorCode = ''; }
      }
      catch { feedback = 'Không thể tải lại thông tin kho. Bản nháp được giữ lại.'; }
      finally { refreshing = false; }
      return view();
    },
    /** DEV scenario reset only; deliberately not mounted as a product action. */
    reset() { if (locked() || commandState === 'conflict') return view(); draft = initial ? { ...initial } : null; touched = {}; serverErrors = {}; feedback = ''; commandState = 'idle'; pendingCommand = undefined; return view(); },
  };
}
