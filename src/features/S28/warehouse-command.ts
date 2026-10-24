import type { WarehouseDraft, WarehouseSnapshot } from '../../contracts/warehouse-config';
import { validateWarehouseDraft } from '../../controllers/warehouse-config-controller';
import type { BusinessActor, BusinessCommand, BusinessHandler, BusinessRecord } from '../../preview-mock/business-repository';
import { PreviewHttpError } from '../../preview-mock/errors';

export const WAREHOUSE_UPDATE_COMMAND = 'warehouse.update';
export const WAREHOUSE_UPDATE_TARGET = 'warehouse-hn-01';
const fields = ['name', 'contact_person', 'phone'] as const;
const requirement = Object.freeze({ capability: 'warehouse.manage', entityId: WAREHOUSE_UPDATE_TARGET } as const);

/** Resolver seam only: no actor receives this capability from this module. P01 remains pending. */
export type WarehouseWriteAuthority = (
  actor: Readonly<BusinessActor>, required: typeof requirement,
) => boolean;

const failure = (status: number, code: string, details?: unknown) =>
  new PreviewHttpError(status, code, 'Không thể hoàn tất thay đổi thông tin kho.', details);
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));

function snapshot(value: unknown): value is WarehouseSnapshot {
  return object(value) && value.id === WAREHOUSE_UPDATE_TARGET
    && ['id', 'code', 'name', 'address', 'contact_person', 'phone'].every(field => typeof value[field] === 'string')
    && (value.status === 'ACTIVE' || value.status === 'INACTIVE');
}

/**
 * Repository configuration; not an endpoint or permission grant.
 * Install both returned members together. The repository owns session expiry,
 * version/epoch checks, atomic persistence, no-op detection and committed receipts.
 */
export function createWarehouseCommandSeam(authority?: WarehouseWriteAuthority): {
  handlers: Readonly<Record<typeof WAREHOUSE_UPDATE_COMMAND, BusinessHandler>>;
  authorize: (actor: Readonly<BusinessActor>, command: Readonly<BusinessCommand>) => boolean;
} {
  const handler: BusinessHandler = Object.freeze({
    operation: 'update',
    entityKind: 'warehouse',
    apply(payload: unknown, current: Readonly<BusinessRecord> | undefined) {
      if (!current || current.id !== WAREHOUSE_UPDATE_TARGET || current.kind !== 'warehouse') throw failure(404, 'NOT_FOUND');
      if (!snapshot(current.data)) throw failure(503, 'MOCK_STATE_INVALID');
      if (!object(payload)) throw failure(422, 'VALIDATION_FAILED');
      if (Reflect.ownKeys(payload).some(key => typeof key !== 'string' || !(fields as readonly string[]).includes(key))) {
        throw failure(422, 'IMMUTABLE_OR_UNKNOWN_FIELD');
      }
      const invalidTypes = Object.fromEntries(fields
        .filter(field => !Object.hasOwn(payload, field) || typeof payload[field] !== 'string')
        .map(field => [field, 'Giá trị phải là chuỗi.']));
      if (Object.keys(invalidTypes).length) throw failure(422, 'VALIDATION_FAILED', { fieldErrors: invalidTypes });
      const draft: WarehouseDraft = { name: payload.name as string, contact_person: payload.contact_person as string, phone: payload.phone as string };
      const errors = validateWarehouseDraft(draft);
      if (Object.keys(errors).length) throw failure(422, 'VALIDATION_FAILED', { fieldErrors: errors });
      // Validation checks formatted phone/name values; accepted strings remain verbatim.
      return { ...current.data, ...draft };
    },
  });
  return {
    handlers: Object.freeze({ [WAREHOUSE_UPDATE_COMMAND]: handler }),
    authorize(actor, command) {
      if (!actor || typeof actor.key !== 'string' || !actor.key || actor.confirmed !== true || !Number.isFinite(actor.expiresAt)
        || !command || command.command !== WAREHOUSE_UPDATE_COMMAND || command.entityId !== WAREHOUSE_UPDATE_TARGET
        || typeof authority !== 'function') return false;
      try {
        // Literal true only: missing, malformed, async or throwing resolvers fail closed.
        return authority(Object.freeze({ ...actor }), requirement) === true;
      } catch { return false; }
    },
  };
}
