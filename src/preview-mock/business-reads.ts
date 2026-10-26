import { partsHandlers } from './parts-policy';
import { inactiveMasterHandlers, validateInactiveMasterHistory } from './inactive-master-policy';
import { reversalHandlers } from './reversal-policy';
import { linkedDocumentHandlers } from './linked-document-policy';
import { outboundHandlers } from './outbound-policy';
import { putawayHandlers } from './putaway-policy';
import { inboundHandlers } from './inbound-policy';
import { foundationHandlers, OPERATIONAL_ACTOR, OPERATIONAL_SURFACES } from './operational-policy';
import { createOperationalService } from './operational-service';
import type { OperationalSurface, OperationalCommandName } from '../contracts/operational-preview';
import { createDefectsFixtureAdapter } from '../data/adapters/defects-fixture-adapter';
import { queryDefectsRows } from '../data/adapters/defects-query';
import { DEFAULT_DEFECTS_QUERY, DEFECTS_PAGE_SIZE_OPTIONS, type DefectRow, type DefectsQuery, type DefectsResult } from '../contracts/defects';
import type { WarehouseRead, WarehouseSnapshot } from '../contracts/warehouse-config';
import { localWarehouseRead } from './admin-data';
import { createBusinessRepository, type BusinessCommand, type BusinessRepository, type BusinessRepositoryOptions, type BusinessSnapshot, type BusinessSeed, type BusinessRecord } from './business-repository';
import type { BusinessPersistence } from './business-persistence';
import { PreviewHttpError } from './errors';
import { createWarehouseCommandSeam } from '../features/S28/warehouse-command';
import labelSeed from '../data/fixtures/S23.seed.json';
import type { LabelReportQuery, LabelReportRow } from '../contracts/label-report';
import { createLabelReportRowsAdapter } from '../data/adapters/label-report-fixture-adapter';
import { isLabelPrintData } from '../features/S23/label-print-command';
import { createRecipientsFixtureAdapter } from '../data/adapters/recipients-fixture-adapter';
import type { RecipientsQuery } from '../contracts/recipients';
import { isRecipientContactRecord, RECIPIENT_SOURCE_ROWS, authorizeRecipientContact } from './recipient-contact-policy';
import { projectCatalogSnapshot } from './catalog-policy';
import { projectPvDemoSnapshot, validatePvDemoHistory, normalizePvPayload } from './pv-demo-policy';
import type { PutawayHistoryAction, PutawayHistoryQuery, PutawayHistoryResult, PutawayHistoryRow } from '../contracts/putaway-history';

export const LABEL_REPORT_ENTITY_ID = 'seed:label-report:S23:2026-09-04:2026-09-10';

const seedAdapter = createDefectsFixtureAdapter({ searchMatch: 'folded-includes' });
const invalid = () => new PreviewHttpError(503, 'MOCK_STATE_INVALID', 'Không thể đọc dữ liệu xem trước đã lưu.');
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
function defect(value: unknown): value is DefectRow {
  return object(value) && ['key', 'ordinal', 'code', 'name', 'description', 'statusLabel'].every(k => typeof value[k] === 'string') && ['active', 'inactive'].includes(String(value.status));
}
function warehouse(value: unknown): value is WarehouseSnapshot {
  return object(value) && ['id', 'code', 'name', 'address', 'contact_person', 'phone'].every(k => typeof value[k] === 'string') && ['ACTIVE', 'INACTIVE'].includes(String(value.status));
}

/** Explicit host binding; no role-label or request-body permission inference. */
export type PreviewBusinessCommandBinding = Required<Pick<BusinessRepositoryOptions, 'actor' | 'authorize'>> & {
  captureReadFence?: () => () => void;
  operationalEnabled?: boolean;
  /** Explicit capability for the S14 History subroute. Never inferred from a role label or request. */
  putawayHistoryRead?: boolean;
  /** Host opt-in for the exact approved isolated QA dataset only. */
  inactiveMasterQaEnabled?: boolean;
  defectsHandlers?: Partial<Pick<NonNullable<BusinessRepositoryOptions['handlers']>, 'defects.create' | 'defects.update'>>;
  labelHandlers?: Partial<Pick<NonNullable<BusinessRepositoryOptions['handlers']>, 'labels.reprint' | 'labels.retry'>>;
  recipientHandlers?: Partial<Pick<NonNullable<BusinessRepositoryOptions['handlers']>, 'recipients.update-contact'>>;
  catalogHandlers?: Readonly<Record<string, import('./business-repository').BusinessHandler>>;
  pvHandlers?: Readonly<Record<string, import('./business-repository').BusinessHandler>>;
};

/** One seeded repository for reads and commands; no inferred role grants or independent UI fixture writes. */
export function createPreviewBusinessReads(persistence: BusinessPersistence, binding?: PreviewBusinessCommandBinding, options: { now?: () => number } = {}) {
  const businessNow = options.now ?? Date.now;
  let ready: Promise<{ repository: BusinessRepository; source: Extract<DefectsResult, { kind: 'ready' }>['model']['source']; operationalRepository: (surface: OperationalSurface) => BusinessRepository }> | undefined;
  function prepare() {
    return ready ??= (async () => {
      const result = await seedAdapter.read(DEFAULT_DEFECTS_QUERY);
      if (result.kind !== 'ready' || result.model.rows.length !== result.model.summary.total || localWarehouseRead.kind !== 'available') throw invalid();
      const warehouseSeam = createWarehouseCommandSeam();
      const handlers = { ...warehouseSeam.handlers, ...binding?.defectsHandlers, ...binding?.labelHandlers, ...binding?.recipientHandlers, ...binding?.catalogHandlers, ...binding?.pvHandlers };
      const previousSeed: BusinessSeed = { id: 'S02_SOURCE_2026-10-08_S28_OWNER_SELECTED_V1', records: [
        ...result.model.rows.map(row => ({ id: `seed:defect:${row.key}`, kind: 'defect', data: row })),
        { id: localWarehouseRead.snapshot.id, kind: 'warehouse', data: localWarehouseRead.snapshot },
      ] };
      const previousLabelSeed: BusinessSeed = {
        id: 'S02_S28_S23_XN11_V2',
        records: [
          ...previousSeed.records,
          { id: LABEL_REPORT_ENTITY_ID, kind: 'label-report', data: {
            period: labelSeed.period, rows: labelSeed.rows as LabelReportRow[], summary: labelSeed.summary,
          } },
        ],
      };
      const repositoryOptions: BusinessRepositoryOptions = { persistence, handlers, actor: binding?.actor, now: businessNow,
        validateCanonicalState: (snapshot, lookup) => { validateInactiveMasterHistory(snapshot, lookup); validatePvDemoHistory(snapshot, lookup); },
        captureAuthorityFence: binding?.captureReadFence,
        authorize: (actor, command) => binding?.authorize(actor, command) === true, previousSeeds: [previousSeed], seed: previousLabelSeed,
        recordExtension: {
          records: RECIPIENT_SOURCE_ROWS.map(row => ({ id: `s05:${row.key}`, kind: 'recipient', data: { provenance: 'accepted-source-detail', row } })),
          validateRecord: isRecipientContactRecord,
        } };
      const repository = createBusinessRepository(repositoryOptions);
      const operations = new Map<OperationalSurface, BusinessRepository>();
      function operationalRepository(surface: OperationalSurface) {
        let repo = operations.get(surface);
        if (!repo) {
          repo = createBusinessRepository({ ...repositoryOptions, handlers: { ...foundationHandlers(surface), ...inboundHandlers(surface), ...putawayHandlers(surface), ...linkedDocumentHandlers(surface), ...outboundHandlers(surface), ...partsHandlers(surface), ...reversalHandlers(surface), ...inactiveMasterHandlers(surface, binding?.inactiveMasterQaEnabled === true) },
            authorize: (actor, command) => binding?.operationalEnabled === true && actor.key === OPERATIONAL_ACTOR && actor.confirmed && OPERATIONAL_SURFACES[command.command as OperationalCommandName] === surface });
          operations.set(surface, repo);
        }
        return repo;
      }
      return { repository, source: result.model.source, operationalRepository };
    })().catch(error => { ready = undefined; throw error; });
  }
  async function readSnapshot(signal?: AbortSignal): Promise<BusinessSnapshot> {
    return (await prepare()).repository.read(signal);
  }
  async function readPutawayHistory(query: PutawayHistoryQuery, signal?: AbortSignal): Promise<PutawayHistoryResult> {
    const deny = () => new PreviewHttpError(403, 'PUTAWAY_HISTORY_FORBIDDEN', 'Tài khoản chưa được cấp quyền xem lịch sử xếp khay.');
    if (!binding?.putawayHistoryRead) throw deny();
    const service = createOperationalService('WEB', async () => (await prepare()).operationalRepository('WEB'),
      { actor: binding.actor, captureAuthorityFence: binding.captureReadFence }, binding.operationalEnabled === true);
    const snapshot = await service.read(signal);
    const scenarioStart = snapshot.scenario?.data.startedAt.slice(0, 10) ?? new Date(businessNow()).toISOString().slice(0, 10);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(businessNow()));
    const from = query.from || scenarioStart, to = query.to || today;
    if (!['', 'putaway.create', 'putaway.confirm', 'putaway.cancel'].includes(query.action) || !Number.isSafeInteger(query.page) || query.page < 1 || ![9, 18, 25, 50].includes(query.pageSize)) {
      throw new PreviewHttpError(400, 'INVALID_QUERY', 'Điều kiện lịch sử xếp khay không hợp lệ.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to || to > today
      || Date.parse(to + 'T00:00:00+07:00') - Date.parse(from + 'T00:00:00+07:00') > 90 * 86400000) {
      throw new PreviewHttpError(422, 'INVALID_PERIOD', 'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.');
    }
    const records = new Map(snapshot.putaways.map(row => [row.id, row]));
    const boxes = new Map(snapshot.boxes.map(row => [row.id, row]));
    const trays = new Map(snapshot.setupMasters.filter(row => row.kind === 'operational-setup-tray').map(row => [row.id, row]));
    const rows = snapshot.auditEvents.flatMap((audit): PutawayHistoryRow[] => {
      const data = audit.data as Record<string, unknown>, action = data.action as PutawayHistoryAction;
      if (!['putaway.create', 'putaway.confirm', 'putaway.cancel'].includes(action)) return [];
      const putaway = records.get(String(data.entityId)); if (!putaway) return [];
      const box = boxes.get(putaway.data.boxId); if (!box) return [];
      const timestamp = String(data.timestamp ?? data.committedAt ?? putaway.data.updatedAt);
      if (timestamp.slice(0, 10) < from || timestamp.slice(0, 10) > to) return [];
      const boxCode = box.data.physicalCode, tray = putaway.data.trayId ? trays.get(putaway.data.trayId) : undefined;
      const trayData = tray?.data as { code?: string } | undefined;
      return [{ id: audit.id, timestamp, action: action as Exclude<PutawayHistoryAction, ''>, orderId: putaway.id,
        orderCode: `XK-${boxCode.slice(-4)}`, boxId: box.id, boxCode, trayId: putaway.data.trayId,
        trayCode: trayData?.code ?? null, actor: String(data.actor ?? putaway.data.updatedBy), result: 'SUCCESS' }];
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const search = query.search.trim().toLocaleLowerCase('vi-VN'), action = query.action;
    const filtered = rows.filter(row => (!action || row.action === action) && (!search || [row.orderCode, row.boxCode, row.trayCode ?? '', row.actor].join(' ').toLocaleLowerCase('vi-VN').includes(search)));
    const page = query.page, pageSize = query.pageSize;
    return { rows: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, scopeTotal: rows.length, page, pageSize,
      query: { ...query, from, to, search: query.search.trim(), action, page, pageSize } };
  }
  return {
    readSnapshot,
    readPutawayHistory,
    operational(surface: OperationalSurface) {
      const service = createOperationalService(surface, async () => (await prepare()).operationalRepository(surface),
        { actor: binding?.actor, captureAuthorityFence: binding?.captureReadFence }, binding?.operationalEnabled === true);
      if (binding?.putawayHistoryRead !== false) return service;
      // A broad operational snapshot remains usable for S11/S13/S14, but it
      // cannot become a history side channel when the explicit history grant is absent.
      return { ...service, async read(signal?: AbortSignal) {
        const snapshot = await service.read(signal);
        const putawayAuditIds = new Set(snapshot.auditEvents.filter(record => String((record.data as Record<string, unknown>).action ?? '').startsWith('putaway.')).map(record => record.id));
        const isPutawayProof = (record: BusinessRecord) => {
          if (record.kind !== 'commit-snapshot') return false;
          const changes = ((record.data as { changes?: { canonicalRecord?: string }[] }).changes ?? []);
          return changes.some(change => { try { const value = JSON.parse(change.canonicalRecord ?? '{}') as BusinessRecord; return value.kind === 'putaway' || (value.kind === 'audit-event' && putawayAuditIds.has(value.id)); } catch { return false; } });
        };
        return { ...snapshot, auditEvents: snapshot.auditEvents.filter(record => !putawayAuditIds.has(record.id)),
          commitSnapshots: snapshot.commitSnapshots.filter(record => !isPutawayProof(record)), archivedCommitSnapshots: snapshot.archivedCommitSnapshots.filter(record => !isPutawayProof(record)) };
      } };
    },
    async executeCommand(command: BusinessCommand, signal?: AbortSignal) {
      // Absence of a business-policy binding is not a session-expiry event.
      if (!binding || typeof binding.actor !== 'function' || typeof binding.authorize !== 'function') {
        throw new PreviewHttpError(403, 'COMMAND_UNAVAILABLE', 'Luồng lưu chưa khả dụng.');
      }
      if (command.command !== 'warehouse.update' && !binding.defectsHandlers?.[command.command as 'defects.create' | 'defects.update']
        && !binding.labelHandlers?.[command.command as 'labels.reprint' | 'labels.retry']
        && !binding.recipientHandlers?.[command.command as 'recipients.update-contact'] && !binding.catalogHandlers?.[command.command] && !binding.pvHandlers?.[command.command]) {
        throw new PreviewHttpError(403, 'COMMAND_UNAVAILABLE', 'Luồng lưu chưa khả dụng.');
      }
      const request = command.command === 'pv-products.create' || command.command === 'pv-products.update'
        ? { ...command, payload: normalizePvPayload(command.command, command.payload) } : command;
      return (await prepare()).repository.execute(request, signal);
    },
    async readPvDemoSnapshot(signal?: AbortSignal) {
      const deny = () => new PreviewHttpError(403, 'MOCK_COMMAND_FORBIDDEN', 'PV Demo chưa khả dụng.');
      if (!binding?.captureReadFence || !binding.pvHandlers) throw deny();
      const assertCurrent = binding.captureReadFence(), actor = await binding.actor();
      if (!actor || actor.key !== 'preview:ducquang' || !actor.confirmed || actor.expiresAt <= businessNow()) throw deny();
      const snapshot = await readSnapshot(signal), view = projectPvDemoSnapshot(snapshot);
      const after = await binding.actor(), latest = await readSnapshot(signal);
      assertCurrent();
      if (!after || after.key !== actor.key || !after.confirmed || after.expiresAt <= businessNow() || latest.epoch !== snapshot.epoch) throw deny();
      return view;
    },
    async readCatalogSnapshot(signal?: AbortSignal) {
      const deny = () => new PreviewHttpError(403, 'MOCK_COMMAND_FORBIDDEN', 'Hồ sơ tạo mới chưa khả dụng.');
      if (!binding?.captureReadFence || !binding.catalogHandlers) throw deny();
      const assertCurrent = binding.captureReadFence(), actor = await binding.actor();
      if (!actor || actor.key !== 'preview:ducquang' || !actor.confirmed || actor.expiresAt <= businessNow()) throw deny();
      const snapshot = await readSnapshot(signal);
      const view = projectCatalogSnapshot(snapshot);
      const after = await binding.actor(), latest = await readSnapshot(signal);
      assertCurrent();
      if (!after || after.key !== actor.key || !after.confirmed || after.expiresAt <= businessNow() || latest.epoch !== snapshot.epoch) throw deny();
      return view;
    },
    async readRecipientContext(rowKey: string, signal?: AbortSignal) {
      const deny = () => new PreviewHttpError(403, 'MOCK_COMMAND_FORBIDDEN', 'Quyền sửa không khả dụng cho bản ghi này.');
      if (!binding?.captureReadFence || !binding.recipientHandlers?.['recipients.update-contact']) throw deny();
      const assertCurrent = binding.captureReadFence();
      const actor = await binding.actor();
      const command: BusinessCommand = { command: 'recipients.update-contact', commandId: '', epoch: '', entityId: `s05:${rowKey}`, payload: {} };
      if (!actor || actor.expiresAt <= businessNow() || !authorizeRecipientContact(actor, command) || !binding.authorize(actor, command)) throw deny();
      const snapshot = await readSnapshot(signal);
      const record = snapshot.records.find(r => r.id === command.entityId);
      const after = await binding.actor();
      const latest = await readSnapshot(signal);
      assertCurrent();
      if (!after || after.key !== actor.key || after.expiresAt <= businessNow() || !authorizeRecipientContact(after, command)
        || !binding.authorize(after, command) || latest.epoch !== snapshot.epoch) throw deny();
      if (!isRecipientContactRecord(record)) throw deny();
      return { actorKey: 'preview:ducquang' as const, provenance: 'accepted-source-detail' as const,
        entityId: record.id, epoch: snapshot.epoch, version: record.version, row: structuredClone(record.data.row) };
    },
    async readRecipients(query: RecipientsQuery, scenario: string | undefined, signal: AbortSignal) {
      if (scenario && scenario !== 'default') return createRecipientsFixtureAdapter().read(query, scenario, { signal });
      const snapshot = await readSnapshot(signal);
      const rows = RECIPIENT_SOURCE_ROWS.map(source => {
        const record = snapshot.records.find(r => r.id === `s05:${source.key}`);
        if (!isRecipientContactRecord(record)) throw invalid();
        return record.data.row;
      });
      return createRecipientsFixtureAdapter(undefined, rows).read(query, scenario, { signal });
    },
    async readLabelContext(signal?: AbortSignal) {
      const snapshot = await readSnapshot(signal), record = snapshot.records.find(r => r.id === LABEL_REPORT_ENTITY_ID && r.kind === 'label-report');
      if (!record || !isLabelPrintData(record.data)) throw invalid();
      return { epoch: snapshot.epoch, entityId: record.id, version: record.version };
    },
    async readLabels(query: LabelReportQuery, signal: AbortSignal) {
      const snapshot = await readSnapshot(signal), record = snapshot.records.find(r => r.id === LABEL_REPORT_ENTITY_ID && r.kind === 'label-report');
      if (!record || !isLabelPrintData(record.data) || record.data.period.from !== labelSeed.period.from || record.data.period.to !== labelSeed.period.to) throw invalid();
      return createLabelReportRowsAdapter(record.data.rows, 'S23_P05_R04_P01_r02_SHARED_BROWSER_STATE', record.data.summary).read(query, { signal });
    },
    async readDefects(query: DefectsQuery, scenario: string | undefined, signal: AbortSignal): Promise<DefectsResult> {
      // Review scenarios stay isolated and never overwrite persisted demo state.
      if (scenario && scenario !== 'default') return seedAdapter.read(query, scenario, { signal });
      const { repository, source } = await prepare(), snapshot = await repository.read(signal);
      const rows = snapshot.records.filter(r => r.kind === 'defect').map(r => r.data);
      if (!rows.every(defect) || new Set(rows.map(r => r.key)).size !== rows.length) throw invalid();
      const checked = queryDefectsRows(rows, query, { searchMatch: 'folded-includes' }, DEFECTS_PAGE_SIZE_OPTIONS);
      if (checked.kind === 'blocked') {
        if (checked.reason === 'INCOMPLETE_SOURCE') throw invalid();
        return { kind: 'blocked', reason: checked.reason, detail: checked.detail, query: structuredClone(query) };
      }
      const active = rows.filter(r => r.status === 'active').length, inactive = rows.length - active;
      const percentage = (count: number) => `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(rows.length ? count * 100 / rows.length : 0)}%`;
      return { kind: 'ready', model: {
        query: structuredClone(query), rows: checked.rows,
        summary: { total: rows.length, active, inactive, activePercentage: percentage(active), inactivePercentage: percentage(inactive), scope: 'catalogue' },
        pagination: { ...checked.pagination, pageSizeOptions: [...DEFECTS_PAGE_SIZE_OPTIONS] },
        emptyReason: !rows.length ? 'no-records' : !checked.rows.length ? 'no-matches' : null,
        commandContext: { epoch: snapshot.epoch, snapshotRevision: snapshot.snapshotRevision,
          records: Object.fromEntries(snapshot.records.filter(r => r.kind === 'defect').map(r => [(r.data as DefectRow).key, { entityId: r.id, version: r.version }])) },
        source: { ...source, sortKey: query.sortKey, sortDirection: query.sort, fixtureRecordCount: rows.length,
          ...(snapshot.snapshotRevision > 1 ? { provenance: 'QA_SYNTHETIC' as const, fixtureVersion: `${source.fixtureVersion}:SHARED_BROWSER_STATE` } : {}) },
      } };
    },
    async readWarehouse(signal: AbortSignal): Promise<WarehouseRead> {
      if (localWarehouseRead.kind !== 'available') return structuredClone(localWarehouseRead);
      const selected = localWarehouseRead;
      const snapshot = await readSnapshot(signal), record = snapshot.records.find(r => r.id === selected.snapshot.id && r.kind === 'warehouse');
      if (!record || !warehouse(record.data)) throw invalid();
      return { ...structuredClone(selected), snapshot: structuredClone(record.data), commandContext: { epoch: snapshot.epoch, version: record.version } };
    },
    /** Diagnostic seam only; caller must explicitly confirm a reset and supply the current epoch. */
    async reset(input: { expectedEpoch: string; confirmed: true }, signal?: AbortSignal) {
      return (await prepare()).repository.reset(input, signal);
    },
  };
}
export type PreviewBusinessReads = ReturnType<typeof createPreviewBusinessReads>;
