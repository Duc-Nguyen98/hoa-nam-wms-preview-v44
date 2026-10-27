import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_OVERVIEW_QUERY } from '../src/contracts/overview';
import { createOverviewFixtureAdapter } from '../src/data/adapters/overview-fixture-adapter';
import { createOverviewRuntimeController } from '../src/controllers/overview-runtime';
import { selectAcceptedOverviewRow, resolveAcceptedOverviewRow } from '../src/features/S01/overview-selection';
import { overviewCopy, OVERVIEW_COPY } from '../src/features/S01/overview-copy';
import { readFileSync } from 'node:fs';
import { REFERENCE_OVERVIEW_POLICY, REFERENCE_OVERVIEW_QUERY } from './s01/reference-scenario';

test('isolated four-row overview pages cover every result once and preserve period totals', async () => {
  const adapter = createOverviewFixtureAdapter(REFERENCE_OVERVIEW_POLICY);
  const first = await adapter.read(REFERENCE_OVERVIEW_QUERY);
  assert.equal(first.kind, 'ready');
  if (first.kind !== 'ready') return;
  assert.equal(first.model.pagination.pageSize, 4);
  const ids: string[] = [];
  for (let page = 1; page <= first.model.pagination.pageCount; page++) {
    const result = await adapter.read({ ...REFERENCE_OVERVIEW_QUERY, page });
    assert.equal(result.kind, 'ready');
    if (result.kind !== 'ready') return;
    assert.ok(result.model.rows.length <= 4);
    assert.deepEqual(result.model.summary, first.model.summary);
    ids.push(...result.model.rows.map(row => row.id));
  }
  assert.equal(ids.length, first.model.pagination.total);
  assert.equal(new Set(ids).size, ids.length);
});

test('overview source rows expose declared units and preserve inbound/outbound identity', async () => {
  const result = await createOverviewFixtureAdapter({ searchMatch: 'folded-includes', allowPeriodChange: true, pageSizeOptions: [10] }).read({ ...DEFAULT_OVERVIEW_QUERY, pageSize: 10 });
  assert.equal(result.kind, 'ready');
  if (result.kind !== 'ready') return;
  assert.equal(result.model.summary.inbound, 8);
  assert.equal(result.model.summary.outbound, 8);
  const outbound = result.model.rows.find(row => row.number === 'PX-0007');
  assert.ok(outbound);
  assert.equal(outbound?.type, 'outbound');
  assert.equal(outbound?.statusLabel, 'Chờ xử lý trên Web');
  assert.equal(outbound?.quantityUnit, 'Cái');
});

test('attention uses the accepted period, never the activity search/filter/page', async () => {
  const adapter = createOverviewFixtureAdapter({ searchMatch: 'folded-includes', allowPeriodChange: true, pageSizeOptions: [4, 10] });
  const a = await adapter.read(DEFAULT_OVERVIEW_QUERY);
  const b = await adapter.read({ ...DEFAULT_OVERVIEW_QUERY, page: 2 });
  const c = await adapter.read({ ...DEFAULT_OVERVIEW_QUERY, search: 'not-a-document', status: 'posted' });
  for (const result of [a,b,c]) assert.equal(result.kind, 'ready');
  if (a.kind !== 'ready' || b.kind !== 'ready' || c.kind !== 'ready') return;
  assert.equal(a.model.attention?.length, a.model.summary.waiting);
  assert.equal(a.model.summary.waiting, 5);
  assert.deepEqual(b.model.attention, a.model.attention);
  assert.deepEqual(c.model.attention, a.model.attention);
  assert.equal(c.model.rows.length, 0);
  assert.equal(c.model.emptyReason, 'no-matches');
  assert.equal(c.model.summary.stockTotal, null);
  const empty = await adapter.read({ ...DEFAULT_OVERVIEW_QUERY, period: { from: '2026-09-01', to: '2026-09-01' } });
  assert.equal(empty.kind, 'ready');
  if (empty.kind === 'ready') {
    assert.equal(empty.model.emptyReason, 'no-documents');
    assert.deepEqual(empty.model.attention, []);
    assert.equal(empty.model.summary.openWarranties, a.model.summary.openWarranties);
  }
});
test('exact snapshot selection rejects stale, missing, ambiguous and pending rows', async () => {
  const controller = createOverviewRuntimeController();
  await controller.load();
  const state = controller.getState();
  const id = state.model!.rows[0].id;
  const a = selectAcceptedOverviewRow(state, id)!;
  assert.ok(a);
  assert.equal(resolveAcceptedOverviewRow(a,state), state.model!.rows[0]);
  assert.equal(selectAcceptedOverviewRow(state,'absent'),null);
  assert.equal(selectAcceptedOverviewRow({...state,loading:true},id),null);
  const ambiguous = {...state, model:{...state.model!,attention:[{...a.row}]}};
  assert.equal(selectAcceptedOverviewRow(ambiguous,id),null);
  const pending = controller.update({ type:'inbound' });
  assert.equal(resolveAcceptedOverviewRow(a,controller.getState()),null);
  await pending;
  const b = selectAcceptedOverviewRow(controller.getState(),controller.getState().model!.rows[0].id);
  assert.ok(b);
  assert.equal(b.row.type,'inbound');
  assert.equal(resolveAcceptedOverviewRow(a,controller.getState()),null);
  assert.equal(resolveAcceptedOverviewRow(b,controller.getState()),b.row);
  controller.clear();
});

test('attention items remain selectable even when absent from the current table page', async () => {
  const controller = createOverviewRuntimeController();
  await controller.load({...DEFAULT_OVERVIEW_QUERY,page:2});
  const state=controller.getState();
  const attention=state.model!.attention![0];
  assert.equal(state.model!.rows.some(row=>row.id===attention.id),false);
  assert.equal(selectAcceptedOverviewRow(state,attention.id)?.row,attention);
  controller.clear();
});

test('all S01 literal UI copy has EN and ZH translations without touching source data', () => {
  for (const [vi,[en,zh]] of Object.entries(OVERVIEW_COPY)) {
    assert.equal(overviewCopy(vi,'en'),en);
    assert.equal(overviewCopy(vi,'zh-CN'),zh);
  }
  for (const file of ['OverviewScreen.tsx','AcceptedRowDetail.tsx']) {
    const text=readFileSync(new URL(`../src/features/S01/${file}`,import.meta.url),'utf8');
    const keys=[...text.matchAll(/tx\(["']([^"']+)["']/g)].map(m=>m[1]);
    for (const key of keys) if(key !== 'ID') for(const language of ['en','zh-CN'] as const) assert.notEqual(overviewCopy(key,language),key,`${file}: ${language}: ${key}`);
  }
  assert.equal(overviewCopy('PN-0009','zh-CN'),'PN-0009');
});
