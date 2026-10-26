import { useEffect, useMemo, useState } from 'react';
import type { CatalogSnapshot } from '../contracts/catalog-create';
import type { OperationalSnapshot } from '../contracts/operational-preview';
import { createCatalogCreateAdapter } from '../data/http/catalog-create-adapter';
import { Button } from '../shared';
import {
  INACTIVE_MASTER_ALLOWLIST,
  INACTIVE_MASTER_SCOPE,
} from '../preview-mock/inactive-master-allowlist';
import { inactiveMasterStateKnown, inactiveMasterTarget, isInactiveMasterCatalogFresh } from '../preview-mock/operational-outcome';
import { parseQaDataset, QA_DATASET_P05 } from '../preview-mock/qa-dataset';
import { inactiveMasterProjectionScope, sameInactiveScope } from '../preview-mock/inactive-master-scope';

type InactiveStatus = 'active' | 'inactive';
type InactiveCommandName = 'qa.product.set-status' | 'qa.sku.set-status' | 'qa.recipient.set-status';
type InactivePayload = { confirmed: true; status: InactiveStatus };

type InactiveOperations = {
  snapshot: OperationalSnapshot | null;
  busy: boolean;
  pending: boolean;
  controller: {
    execute(command: InactiveCommandName, payload: InactivePayload, entityId?: string, expectedVersion?: number): Promise<unknown>;
  };
};

type CatalogRow = CatalogSnapshot['products'][number] | CatalogSnapshot['skus'][number] | CatalogSnapshot['recipients'][number];
type Entry = (typeof INACTIVE_MASTER_ALLOWLIST)[number];

const KINDS = ['catalog-product-v1', 'catalog-sku-v1', 'recipient-master-v1'] as const;

function commandName(entry: Entry): InactiveCommandName | null {
  return entry.command === 'qa.product.set-status' || entry.command === 'qa.sku.set-status' || entry.command === 'qa.recipient.set-status'
    ? entry.command : null;
}

function catalogRows(catalog: CatalogSnapshot): Array<{ kind: string; row: CatalogRow }> {
  return [
    ...catalog.products.map(row => ({ kind: 'catalog-product-v1', row })),
    ...catalog.skus.map(row => ({ kind: 'catalog-sku-v1', row })),
    ...catalog.recipients.map(row => ({ kind: 'recipient-master-v1', row })),
  ];
}

function scopeMatches(snapshot: OperationalSnapshot | null, dataset: string | null): boolean {
  const setup = snapshot ? inactiveMasterProjectionScope(snapshot) : null;
  return dataset === QA_DATASET_P05 && !!snapshot
    && snapshot.actorKey === INACTIVE_MASTER_SCOPE.actorKey
    && snapshot.epoch === INACTIVE_MASTER_SCOPE.epoch
    && !!snapshot.scenario && snapshot.scenario.data.status === 'ACTIVE'
    && (sameInactiveScope(snapshot.token, INACTIVE_MASTER_SCOPE) || !!setup && sameInactiveScope(snapshot.token, setup));
}

function statusText(status: InactiveStatus, en: boolean) {
  return status === 'active' ? (en ? 'active' : 'đang hoạt động') : (en ? 'inactive' : 'ngừng hoạt động');
}

/**
 * Narrow QA-only status control for the three disposable masters bound to the
 * p05-v1 packet. It deliberately has no target input or generic patch path:
 * rows and command names come from the immutable allowlist, and the controller
 * remains the page's existing durable recovery boundary.
 */
export function InactiveMasterQa({ operations, en }: { operations: InactiveOperations; en: boolean }) {
  const dataset = parseQaDataset(typeof window === 'undefined' ? '' : window.location.search);
  const scoped = scopeMatches(operations.snapshot, dataset);
  const catalogAdapter = useMemo(() => createCatalogCreateAdapter('sku'), []);
  const [catalog, setCatalog] = useState<CatalogSnapshot | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!scoped) {
      setCatalog(null);
      setCatalogError('');
      setConfirmed(false);
      return () => { alive = false; };
    }
    setCatalog(null);
    setConfirmed(false);
    setCatalogError('');
    void catalogAdapter.readSnapshot().then(value => {
      if (!alive) return;
      setCatalog(value);
    }).catch(error => {
      if (!alive) return;
      setCatalog(null);
      setCatalogError((error as { code?: string })?.code ?? 'CATALOG_READ_REQUIRED');
    });
    return () => { alive = false; };
  }, [catalogAdapter, scoped, operations.snapshot?.snapshotRevision]);

  // Do not expose even a disabled status surface outside the exact approved
  // dataset and generation. The normal QA page remains available there.
  if (!scoped) return null;

  const rows = catalog ? catalogRows(catalog) : [];
  const allowlistShape = INACTIVE_MASTER_ALLOWLIST.length === 3
    && INACTIVE_MASTER_ALLOWLIST.every(entry => KINDS.includes(entry.kind as (typeof KINDS)[number]) && !!commandName(entry))
    && new Set(INACTIVE_MASTER_ALLOWLIST.map(entry => entry.entityId)).size === 3;
  const items = INACTIVE_MASTER_ALLOWLIST.map(entry => {
    const hit = rows.find(candidate => candidate.kind === entry.kind && candidate.row.id === entry.entityId);
    const row = hit?.row;
    const value = row as (CatalogRow & { status?: unknown; version?: unknown; code?: unknown; name?: unknown }) | undefined;
    const status = value?.status === 'active' || value?.status === 'inactive' ? value.status : null;
    const version = Number.isSafeInteger(value?.version) ? Number(value?.version) : null;
    const target = inactiveMasterTarget(version, status);
    const command = commandName(entry);
    return { entry, row: value, status, version, target, command, code: typeof value?.code === 'string' ? value.code : entry.entityId, name: typeof value?.name === 'string' ? value.name : entry.kind };
  });
  const catalogFresh = isInactiveMasterCatalogFresh(catalog, operations.snapshot);
  const ready = allowlistShape && catalogFresh && !catalogError && items.every(item => item.row && item.status && item.version !== null && inactiveMasterStateKnown(item.version, item.status) && item.command);
  const disabled = operations.busy || operations.pending || !confirmed || !ready;

  async function setStatus(item: (typeof items)[number]) {
    if (disabled || !item.target || !item.command || !item.version) return;
    await operations.controller.execute(item.command, { confirmed: true, status: item.target }, item.entry.entityId, item.version);
    setConfirmed(false);
  }

  return <section data-qa-inactive-master="p05-v1" aria-busy={operations.busy}>
    <h2>{en ? 'Inactive-master QA (p05-v1)' : 'QA master ngừng hoạt động (p05-v1)'}</h2>
    <p>{en
      ? 'Bound QA only: these three disposable masters may move active → inactive → active. No other catalogue record is selectable.'
      : 'Chỉ QA được giới hạn: ba master tạm này được chuyển đang hoạt động → ngừng hoạt động → đang hoạt động. Không chọn bản ghi khác.'}</p>
    {catalogError && <p role="alert">{en ? 'Read the current catalogue before running this QA.' : 'Đọc danh mục hiện tại trước khi chạy QA.'} <code>{catalogError}</code></p>}
    {!catalogFresh && !catalogError && <p role="status">{en ? 'Waiting for a fresh matching p05-v1 catalogue snapshot.' : 'Đang chờ snapshot danh mục mới đúng p05-v1.'}</p>}
    <div role="list" aria-label={en ? 'Bound inactive masters' : 'Master được giới hạn'}>
      {items.map(item => <div role="listitem" key={item.entry.entityId} data-qa-entity-id={item.entry.entityId}>
        <strong>{item.code}</strong> · {item.name} · <code>{item.entry.kind}</code>
        <span> · v{item.version ?? '?'} · {item.status ? statusText(item.status, en) : (en ? 'unknown' : 'chưa xác định')}</span>
        <Button
          data-qa-inactive-master-action={item.entry.entityId}
          disabled={disabled || !item.target}
          onClick={() => { void setStatus(item); }}
        >{item.target === 'inactive' ? (en ? 'Set inactive' : 'Đặt ngừng hoạt động') : item.target === 'active' ? (en ? 'Restore active' : 'Khôi phục hoạt động') : (en ? 'Unavailable' : 'Không khả dụng')}</Button>
      </div>)}
    </div>
    <label><input data-qa-inactive-master-confirm type="checkbox" checked={confirmed} disabled={operations.busy || operations.pending || !ready} onChange={event => setConfirmed(event.target.checked)} />
      {en ? 'I confirm this exact bounded QA request and its possible status write.' : 'Tôi xác nhận đúng yêu cầu QA giới hạn này và khả năng ghi trạng thái.'}</label>
    {!ready && <p role="status">{en ? 'Controls stay disabled until all three allowlisted rows have a fresh, expected version and status.' : 'Các nút vẫn tắt đến khi cả ba dòng trong allowlist có phiên bản và trạng thái mới đúng dự kiến.'}</p>}
  </section>;
}
