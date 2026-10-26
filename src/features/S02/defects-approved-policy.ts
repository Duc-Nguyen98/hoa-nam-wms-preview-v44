import { validateDefectDraft, type DefectDraft, type DefectRow, type DefectsCommandOperation } from '../../contracts/defects';
import type { BusinessHandler, BusinessRecord } from '../../preview-mock/business-repository';
import { PreviewHttpError } from '../../preview-mock/errors';
import { DefectsCommandError, type DefectsCommandPolicy } from './defects-command-service';

/** Owner 2026-10-18 P02 comparison; display code is only trimmed, never case-folded. */
export const defectCodeComparisonKey = (code: string) => code.trim().normalize('NFC').toLocaleUpperCase('en-US');
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const statusLabel = (status: DefectDraft['status']) => status === 'active' ? 'Đang sử dụng' : 'Ngừng sử dụng';
const invalid = (fieldErrors: Record<string, string> = {}) => new PreviewHttpError(422, 'VALIDATION_FAILED', 'Kiểm tra giá trị đã nhập.', { fieldErrors });
const unsupported = () => new PreviewHttpError(422, 'IMMUTABLE_OR_UNKNOWN_FIELD', 'Chỉ có thể sửa tên, mô tả và trạng thái.', { fieldErrors: { code: 'Thay đổi mã lỗi chưa khả dụng.' } });

function row(record: Readonly<BusinessRecord>): DefectRow {
  const value = record.data;
  if (record.kind !== 'defect' || !object(value)
    || !['key', 'ordinal', 'code', 'name', 'description', 'statusLabel'].every(key => typeof value[key] === 'string')
    || !['active', 'inactive'].includes(String(value.status))) {
    throw new PreviewHttpError(503, 'MOCK_STATE_INVALID', 'Không thể đọc dữ liệu danh mục.');
  }
  return value as unknown as DefectRow;
}

function validate(payload: unknown, code?: string): DefectDraft {
  if (!object(payload)) throw invalid();
  const draft = { ...payload, ...(code === undefined ? {} : { code }) } as unknown as DefectDraft;
  const errors = validateDefectDraft(draft);
  if (Object.keys(errors).length) throw invalid(errors);
  return draft;
}

/** Domain-only handlers; actor authorization and atomic version/receipt writes remain host-owned. */
export const APPROVED_DEFECTS_HANDLERS: Readonly<Record<'defects.create' | 'defects.update', BusinessHandler>> = Object.freeze({
  'defects.create': {
    operation: 'create', entityKind: 'defect', idPrefix: 'defect:',
    apply(payload, _current, context) {
      if (!context || !Array.isArray(context.records) || !context.entityId.startsWith('defect:')) {
        throw new PreviewHttpError(503, 'COMMAND_CONTEXT_UNAVAILABLE', 'Không thể xác minh danh mục để lưu hồ sơ.');
      }
      if (!object(payload) || Object.keys(payload).some(key => !['code', 'name', 'description', 'status'].includes(key))) throw invalid();
      const draft = validate(payload);
      const records = context.records.filter(record => record.kind === 'defect').map(row);
      const code = draft.code.trim(), key = defectCodeComparisonKey(code);
      if (records.some(record => defectCodeComparisonKey(record.code) === key)) {
        throw new PreviewHttpError(409, 'DUPLICATE_DEFECT_CODE', 'Mã lỗi đã tồn tại. Kiểm tra lại mã đã nhập.',
          { fieldErrors: { code: 'Mã lỗi đã tồn tại. Kiểm tra lại mã đã nhập.' } });
      }
      return { key: context.entityId, ordinal: String(records.length + 1).padStart(2, '0'), code,
        name: draft.name, description: draft.description, status: draft.status, statusLabel: statusLabel(draft.status) } satisfies DefectRow;
    },
  },
  'defects.update': {
    operation: 'update', entityKind: 'defect',
    apply(payload, current) {
      if (!object(payload)) throw invalid();
      if (Object.keys(payload).some(key => !['name', 'description', 'status'].includes(key))) throw unsupported();
      if (!current) throw new PreviewHttpError(404, 'NOT_FOUND', 'Không tìm thấy hồ sơ cần cập nhật.');
      const saved = row(current), draft = validate(payload, saved.code);
      // Owner XN01 explicitly keeps saved codes immutable. No rename cascade.
      return { ...saved, name: draft.name, description: draft.description, status: draft.status, statusLabel: statusLabel(draft.status) } satisfies DefectRow;
    },
  },
});

/** The host resolves exact approved capabilities; this serializer never grants them. */
export function createApprovedDefectsCommandPolicy(canWrite: (operation: DefectsCommandOperation) => boolean): DefectsCommandPolicy {
  return {
    p01: canWrite,
    savedCodeEditable: false,
    p02: draft => ({ code: draft.code, name: draft.name, description: draft.description, status: draft.status }),
    p03: (draft, original) => {
      if (draft.code !== original.code) throw new DefectsCommandError('IMMUTABLE_OR_UNKNOWN_FIELD', 422,
        { fieldErrors: { code: 'Thay đổi mã lỗi chưa khả dụng.' } });
      return { name: draft.name, description: draft.description, status: draft.status };
    },
  };
}
