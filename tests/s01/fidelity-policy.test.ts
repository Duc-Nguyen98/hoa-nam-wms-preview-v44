import assert from 'node:assert/strict';
import test from 'node:test';
import lock from '../../docs/quality/references/recovered-foundation-20261027/docs/ui-foundation/UI_FOUNDATION_LOCK.json';
import { DEFAULT_OVERVIEW_QUERY } from '../../src/contracts/overview';
import { createOverviewRuntimeController, OVERVIEW_RUNTIME_POLICY } from '../../src/controllers/overview-runtime';
import { createOverviewFixtureAdapter } from '../../src/data/adapters/overview-fixture-adapter';
import { OVERVIEW_DOCUMENT_SNAPSHOT } from '../../src/data/adapters/overview-document-fixture-adapter';
import { acceptedOverviewDocumentHref } from '../../src/features/S01/overview-document-link';
import { PAGE_SIZE_OPTIONS } from '../../src/shared/table-query';
import { createReferenceOverviewController, REFERENCE_OVERVIEW_QUERY } from './reference-scenario';

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
