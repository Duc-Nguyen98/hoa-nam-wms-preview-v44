import { formatBusinessTimestamp } from '../../i18n/format-business-timestamp';
import { useShellPreferences, type ShellLanguage } from '../../shared/shell-preferences';
import type { DataQualityQuery, DataQualityRow, DataQualitySummary } from '../../contracts/data-quality-report';

import type { ListRuntimeSnapshot } from '../../shared/list-runtime';
import { GlobalModal } from '../../shared/GlobalModal';
import { Button } from '../../shared/primitives';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { useReportCopy } from '../../i18n/reports-copy';

type Snapshot = ListRuntimeSnapshot<DataQualityRow, DataQualityQuery, DataQualitySummary>;
export interface AcceptedQualitySelection {
  model: NonNullable<Snapshot['model']>;
  row: DataQualityRow;
  sourceId: string;
  requestId: number;
}

/** A presentation reference is not a canonical identity. Retain the exact accepted objects. */
export function selectAcceptedQualityRow(state: Snapshot, row: DataQualityRow): AcceptedQualitySelection | null {
  if (!state.model || state.loading || state.debouncing || state.error || state.blocker || !state.model.rows.includes(row)) return null;
  return { model: state.model, row, sourceId: state.model.source.id, requestId: state.requestId };
}

export function resolveAcceptedQualityRow(state: Snapshot, selection: AcceptedQualitySelection | null): DataQualityRow | null {
  if (!selection || state.model !== selection.model || state.requestId !== selection.requestId
    || state.model?.source.id !== selection.sourceId || state.loading || state.debouncing || state.error || state.blocker) return null;
  return state.model.rows.includes(selection.row) ? selection.row : null;
}

export const QUALITY_DETAIL_COPY = {
  'Chi tiết đối chiếu': 'Reconciliation details',
  'Thông tin bản ghi · Chỉ xem': 'Record information · Read only',
  'Mã tham chiếu': 'Reference code', 'Đối tượng': 'Object', 'Hệ thống': 'System',
  'Đối chiếu': 'Comparison', 'Kết quả': 'Result', 'Chi tiết': 'Details', 'Cập nhật': 'Updated',
  'Đóng': 'Close', 'Đóng chi tiết đối chiếu': 'Close reconciliation details',
  'Chỉ hiển thị thông tin trong dòng đã đọc.': 'Shows only information from the loaded row.',
} as const;

/** The seven accepted fields only; heterogeneous values remain literal source strings. */
export function qualityDetailFields(row: DataQualityRow, reportCopy: (value: string) => string = value => value, language: ShellLanguage = 'vi') {
  return [
    { key: 'referenceCode', label: 'Mã tham chiếu', value: row.referenceCode },
    { key: 'object', label: 'Đối tượng', value: reportCopy(row.object) },
    { key: 'systemValue', label: 'Hệ thống', value: row.systemValue ?? '—' },
    { key: 'comparisonValue', label: 'Đối chiếu', value: row.comparisonValue ?? '—' },
    { key: 'result', label: 'Kết quả', value: reportCopy(row.result) },
    { key: 'detail', label: 'Chi tiết', value: reportCopy(row.detail) },
    { key: 'updatedAt', label: 'Cập nhật', value: formatBusinessTimestamp(row.updatedAt, language) },
  ];
}

export function AcceptedRowDetail({ row, onClose, resolveReturnFocus }: {
  row: DataQualityRow | null;
  onClose: () => void;
  resolveReturnFocus: () => HTMLElement | null;
}) {
  const tx = useUiCopy(QUALITY_DETAIL_COPY);
  const { language } = useShellPreferences();
  const reportCopy = useReportCopy();
  return <GlobalModal open={!!row} title={tx('Chi tiết đối chiếu')} description={tx('Thông tin bản ghi · Chỉ xem')}
    closeLabel={tx('Đóng chi tiết đối chiếu')} onClose={onClose} resolveReturnFocus={resolveReturnFocus}
    footer={<Button variant="secondary" onClick={onClose}>{tx('Đóng')}</Button>}>
    {row && <dl style={{ display: 'grid', gap: '16px', margin: 0 }}>
      {qualityDetailFields(row, reportCopy, language).map(field => <div key={field.key}>
        <dt style={{ color: 'var(--hn-muted)' }}>{tx(field.label)}</dt>
        <dd data-detail-field={field.key} style={{ margin: '4px 0 0', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{field.value}</dd>
      </div>)}
    </dl>}
  </GlobalModal>;
}
