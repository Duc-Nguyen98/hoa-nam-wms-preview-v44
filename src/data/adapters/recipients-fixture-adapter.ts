import fixtures from '../fixtures/DESIGN_FIXTURE_SNAPSHOT.json';
import contracts from '../fixtures/SCREEN_CONTRACTS.seed.json';
import { DEFAULT_RECIPIENTS_QUERY, RECIPIENT_SORT_KEYS } from '../../contracts/recipients';
import type { RecipientRow, RecipientsDataAdapter, RecipientsModel, RecipientsQuery, RecipientsResult } from '../../contracts/recipients';
import { queryTable } from '../../shared/table-query';
import { SCREEN_FOUNDATION, screenSearch, screenSort } from '../../shared/screen-foundation';

const fixture = fixtures.screens.find(s => s.screen_id === 'S05')!;
const contract = contracts.screens.find(s => s.screen_id === 'S05')!;
export function recipientSourceRows(): RecipientRow[] {
  if (fixture.provenance !== 'PROPOSED_FIXTURE' || fixture.record_rows_included !== 5 || fixture.aggregate_total !== 27 || contract.visual.implementation_reference_revision !== 'P01_r02') throw Error('S05 source revision/completeness changed');
  const rows = fixture.record_rows!.map(source => {
    const row = source as Record<string,string>;
    if (['Mã','Tên nơi nhận','Loại nơi nhận','Thị trường','Khu vực','Người liên hệ','Điện thoại','Địa chỉ','Trạng thái'].some(k => typeof row[k] !== 'string')) throw Error('S05 field missing or not text');
    if (!['Đang sử dụng','Ngừng sử dụng'].includes(row['Trạng thái'])) throw Error('S05 status mapping unconfirmed');
    return { key: row['Mã'], code: row['Mã'], name: row['Tên nơi nhận'], type: row['Loại nơi nhận'], market: row['Thị trường'], area: row['Khu vực'], contact: row['Người liên hệ'], phone: row['Điện thoại'], address: row['Địa chỉ'], status: row['Trạng thái'] === 'Đang sử dụng' ? 'active' : 'inactive', statusLabel: row['Trạng thái'] } as RecipientRow;
  });
  if (rows.length !== 5 || new Set(rows.map(r => r.key)).size !== 5) throw Error('S05 row count or render identity invalid');
  return rows;
}
/** QA input is dependency injection from the DEV harness only, never a product URL switch. */
export function createRecipientsFixtureAdapter(qaRows?: readonly RecipientRow[], acceptedRows?: readonly RecipientRow[]): RecipientsDataAdapter {
  const referenceRows = recipientSourceRows();
  if (acceptedRows && (qaRows || acceptedRows.length !== referenceRows.length || new Set(acceptedRows.map(r => r.key)).size !== referenceRows.length
    || acceptedRows.some(row => {
      const original = referenceRows.find(r => r.key === row.key);
      return !original || Object.keys(original).some(key => !['name', 'contact', 'phone'].includes(key) && row[key as keyof RecipientRow] !== original[key as keyof RecipientRow])
        || !['name', 'contact', 'phone'].every(key => typeof row[key as keyof RecipientRow] === 'string');
    }))) throw Error('S05 accepted source identity or immutable fields changed');
  const rows = structuredClone(qaRows ? [...qaRows] : acceptedRows ? [...acceptedRows] : referenceRows);
  const observedTypes = [...new Set(referenceRows.map(row => row.type))];
  if (qaRows && (rows.length !== 60 || new Set(rows.map(row => row.key)).size !== 60 || new Set(rows.map(row => row.code)).size !== 60 || rows.some(row => !observedTypes.includes(row.type) || !['active','inactive'].includes(row.status)))) throw Error('S05 QA scenario must contain 60 unique rows using existing enums');
  return { async read(input = DEFAULT_RECIPIENTS_QUERY, scenario = 'default') {
    const query = structuredClone(input);
    const missing = (reason: Extract<RecipientsResult,{kind:'missing-fixture'}>['reason'], detail: string): RecipientsResult => ({kind:'missing-fixture',reason,detail,query,evidence:'BLOCKED_MISSING_FIXTURE'});
    const blocked = (reason: Extract<RecipientsResult,{kind:'blocked'}>['reason'], detail: string): RecipientsResult => ({kind:'blocked',reason,detail,query});
    if (scenario !== 'default') return missing('STATE_NOT_SUPPLIED','Only S05 Default has a supplied design; no other state is approved for this task.');
    if (typeof query.search !== 'string' || typeof query.type !== 'string' || !['all','active','inactive'].includes(query.status)) return blocked('INVALID_QUERY','Query outside the frontend source contract.');
    if (query.type !== 'all' && !observedTypes.includes(query.type)) return blocked('INVALID_QUERY','Recipient type is outside supplied choices.');
    if (query.sort !== null && (!query.sort || !RECIPIENT_SORT_KEYS.includes(query.sort.key) || !['asc','desc'].includes(query.sort.direction))) return blocked('INVALID_QUERY','Unsupported S05 sort key or direction.');
    const sort = query.sort;
    const summary = fixture.summary as {recipients_total:number; audit_snapshot_date:string; static_labels:string[]; status_counts:null};
    const result = queryTable({
      // Complete for the explicitly approved detail scope, never for the catalogue of 27.
      source: { rows, total: rows.length, completeness: 'complete', scope: 'detail', aggregateTotal: summary.recipients_total }, query,
      search: screenSearch(SCREEN_FOUNDATION.S05, query.search),
      filters: [row => query.type === 'all' || row.type === query.type, row => query.status === 'all' || row.status === query.status],
      sort: screenSort(SCREEN_FOUNDATION.S05, sort?.key ?? null, sort?.direction ?? null),
      stableId: row => row.key,
    });
    if (result.kind !== 'ready') return blocked(result.reason === 'PAGE_OUT_OF_RANGE' ? 'PAGE_OUT_OF_RANGE' : 'INVALID_QUERY', result.detail);
    const model: RecipientsModel = {
      query, rows: structuredClone(result.rows),
      summary: {total:summary.recipients_total,staticLabels:[...summary.static_labels],scope:'catalogue-audit-snapshot',auditDate:summary.audit_snapshot_date,statusCounts:null},
      pagination: {...result.pagination},
      filterOptions: {observedTypes:[...observedTypes]}, detailCompleteness:'PARTIAL_ROWS_ONLY',
      source: {id:qaRows?'S05-QA60':'S05-source-detail',scope:'detail',completeness:'complete',detailTotal:rows.length,aggregateTotal:summary.recipients_total,contractId:contracts.package_id,fixtureVersion:'HN_WMS_5_MAN_UI_TINH_r2_2026-10-08',referenceRevision:'P01_r02',referenceSnapshot:fixture.source_snapshot,rowProvenance:qaRows?'QA_SYNTHETIC':'PROPOSED_FIXTURE',totalProvenance:'SOURCE_FIXTURE',recordCount:rows.length,queryScope:qaRows?'qa-60':'supplied-detail-records',catalogueComplete:false,defaultPageComplete:true,isLiveData:false,productionMatchVerified:false,backendMapping:null,endpoint:null,permissionKeys:null,enumMapping:null,recipientIdMapping:null,geographyMapping:'BLOCKED_BY_SOURCE_CONFLICT',searchMatch:'substring-normalized-vi',sortKey:sort?.key??null,summaryAfterFilter:'unchanged-catalogue-audit'},
    };
    return {kind:'ready',model};
  }};
}
