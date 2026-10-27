import assert from 'node:assert/strict';
import test from 'node:test';
import lock from '../../docs/quality/references/recovered-foundation-20261027/docs/ui-foundation/UI_FOUNDATION_LOCK.json';
import { DEFAULT_OVERVIEW_QUERY, type OverviewResult, type OverviewRow } from '../../src/contracts/overview';
import { createOverviewRuntimeController, OVERVIEW_RUNTIME_POLICY } from '../../src/controllers/overview-runtime';
import { createOverviewFixtureAdapter } from '../../src/data/adapters/overview-fixture-adapter';
import { OVERVIEW_DOCUMENT_SNAPSHOT } from '../../src/data/adapters/overview-document-fixture-adapter';
import { acceptedOverviewDocumentHref } from '../../src/features/S01/overview-document-link';
import { PAGE_SIZE_OPTIONS } from '../../src/shared/table-query';
import { baselineReaders } from '../../src/preview-mock/readers';
import { decodeBusinessQuery, readPreviewDomain } from '../../src/preview-mock/domain';
import { PreviewHttpError } from '../../src/preview-mock/errors';
import { createReferenceOverviewController, createReferencePending3Adapter, createReferencePending3Controller,
  REFERENCE_OVERVIEW_QUERY, REFERENCE_PENDING3_SCENARIO } from './reference-scenario';

test('normal S01 uses locked paging and rejects the isolated four-row size', async () => {
  assert.equal(DEFAULT_OVERVIEW_QUERY.pageSize, lock.decisions.pageSize);
  assert.deepEqual(OVERVIEW_RUNTIME_POLICY.pageSizeOptions, lock.decisions.pageSizeOptions);
  assert.deepEqual(OVERVIEW_RUNTIME_POLICY.pageSizeOptions, PAGE_SIZE_OPTIONS);
  const controller = createOverviewRuntimeController();
  const result = await controller.load();
  assert.equal(result?.kind, 'ready');
  if (result?.kind !== 'ready') return;
  assert.equal(result.model.query.pageSize, 10);
  assert.equal(result.model.rows.length, 10);
  assert.equal(result.model.pagination.total, 16);
  const blocked = await controller.update({ pageSize: 4 });
  assert.equal(blocked?.kind, 'blocked');
  if (blocked?.kind === 'blocked') assert.equal(blocked.reason, 'PAGE_SIZE_UNCONFIRMED');
  assert.equal(controller.getState().model?.query.pageSize, 10);
});

test('actual browser mock S01 reader returns only locked options and rejects four rows', async () => {
  const signal = new AbortController().signal;
  const result = await baselineReaders.S01.read(DEFAULT_OVERVIEW_QUERY, signal) as OverviewResult;
  assert.equal(result.kind, 'ready');
  if (result.kind !== 'ready') return;
  assert.equal(result.model.query.pageSize, 10);
  assert.equal(result.model.rows.length, 10);
  assert.deepEqual(result.model.pagination.pageSizeOptions, lock.decisions.pageSizeOptions);
  const expected = await createOverviewFixtureAdapter(OVERVIEW_RUNTIME_POLICY).read();
  assert.deepEqual(result, expected);
  const blocked = await baselineReaders.S01.read({ ...DEFAULT_OVERVIEW_QUERY, pageSize: 4 }, signal) as OverviewResult;
  assert.equal(blocked.kind, 'blocked');
  if (blocked.kind === 'blocked') assert.equal(blocked.reason, 'PAGE_SIZE_UNCONFIRMED');
});

test('actual HTTP mock domain accepts locked S01 sizes and rejects page four before the reader', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 9, 27, 5) });
  const signal = new AbortController().signal;
  const emptyParams = new URLSearchParams();
  assert.equal((decodeBusinessQuery('S01', emptyParams).query as typeof DEFAULT_OVERVIEW_QUERY).pageSize, 10);
  for (const pageSize of lock.decisions.pageSizeOptions) {
    const url = new URL(`http://preview.local/api/v1/overview?pageSize=${pageSize}`);
    const result = await readPreviewDomain('GET', url, signal) as OverviewResult;
    assert.equal(result.kind, 'ready');
    if (result.kind === 'ready') {
      assert.equal(result.model.pagination.pageSize, pageSize);
      assert.deepEqual(result.model.pagination.pageSizeOptions, lock.decisions.pageSizeOptions);
      assert.equal(result.model.pagination.total, 16);
      assert.equal(result.model.source.provenance, 'SOURCE_FIXTURE');
    }
  }
  const isInvalidQuery = (error: unknown) => error instanceof PreviewHttpError && error.status === 400 && error.code === 'INVALID_QUERY';
  assert.throws(() => decodeBusinessQuery('S01', new URLSearchParams('pageSize=4')), isInvalidQuery);
  await assert.rejects(readPreviewDomain('GET', new URL('http://preview.local/api/v1/overview?pageSize=4'), signal), isInvalidQuery);
  await assert.rejects(readPreviewDomain('GET', new URL('http://preview.local/api/v1/overview?pageSize=4&_scenario=reference'), signal), isInvalidQuery);
});

test('isolated page four changes only paging and retains source counts, unknown and PX-0007 CTA', async () => {
  const source = await createOverviewFixtureAdapter(OVERVIEW_RUNTIME_POLICY).read();
  const controller = createReferenceOverviewController();
  const result = await controller.load();
  assert.equal(result?.kind, 'ready');
  assert.equal(source.kind, 'ready');
  if (source.kind !== 'ready' || result?.kind !== 'ready') return;
  const { model } = result;
  assert.equal(model.query.pageSize, 4);
  assert.equal(model.rows.length, 4);
  assert.deepEqual(model.rows, source.model.rows.slice(0, 4));
  assert.deepEqual(model.source, source.model.source);
  assert.deepEqual(model.summary, source.model.summary);
  assert.deepEqual(model.attention, source.model.attention);
  assert.deepEqual(model.chart, source.model.chart);
  assert.deepEqual(model.pagination, { page: 1, pageSize: 4, pageCount: 4, total: 16,
    unfilteredTotal: 16, start: 1, end: 4, pageSizeOptions: [4, 10, 15, 25, 50] });
  assert.equal(model.source.provenance, 'SOURCE_FIXTURE');
  assert.equal(model.source.snapshotId, OVERVIEW_DOCUMENT_SNAPSHOT);
  assert.equal(model.summary.inbound, 8);
  assert.equal(model.summary.outbound, 8);
  assert.equal(model.summary.openWarranties, 4);
  assert.equal(model.summary.waiting, 5);
  assert.equal(model.attention?.length, 5);
  assert.equal(model.summary.stockTotal, null);
  assert.equal(model.summary.stockDisplay, '—');
  assert.ok(model.summary.stockHelp);
  const px = model.attention!.find(row => row.id === 'p12-stock-PX-0007')!;
  assert.ok(px);
  assert.deepEqual([px.number, px.type, px.partner, px.warehouse, px.quantity, px.actor, px.timeLabel, px.status],
    ['PX-0007', 'outbound', 'Cửa hàng An Bình', 'Kho Hoa Nam', 2, 'Lan Nguyễn', '19/09/2026 · 14:35', 'waiting']);
  assert.ok(acceptedOverviewDocumentHref(px, model.source));
  const next = await controller.update({ page: 2 });
  assert.equal(next?.kind, 'ready');
  if (next?.kind === 'ready') assert.equal(next.model.pagination.start, 5);
  assert.equal(DEFAULT_OVERVIEW_QUERY.pageSize, 10);
  assert.equal(REFERENCE_OVERVIEW_QUERY.pageSize, 4);
});

test('explicit synthetic pending3 derives consistent counts and disables unverified CTA without mutating source5', async () => {
  const sourceAdapter = createOverviewFixtureAdapter(OVERVIEW_RUNTIME_POLICY);
  const fullQuery = { ...REFERENCE_OVERVIEW_QUERY, pageSize: 25 };
  const original = await sourceAdapter.read(fullQuery);
  const adapter = createReferencePending3Adapter();
  const synthetic = await adapter.read(fullQuery);
  const first = await createReferencePending3Controller().load();
  assert.equal(original.kind, 'ready');
  assert.equal(synthetic.kind, 'ready');
  assert.equal(first?.kind, 'ready');
  if (original.kind !== 'ready' || synthetic.kind !== 'ready' || first?.kind !== 'ready') return;
  const model = synthetic.model;
  assert.equal(model.rows.length, 16);
  assert.deepEqual(model.rows.map(row => row.id), original.model.rows.map(row => row.id));
  assert.equal(model.pagination.total, 16);
  assert.equal(model.summary.inbound, 8);
  assert.equal(model.summary.outbound, 8);
  assert.equal(model.summary.openWarranties, 4);
  assert.equal(model.summary.waiting, 3);
  assert.equal(model.summary.posted, 13);
  assert.equal(model.summary.stockTotal, null);
  assert.equal(model.summary.stockDisplay, '—');
  assert.equal(model.summary.stockHelp, original.model.summary.stockHelp);
  assert.equal(model.source.provenance, 'QA_SYNTHETIC');
  assert.equal(model.source.snapshotId, REFERENCE_PENDING3_SCENARIO.snapshotId);
  assert.notEqual(model.source.snapshotId, original.model.source.snapshotId);
  assert.equal(model.source.fixtureRecordCount, 16);
  assert.deepEqual(model.attention?.map(row => row.id), REFERENCE_PENDING3_SCENARIO.preservedWaitingIds);
  assert.deepEqual(model.chart, original.model.chart);
  assert.equal(first.model.rows.length, 4);
  assert.equal(first.model.pagination.pageCount, 4);
  assert.equal(first.model.pagination.total, 16);
  const changedIds: string[] = [];
  for (const row of model.rows) {
    const before: OverviewRow = original.model.rows.find(source => source.id === row.id)!;
    const mutation = REFERENCE_PENDING3_SCENARIO.mutations.find(change => change.id === row.id);
    if (mutation) {
      changedIds.push(row.id);
      assert.equal(before.status, mutation.from);
      assert.equal(row.status, mutation.to);
      assert.deepEqual(row, { ...before, status: 'posted', statusLabel: 'Đã ghi sổ' });
    } else assert.deepEqual(row, before);
    assert.equal(acceptedOverviewDocumentHref(row, model.source), null);
  }
  assert.deepEqual(changedIds.sort(), REFERENCE_PENDING3_SCENARIO.mutations.map(change => change.id).sort());
  const px = model.rows.find(row => row.id === 'p12-stock-PX-0007')!;
  assert.deepEqual(px, original.model.rows.find(row => row.id === px.id));
  assert.deepEqual([px.partner, px.quantity, px.actor, px.timeLabel, px.status],
    ['Cửa hàng An Bình', 2, 'Lan Nguyễn', '19/09/2026 · 14:35', 'waiting']);
  for (const [status, count] of [['waiting', 3], ['posted', 13]] as const) {
    const filtered = await adapter.read({ ...fullQuery, status });
    assert.equal(filtered.kind, 'ready');
    if (filtered.kind === 'ready') {
      assert.equal(filtered.model.pagination.total, count);
      assert.equal(filtered.model.rows.length, count);
      assert.equal(filtered.model.attention?.length, 3);
      assert.equal(filtered.model.summary.waiting, 3);
    }
  }
  const after = await sourceAdapter.read(fullQuery);
  assert.deepEqual(after, original);
  assert.equal(original.model.summary.waiting, 5);
  assert.ok(acceptedOverviewDocumentHref(original.model.rows.find(row => row.id === px.id)!, original.model.source));
});
