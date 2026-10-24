import { formatBusinessDate, formatDeclaredDateText } from '../../i18n/format-business-date';
import { useShellPreferences, type ShellLanguage } from '../../shared/shell-preferences';
import type { OverviewModel, OverviewRow } from '../../contracts/overview';
import type { createOverviewRuntimeController } from '../../controllers/overview-runtime';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { CATALOGUE_EN_COPY } from '../../i18n/catalogue-copy';
import { useReportCopy } from '../../i18n/reports-copy';
import { GlobalModal } from '../../shared/GlobalModal';
import { Button } from '../../shared/primitives';

type Runtime = ReturnType<ReturnType<typeof createOverviewRuntimeController>['getState']>;
export interface AcceptedRowSelection {
  model: OverviewModel;
  row: OverviewRow;
  snapshotId: string;
  requestId: number;
  queryKey: string;
}

export function selectAcceptedOverviewRow(state: Runtime, id: string): AcceptedRowSelection | null {
  if (!state.model || state.loading || state.debouncing || state.error || state.blocker) return null;
  const matches = state.model.rows.filter(row => row.id === id);
  if (matches.length !== 1) return null;
  return { model: state.model, row: matches[0], snapshotId: state.model.source.snapshotId,
    requestId: state.requestId, queryKey: JSON.stringify(state.intendedQuery) };
}

export function resolveAcceptedOverviewRow(selection: AcceptedRowSelection | null, state: Runtime): OverviewRow | null {
  if (!selection || state.model !== selection.model || state.requestId !== selection.requestId
    || JSON.stringify(state.intendedQuery) !== selection.queryKey) return null;
  const current = selectAcceptedOverviewRow(state, selection.row.id);
  return current?.snapshotId === selection.snapshotId && current.row === selection.row ? current.row : null;
}

export function acceptedOverviewFields(row: OverviewRow) {
  // Only the eleven approved OverviewRow fields; no fixture lines or document joins.
  return [
    { key: 'id', label: 'ID', value: row.id },
    { key: 'number', label: 'Mã phiếu', value: row.number },
    { key: 'typeLabel', label: 'Loại phiếu', value: row.typeLabel, displayLabel: true },
    { key: 'partner', label: 'Đối tác', value: row.partner },
    { key: 'warehouse', label: 'Kho', value: row.warehouse },
    { key: 'quantity', label: 'Số lượng', value: row.quantity },
    { key: 'actor', label: 'Người thực hiện', value: row.actor },
    { key: 'day', label: 'Ngày', value: row.day },
    { key: 'time', label: 'Giờ', value: row.time },
    { key: 'timeLabel', label: 'Thời gian', value: row.timeLabel },
    { key: 'statusLabel', label: 'Trạng thái', value: row.statusLabel, displayLabel: true },
  ];
}

export function acceptedOverviewValue(value: string | number | null | undefined): string | number {
  return value == null || (typeof value === 'string' && !value.trim()) ? '—' : value;
}

/** Format only declared date fields; the accepted source-field values remain untouched. */
export function acceptedOverviewDateDisplay(key: string, value: string | number, language: ShellLanguage): string | number {
  if (typeof value !== 'string') return value;
  if (key === 'day') return formatBusinessDate(value, language);
  if (key === 'timeLabel') {
    const match = /^(\d{2}\/\d{2}\/\d{4})( · \d{2}:\d{2})$/.exec(value);
    if (match) return formatDeclaredDateText(match[1], language) + match[2];
  }
  return value;
}

export function AcceptedRowDetail({ row, source, onClose, resolveReturnFocus }: {
  row: OverviewRow | null; source: OverviewModel['source'] | null;
  onClose: () => void; resolveReturnFocus: () => HTMLElement | null;
}) {
  const tx = useUiCopy(CATALOGUE_EN_COPY);
  const reportTx = useReportCopy();
  const { language } = useShellPreferences();
  return <GlobalModal open={!!row} title={row ? tx('Chi tiết {code}', { code: row.number }) : reportTx('Chi tiết')}
    onClose={onClose} resolveReturnFocus={resolveReturnFocus}
    footer={<Button variant="secondary" onClick={onClose}>{tx('Đóng')}</Button>}>
    {row && <dl data-overview-detail-id={row.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 16, margin: 0 }}>
      {acceptedOverviewFields(row).map(field => <div key={field.key} data-field={field.key} style={{ minWidth: 0 }}>
        <dt>{reportTx(tx(field.label))}</dt>
        <dd style={{ margin: '4px 0 0', overflowWrap: 'anywhere', fontWeight: 600 }}>{acceptedOverviewValue(field.displayLabel ? tx(String(field.value)) : acceptedOverviewDateDisplay(field.key, field.value, language))}</dd>
      </div>)}
    </dl>}
    {row && source && <p className="ov-source-scope" data-overview-detail-source={source.snapshotId}>
      {tx(source.provenance === 'QA_SYNTHETIC' ? '60 dòng tổng hợp riêng cho QA; chỉ số tổng quan giữ nguồn tham chiếu.' : 'Tìm kiếm và bộ lọc áp dụng trên 16 phiếu nguồn tháng 09/2026.')}
    </p>}
  </GlobalModal>;
}
