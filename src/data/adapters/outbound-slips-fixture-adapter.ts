import seed from '../fixtures/S15.seed.json';
import { collectFilterOptions, type ListReadResult } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { DEFAULT_OUTBOUND_SLIPS_QUERY, type OutboundSlipRow, type OutboundSlipsAdapter, type OutboundSlipsQuery, type OutboundSlipsSummary } from '../../contracts/outbound-slips';

/** Seven source rows are available; catalogue total and missing rows remain separate. */
export function createOutboundSlipsFixtureAdapter(): OutboundSlipsAdapter {
  const fixture = structuredClone(seed.fixture);
  const rows: OutboundSlipRow[] = fixture.visibleRows.map(values => {
    const [issueCode, requestCode, recipient, createdAt, note, reconciliation, status, action] = values;
    if ([issueCode, requestCode, recipient, createdAt, note, reconciliation, status, action].some(value => typeof value !== 'string')) throw Error('Invalid S15 source row');
    return { issueCode, requestCode, recipient, createdAt, note, reconciliation, status, action };
  });
  if (rows.length !== 7 || new Set(rows.map(row => row.issueCode)).size !== 7 || fixture.totalDocuments !== 84 || fixture.draftDocuments !== 6 || fixture.scanningDocuments !== 4 || fixture.exportedDocuments !== 72 || fixture.cancelledDocuments !== 2) throw Error('S15 source integrity mismatch');
  if (rows.some(row => row.reconciliation === '0/0' || (row.status === 'Đã hủy' && row.reconciliation !== '—'))) throw Error('S15 reconciliation source mismatch');
  const summary: OutboundSlipsSummary = {
    totalDocuments: fixture.totalDocuments,
    draftDocuments: fixture.draftDocuments,
    scanningDocuments: fixture.scanningDocuments,
    exportedDocuments: fixture.exportedDocuments,
    cancelledDocuments: fixture.cancelledDocuments,
  };
  const filterOptions = collectFilterOptions(rows, { status: row => row.status, recipient: row => row.recipient });
  const blocked = (query: OutboundSlipsQuery, reason: string, detail: string): ListReadResult<OutboundSlipRow, OutboundSlipsQuery, OutboundSlipsSummary> => ({ kind: 'blocked', query, reason, detail });
  return {
    async read(input = { ...DEFAULT_OUTBOUND_SLIPS_QUERY }, context) {
      if (context?.signal?.aborted) throw new DOMException('S15 fixture read cancelled', 'AbortError');
      const query = structuredClone(input);
      if (query.sort !== undefined && query.sort !== DEFAULT_OUTBOUND_SLIPS_QUERY.sort) return blocked(query, 'INCOMPLETE_SOURCE', 'The archived partial fixture does not supply a complete alternative creation-date sort.');
      if (typeof query.search !== 'string' || !Number.isSafeInteger(query.page) || query.page < 1 || query.page > Math.ceil(fixture.totalDocuments / query.pageSize) || !PAGE_SIZE_OPTIONS.includes(query.pageSize as 10) || (query.status !== '' && !filterOptions.status.includes(query.status)) || (query.recipient !== '' && !filterOptions.recipient.includes(query.recipient))) {
        return blocked(query, 'INVALID_QUERY', 'Điều kiện không thuộc lựa chọn có nguồn của S15.');
      }
      if (query.search.trim() || query.status || query.recipient) return blocked(query, 'INCOMPLETE_SOURCE', 'Thiếu 77 phiếu để xác nhận kết quả tìm kiếm/lọc trên toàn bộ 84 phiếu.');
      if (query.page !== 1) return blocked(query, 'INCOMPLETE_SOURCE', `Chưa có nguồn chi tiết của trang ${query.page}.`);
      if (query.pageSize !== DEFAULT_OUTBOUND_SLIPS_QUERY.pageSize) return blocked(query, 'INCOMPLETE_SOURCE', 'Chưa đủ nguồn để xác nhận cửa sổ số dòng khác mặc định.');
      query.search = '';
      return { kind: 'ready', model: {
        query,
        rows: structuredClone(rows),
        summary: structuredClone(summary),
        filterOptions: structuredClone(filterOptions),
        pagination: { page: 1, pageSize: DEFAULT_OUTBOUND_SLIPS_QUERY.pageSize, pageCount: Math.ceil(fixture.totalDocuments / DEFAULT_OUTBOUND_SLIPS_QUERY.pageSize), total: fixture.totalDocuments, unfilteredTotal: fixture.totalDocuments, start: 1, end: rows.length, pageSizeOptions: PAGE_SIZE_OPTIONS },
        source: { id: 'S15-P01-r01-default', scope: 'catalogue', completeness: 'partial', detailTotal: rows.length, aggregateTotal: fixture.totalDocuments },
      } };
    },
  };
}
