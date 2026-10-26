import seed from '../fixtures/S09.seed.json';
import { DEFAULT_WARRANTY_QUERY, WARRANTY_BLOCKERS, type WarrantyAdapter, type WarrantyRow } from '../../contracts/warranty-cases';
import { queryTable } from '../../shared/table-query';

/** Latest Owner/Foundation decision: interact within the sourced detail set.
 * This is not a complete 186-record catalogue or a backend DTO.
 * SKU/phone fields are absent: do not infer them from product codes or PII masks.
 */
export function createWarrantyFixtureAdapter(): WarrantyAdapter {
  const f = structuredClone(seed.fixture);
  if (f.visibleRecords.length !== 7 || new Set(f.visibleRecords.map(r => r.caseCode)).size !== 7 ||
      f.total !== 186 || f.completed + f.incomplete !== f.total || f.overdueWithinIncomplete > f.incomplete ||
      f.progressPercent !== 79.6 || f.snapshot !== '2026-09-10') throw Error('S09 source integrity mismatch');
  const rows: WarrantyRow[] = f.visibleRecords.map(({ historicalAction: _historical, ...row }) => ({ ...row }));
  // Only labels actually present in this snapshot. This is not the full enum.
  const filterOptions = {
    status: [...new Set(rows.map(r => r.statusLabel.split(' · ')[0]))],
    identity: [...new Set(rows.filter(r => r.identity === 'TEMP_ONLY').map(r => r.identity))],
    due: [...new Set(rows.flatMap(r => r.statusLabel.split(' · ').slice(1)))],
  };
  return { async read(input = { ...DEFAULT_WARRANTY_QUERY }, context) {
    if (context?.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const query = structuredClone(input);
    const blocked = (reason: string, detail: string) => ({ kind: 'blocked' as const, reason, detail, query });
    if (typeof query.search !== 'string' || !['asc', 'desc'].includes(query.sort)) {
      return blocked('INVALID_QUERY', 'Query outside the assigned S09 Default contract.');
    }
    for (const field of ['status', 'identity', 'due'] as const) {
      if (query[field] !== 'all' && !filterOptions[field].includes(query[field])) {
        return blocked(WARRANTY_BLOCKERS.options, `Full ${field} options and API semantics are not supplied.`);
      }
    }
    const result = queryTable({
      source: { rows, scope: 'detail', completeness: 'complete', total: rows.length, aggregateTotal: f.total }, query,
      search: { value: query.search, fields: [row => row.caseCode, row => row.identity] },
      filters: [
        row => query.status === 'all' || row.statusLabel.split(' · ')[0] === query.status,
        row => query.identity === 'all' || row.identity === query.identity,
        row => query.due === 'all' || row.statusLabel.split(' · ').slice(1).includes(query.due),
      ],
      // Date-only projection for ordering. Never parse the opaque case code.
      sort: { type: 'date', value: row => row.receiptAndDueDate.split(' · ')[0].split('/').reverse().join('-'), direction: query.sort },
      stableId: row => row.caseCode,
    });
    if (result.kind === 'blocked') return blocked(result.reason, result.detail);
    return { kind: 'ready', model: {
      query, rows: structuredClone(result.rows), pagination: result.pagination,
      summary: { snapshot: f.snapshot, total: f.total, completed: f.completed, incomplete: f.incomplete,
        overdueWithinIncomplete: f.overdueWithinIncomplete, progressPercent: f.progressPercent },
      filterOptions: structuredClone(filterOptions),
      source: { id: 'S09-P01-r02-detail', scope: 'detail', completeness: 'complete', detailTotal: 7, aggregateTotal: 186 },
    } };
  } };
}
