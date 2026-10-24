import fixture from '../fixtures/S01_SCANNER_PINNED.json';
import { queryOverviewRows } from './overview-table-query';
import {
  DEFAULT_OVERVIEW_QUERY,
  type OverviewBlocker, type OverviewDataAdapter, type OverviewModel, type OverviewPolicy,
  type OverviewQuery, type OverviewResult, type OverviewRow,
} from '../../contracts/overview';

const typeLabels = { inbound: 'Nhập kho', outbound: 'Xuất kho' };
const statusLabels = { waiting: 'Chờ xử lý trên Web', posted: 'Đã ghi sổ' };

function block(query: OverviewQuery, reason: OverviewBlocker, detail: string): OverviewResult {
  return { kind: 'blocked', reason, detail, query: structuredClone(query) };
}

function validDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const day = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === value;
}

/** The only S01 data boundary: no URLs, credentials, writes, storage, or synthetic delays. */
export function createOverviewFixtureAdapter(policy: OverviewPolicy = {}): OverviewDataAdapter {
  const pageSizeOptions = [...(policy.pageSizeOptions ?? [10])];
  const searchMatch = policy.searchMatch ?? null;
  const allowPeriodChange = policy.allowPeriodChange ?? false;
  if (!pageSizeOptions.length || pageSizeOptions.some((size) => !Number.isSafeInteger(size) || size < 1)) {
    throw new Error('Confirmed page-size options must be positive integers');
  }

  return {
    async read(input = DEFAULT_OVERVIEW_QUERY, scenario = 'default'): Promise<OverviewResult> {
      const query = structuredClone(input);
      if (scenario !== 'default') return block(query, 'STATE_NOT_SUPPLIED', 'Only S01 Default is supplied for this implementation; the requested state has no approved source.');
      if (!['all', 'inbound', 'outbound'].includes(query.type) || !['all', 'waiting', 'posted'].includes(query.status) || !['asc', 'desc'].includes(query.sort) || typeof query.search !== 'string') {
        return block(query, 'INVALID_QUERY', 'The query is outside the supplied S01 fixture values.');
      }
      if (!['number', 'type', 'time', 'actor', 'quantity', 'status'].includes(query.sortKey)) return block(query, 'INVALID_QUERY', 'Invalid S01 sort key.');
      if (!validDay(query.period.from) || !validDay(query.period.to) || query.period.from > query.period.to) return block(query, 'INVALID_PERIOD', 'The period requires two valid, ordered source dates.');
      if (query.period.from < fixture.source.periodCoverage.from || query.period.to > fixture.source.periodCoverage.to) return block(query, 'PERIOD_OUTSIDE_SNAPSHOT', 'This complete fixture covers September 2026 only; another period needs its own source.');
      if (!allowPeriodChange && (query.period.from !== DEFAULT_OVERVIEW_QUERY.period.from || query.period.to !== DEFAULT_OVERVIEW_QUERY.period.to)) return block(query, 'PERIOD_CHANGE_UNCONFIRMED', 'Changing the shared period requires confirmation of preview date behavior.');
      if (query.search.trim() && searchMatch === null) return block(query, 'SEARCH_SEMANTICS_UNCONFIRMED', 'The Web source names document number and actor; match mode and trigger require confirmation.');
      if (!pageSizeOptions.includes(query.pageSize)) return block(query, 'PAGE_SIZE_UNCONFIRMED', 'Only explicitly supplied page-size options can run.');
      if (!Number.isSafeInteger(query.page) || query.page < 1) return block(query, 'PAGE_OUT_OF_RANGE', 'The requested page is invalid.');

      // Match source day strings directly; no conversion to a guessed business timezone.
      const inPeriod = fixture.stockDocuments.filter((row) => row.day >= query.period.from && row.day <= query.period.to);
      const chart = [
        { label: '01–07', from: '01', to: '07' }, { label: '08–14', from: '08', to: '14' },
        { label: '15–21', from: '15', to: '21' }, { label: '22–30', from: '22', to: '30' },
      ].map((bucket) => {
        const rows = inPeriod.filter((row) => row.day.slice(-2) >= bucket.from && row.day.slice(-2) <= bucket.to);
        return { label: bucket.label, inbound: rows.filter((row) => row.type === 'inbound').length, outbound: rows.filter((row) => row.type === 'outbound').length };
      });
      const summary: OverviewModel['summary'] = {
        inbound: inPeriod.filter((row) => row.type === 'inbound').length,
        outbound: inPeriod.filter((row) => row.type === 'outbound').length,
        posted: inPeriod.filter((row) => row.status === 'posted').length,
        waiting: inPeriod.filter((row) => row.status === 'waiting').length,
        stockTotal: null, stockDisplay: '—', stockHelp: 'Chưa có số liệu xác nhận',
        openWarranties: fixture.warrantyCases.filter((row) => row.warehouse === 'Kho Hoa Nam' && ['Đã tiếp nhận', 'Đang kiểm tra', 'Chờ bàn giao'].includes(row.status)).length,
      };
      const sourceRows: OverviewRow[] = inPeriod.map((row) => {
        if (!(row.type in typeLabels) || !(row.status in statusLabels) || !row.lines.every((line) => Number.isFinite(line.quantity))) throw new Error('Pinned fixture changed outside supported S01 mapping');
        const type = row.type as OverviewRow['type'];
        const status = row.status as OverviewRow['status'];
        return {
          id: row.id, number: row.number, type, typeLabel: typeLabels[type], partner: row.partner,
          warehouse: row.warehouse, quantity: row.lines.reduce((sum, line) => sum + line.quantity, 0),
          actor: row.actor, day: row.day, time: row.time,
          timeLabel: `${row.day.split('-').reverse().join('/')} · ${row.time}`,
          status, statusLabel: statusLabels[status],
        };
      });
      const table = queryOverviewRows(sourceRows, query);
      if (table.kind !== 'ready') return block(query, table.reason === 'PAGE_OUT_OF_RANGE' ? 'PAGE_OUT_OF_RANGE' : 'INVALID_QUERY', table.detail);
      return {
        kind: 'ready',
        model: {
          query, rows: table.rows, summary, chart,
          pagination: { ...table.pagination, pageSizeOptions: [...pageSizeOptions] },
          emptyReason: inPeriod.length === 0 ? 'no-documents' : table.pagination.total === 0 ? 'no-matches' : null,
          source: {
            commit: fixture.source.commit, documentVersion: fixture.source.documentVersion,
            provenance: 'SOURCE_FIXTURE', evidence: 'INTERACTIVE_FIXTURE_VERIFIED',
            snapshotId: `scanner:${fixture.source.commit}:${fixture.source.documentVersion}`,
            fixtureRecordCount: fixture.stockDocuments.length,
            backendMapping: null, endpoint: null, permissionKeys: null, businessDateField: null, timezone: null,
            sourceDayComparison: 'LEXICAL_INCLUSIVE', searchMatch,
          },
        },
      };
    },
  };
}
