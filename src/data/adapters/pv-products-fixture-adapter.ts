import source from '../fixtures/S06.seed.json';
import { DEFAULT_PV_QUERY, PV_SORT_KEYS, type PvDataAdapter, type PvDataset, type PvQuery, type PvResult } from '../../contracts/pv-products';
import { queryTable } from '../../shared/table-query';
import { comparePvProducts } from '../pv-page-sort';

function unavailable(query: PvQuery, kind: 'blocked' | 'missing-fixture', reason: Exclude<PvResult, { kind: 'ready' }>['reason'], detail: string): PvResult {
  return { kind, reason, detail, query };
}

export function pvSourceDataset(): PvDataset {
  const { fixture, completeness } = source;
  if (fixture.aggregate.total !== fixture.aggregate.visible + fixture.aggregate.hidden || fixture.rows.length !== completeness.provided_detail_records) throw new Error('S06 fixture source integrity mismatch.');
  const rows = fixture.rows.map(values => {
    if (values.length !== fixture.fields.length || values.some(value => typeof value !== 'string')) throw new Error('Invalid S06 source fields.');
    const [productName, productCode, sku, productGroup, visibilityLabel, updatedAtLabel] = values;
    return { key: productCode, productName, productCode, sku, productGroup, visibilityLabel, updatedAtLabel, missingImage: productCode === fixture.missingImageProduct, thumbnailUrl: null };
  });
  return { rows, summary: { ...fixture.aggregate }, kind: 'source-detail' };
}

const foldSearch = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim().replace(/\s+/g, ' ');

/** Owner decision 2026-10-10: complete detail scope, never the 128-record catalogue. */
export function createPvFixtureAdapter(dataset: PvDataset = pvSourceDataset()): PvDataAdapter {
  const snapshot = structuredClone(dataset);
  if (new Set(snapshot.rows.map(row => row.key)).size !== snapshot.rows.length) throw new Error('Duplicate S06 source keys.');
  const groups = [...new Set(snapshot.rows.map(row => row.productGroup))];
  const visibility = [...new Set(snapshot.rows.map(row => row.visibilityLabel))];
  return { async read(input = { ...DEFAULT_PV_QUERY }, scenario = 'default') {
    const query = structuredClone(input);
    if (scenario !== 'default') return unavailable(query, 'missing-fixture', 'STATE_NOT_SUPPLIED', 'Only assigned Default interactions are supplied.');
    if (typeof query.search !== 'string' || typeof query.group !== 'string' || typeof query.visibility !== 'string' || !PV_SORT_KEYS.includes(query.sortKey) || !['asc', 'desc'].includes(query.sort) ||
      (query.group !== 'all' && !groups.includes(query.group)) || (query.visibility !== 'all' && !visibility.includes(query.visibility))) return unavailable(query, 'blocked', 'INVALID_QUERY', 'Invalid frontend preview query or unknown source option.');
    const needle = foldSearch(query.search);
    const result = queryTable({
      source: { rows: snapshot.rows, completeness: 'complete', total: snapshot.rows.length }, query,
      filter: row => (query.group === 'all' || row.productGroup === query.group) &&
        (query.visibility === 'all' || row.visibilityLabel === query.visibility) &&
        [row.productName, row.productCode, row.sku].some(value => foldSearch(value).includes(needle)),
      compare: (left, right) => comparePvProducts(query.sortKey, left, right), direction: query.sort,
    });
    if (result.kind !== 'ready') return unavailable(query, 'blocked', result.reason, result.detail);
    return { kind: 'ready', model: {
      query, rows: structuredClone(result.rows), summary: { ...snapshot.summary }, pagination: result.pagination,
      scope: { kind: snapshot.kind, total: snapshot.rows.length },
      filterOptions: { groups: [...groups], visibility: [...visibility] },
      profile: { displayName: 'Đức Quang', initials: 'DQ' },
    } };
  } };
}
