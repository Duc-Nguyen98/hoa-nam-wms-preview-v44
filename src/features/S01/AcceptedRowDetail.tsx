import { formatBusinessDate, formatDeclaredDateText } from '../../i18n/format-business-date';
import { useShellPreferences, type ShellLanguage } from '../../shared/shell-preferences';
import type { OverviewModel, OverviewRow } from '../../contracts/overview';
import { useOverviewCopy } from './overview-copy';
import { GlobalModal } from '../../shared/GlobalModal';
import { Button, Icon, StatusBadge } from '../../shared';
import { useEffect, useRef, useState } from 'react';
import { Notice, type NoticeFeedback } from '../../shared/Notice';

export { selectAcceptedOverviewRow, resolveAcceptedOverviewRow, type AcceptedRowSelection } from './overview-selection';

export function acceptedOverviewFields(row: OverviewRow) {
  return [
    { key: 'typeLabel', label: 'Loại phiếu', value: row.typeLabel, icon: row.type === 'inbound' ? 'download' as const : 'upload' as const },
    { key: 'warehouse', label: 'Kho', value: row.warehouse, icon: 'warehouse' as const },
    { key: 'partner', label: 'Đối tác', value: row.partner, icon: 'users' as const },
    { key: 'quantity', label: 'Số lượng', value: row.quantity, suffix: row.quantityUnit, icon: 'box' as const },
    { key: 'actor', label: 'Người thực hiện', value: row.actor, icon: 'user' as const },
    { key: 'timeLabel', label: 'Thời gian', value: row.timeLabel, icon: 'calendar' as const },
  ];
}

export function acceptedOverviewValue(value: string | number | null | undefined): string | number {
  return value == null || (typeof value === 'string' && !value.trim()) ? '—' : value;
}

/** Format only declared date fields; source identifiers remain untouched. */
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
  const tx = useOverviewCopy();
  const { language } = useShellPreferences();
  const [copyFeedback, setCopyFeedback] = useState<NoticeFeedback | null>(null);
  const sequence = useRef(0);
  const currentRow = useRef(row);
  currentRow.current = row;
  useEffect(() => { setCopyFeedback(null); sequence.current += 1; }, [row]);
  useEffect(() => () => { currentRow.current = null; sequence.current += 1; }, []);
  async function copy(value: string, origin: HTMLElement) {
    const selected = row, request = ++sequence.current;
    let success = false;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(value);
      success = true;
    } catch { /* Common feedback reports rejection without exposing browser errors. */ }
    if (currentRow.current !== selected || request !== sequence.current) return;
    setCopyFeedback({ message: success ? 'Đã sao chép.' : 'Không thể sao chép. Vui lòng thử lại.', tone: success ? 'success' : 'error', sequence: request, origin, container: document.body });
  }
  if (!row) {
    return <GlobalModal open={false} title={tx('Chi tiết phiếu')} onClose={onClose} resolveReturnFocus={resolveReturnFocus} />;
  }
  const isInbound = row.type === 'inbound';
  const title = isInbound ? 'Chi tiết phiếu nhập' : 'Chi tiết phiếu xuất';
  // S12/S15 are list routes for different cohorts, not an exact-ID document
  // consumer. Do not infer access or navigate to a different document.
  const fields = acceptedOverviewFields(row);
  const systemId = acceptedOverviewValue(row.id);
  // Public reference IDs are display fields of the approved static projection.
  // Any future protected provider must supply its own field permission contract.
  const canShowSystemId = source?.provenance === 'SOURCE_FIXTURE' || source?.provenance === 'QA_SYNTHETIC';
  return <GlobalModal
    open
    size="large"
    className="ov-detail-modal"
    title={<>
      <span className="ov-detail-title__icon" aria-hidden="true"><Icon name="documents" size={32} /></span>
      <span className="ov-detail-title__stack">
        <span className="ov-detail-title__eyebrow">{tx(title)}</span>
        <span className="ov-detail-title__number">{row.number}<button type="button" className="ov-copy-button" aria-label={tx("Sao chép mã phiếu")} disabled={!row.number} onClick={event => void copy(row.number, event.currentTarget)}><Icon name="copy" size={20} /></button></span>
      </span>
      <StatusBadge tone={row.status === 'posted' ? 'success' : 'warning'}>{tx(row.statusLabel)}</StatusBadge>
    </>}
    onClose={onClose}
    resolveReturnFocus={resolveReturnFocus}
    footer={<>
      <Button variant="secondary" onClick={onClose}>{tx('Đóng')}</Button>
      <Button variant="primary" disabled aria-describedby="ov-detail-navigation-reason" trailingIcon={<Icon name="arrow-right" size={17} />}>
        {tx(isInbound ? 'Mở phiếu nhập kho' : 'Mở phiếu xuất kho')}
      </Button>
    </>}
  >
    <div className="ov-detail-body" data-overview-detail-id={row.id}>
      <section className="ov-detail-section" aria-labelledby="ov-detail-document-title">
        <h3 id="ov-detail-document-title">{tx('Thông tin chứng từ')}</h3>
        <dl className="ov-detail-fields">
          {fields.map(field => <div key={field.key} className="ov-detail-field" data-field={field.key}>
            <dt><Icon name={field.icon} size={20} /><span>{tx(field.label)}</span></dt>
            <dd>{field.key === 'typeLabel' ? tx(acceptedOverviewValue(field.value)) : acceptedOverviewDateDisplay(field.key, acceptedOverviewValue(field.value), language)}{field.suffix ? <span className="ov-detail-field__suffix"> {tx(field.suffix)}</span> : null}</dd>
          </div>)}
        </dl>
      </section>
      <section className="ov-detail-section ov-detail-system" aria-labelledby="ov-detail-system-title">
        <h3 id="ov-detail-system-title">{tx('Thông tin hệ thống')}</h3>
        <dl className="ov-detail-fields ov-detail-fields--system">
          <div className="ov-detail-field" data-field="id">
            <dt><Icon name="barcode" size={20} /><span>{tx('ID')}</span></dt>
            <dd>{canShowSystemId ? <><span className="ov-detail-id">{systemId}</span>{row.id && <button type="button" className="ov-copy-button" aria-label={tx('Sao chép ID')} onClick={event => void copy(row.id, event.currentTarget)}><Icon name="copy" size={18} /></button>}</> : <span>{tx('Chưa xác minh quyền xem ID.')}</span>}</dd>
          </div>
        </dl>
      </section>
      <p className="ov-unavailable-reason" id="ov-detail-navigation-reason" data-overview-detail-source={source?.snapshotId}>{tx('Chưa có liên kết được xác minh tới chứng từ nguồn.')}</p>
      {copyFeedback && <Notice feedback={{ ...copyFeedback, message: tx(copyFeedback.message) }} onClose={() => setCopyFeedback(null)} />}
    </div>
  </GlobalModal>;
}
