import type { OverviewDocumentSelection } from '../../app/overview-document-route';
import { readOverviewSourceDocument } from '../../data/adapters/overview-document-fixture-adapter';
import { IS_BROWSER_PREVIEW } from '../../preview-mode';
import { Button, CataloguePageHeader, GlobalShell, Icon, PageState, StatusBadge } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { useShellPreferences } from '../../shared/shell-preferences';
import { formatBusinessDate } from '../../i18n/format-business-date';
import { useOverviewCopy } from '../S01/overview-copy';
import './overview-source-document.css';

/** The S12/S15 exact-source consumer is independent from their current-session lists. */
export function OverviewSourceDocumentScreen({ selection }: { selection: OverviewDocumentSelection }) {
  const tx = useOverviewCopy(), { language } = useShellPreferences();
  const document = IS_BROWSER_PREVIEW ? readOverviewSourceDocument(selection.target) : null;
  const inbound = selection.screen === 'S12';
  const title = tx(inbound ? 'Phiếu nhập kho' : 'Phiếu xuất kho');
  const listLabel = tx(inbound ? 'Danh sách phiếu nhập' : 'Danh sách phiếu xuất');
  const goOverview = () => { window.location.hash = '#/preview/S01'; };
  const goList = () => { window.location.hash = `#/preview/${selection.screen}`; };
  const date = (day: string, time: string) => `${formatBusinessDate(day, language)} · ${time}`;
  const status = document?.status === 'posted' ? tx('Đã ghi sổ') : tx('Chờ xử lý trên Web');
  const units = document ? [...new Set(document.lines.map(line => line.unit))] : [];
  return <GlobalShell title={title} variant="wms" navigation={S00_SHELL_NAVIGATION} activeKey={selection.screen}>
    <section className="ov-source-document" data-screen={selection.screen} data-source-document-id={document?.id} data-source-document-type={document?.type} key={document?.id ?? 'unavailable'}>
      <CataloguePageHeader appearance="worklist" parentLabel={tx(inbound ? 'Nhập kho' : 'Xuất kho')} breadcrumb={document?.number ?? title}
        title={document ? `${title} ${document.number}` : title}
        actions={<><Button variant="secondary" leadingIcon={<Icon name="chevron-left" size={18} />} onClick={goOverview}>{tx('Về Tổng quan')}</Button><Button variant="secondary" onClick={goList}>{listLabel}</Button></>} />
      {!document ? <PageState kind="record-not-found" title={tx('Không tìm thấy chứng từ')} description={tx('Liên kết không hợp lệ hoặc chứng từ không còn trong nguồn dữ liệu đã chọn. Vui lòng mở lại từ Tổng quan.')} action={<Button onClick={goOverview}>{tx('Về Tổng quan')}</Button>} /> : <>
        <section className="ov-source-document__panel" aria-labelledby="source-document-info">
          <div className="ov-source-document__section-heading"><h2 id="source-document-info"><Icon name="documents" size={24} />{tx('Thông tin chứng từ')}</h2><StatusBadge tone={document.status === 'posted' ? 'success' : 'warning'}>{status}</StatusBadge></div>
          <dl className="ov-source-document__fields">
            <div><dt>{tx('Mã phiếu')}</dt><dd data-document-field="number">{document.number}</dd></div>
            <div><dt>{tx('Kho')}</dt><dd data-document-field="warehouse">{document.warehouse}</dd></div>
            <div><dt>{tx('Đối tác')}</dt><dd data-document-field="partner">{document.partner}</dd></div>
            <div><dt>{tx('Người thực hiện')}</dt><dd data-document-field="actor">{document.actor}</dd></div>
            <div><dt>{tx('Thời gian')}</dt><dd data-document-field="time">{date(document.day, document.time)}</dd></div>
            <div><dt>{tx('Số lượng')}</dt><dd data-document-field="quantity">{document.lines.reduce((total, line) => total + line.quantity, 0)}{units.length === 1 ? ` ${tx(units[0])}` : ''}</dd></div>
          </dl>
        </section>
        <section className="ov-source-document__panel" aria-labelledby="source-document-lines">
          <div className="ov-source-document__section-heading"><h2 id="source-document-lines"><Icon name="box" size={24} />{tx('Hàng hóa')}</h2><span className="ov-source-document__count">{document.lines.length} SKU</span></div>
          <div className="ov-source-document__lines">{document.lines.map(line => <article className="ov-source-document__line" key={line.id} data-document-line-id={line.id}>
            <div className="ov-source-document__line-heading"><div><h3>{line.name}</h3><p>SKU: <code>{line.sku}</code></p></div><strong className="ov-source-document__quantity">{line.quantity} {tx(line.unit)}</strong></div>
            <details className="ov-source-document__serials"><summary>{tx('Serial đã ghi nhận')} <span>({line.serialCount})</span></summary>{line.serials.length ? <ul>{line.serials.map((serial, index) => <li key={`${serial}:${index}`}><code>{serial}</code></li>)}</ul> : <p>{tx('Chưa có serial ghi nhận.')}</p>}</details>
          </article>)}</div>
        </section>
        {document.note && <section className="ov-source-document__panel"><h2>{tx('Ghi chú')}</h2><p className="ov-source-document__note" data-document-field="note">{document.note}</p></section>}
        {!!document.attachments.length && <section className="ov-source-document__panel"><h2>{tx('Tệp đính kèm')}</h2><ul className="ov-source-document__attachments">{document.attachments.map(file => <li key={file.id}><a href={file.url} target="_blank" rel="noopener noreferrer"><Icon name="documents" size={20} /><span>{file.name}</span></a><span>{file.size}</span></li>)}</ul></section>}
        {!!document.events?.length && <details className="ov-source-document__panel ov-source-document__history"><summary>{tx('Lịch sử chứng từ')} <span>({document.events.length})</span></summary><ol>{document.events.map(event => <li key={event.id}><strong>{event.label}</strong><span>{date(event.day, event.time)} · {event.actor}</span><p>{event.description}</p></li>)}</ol></details>}
      </>}
    </section>
  </GlobalShell>;
}
