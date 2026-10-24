/** S28 view contract, not a backend DTO. Source: Web b2e1180 + S28_CAU_HINH.md. */
export interface WarehouseSnapshot {
  id: string;
  code: string;
  name: string;
  address: string;
  contact_person: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}
export interface WarehouseAccess {
  permissionCodes: readonly string[];
  isSuperAdmin: boolean;
}
export type WarehouseDraft = Pick<WarehouseSnapshot, 'name' | 'contact_person' | 'phone'>;
export type EditableField = keyof WarehouseDraft;
export type FieldErrors = Partial<Record<EditableField, string>>;
export type WarehouseRead =
  | { kind: 'available'; snapshot: WarehouseSnapshot; access: WarehouseAccess; provenance: 'DEV_SOURCE_SAMPLE' | 'OWNER_SELECTED_FIXTURE'; commandContext?: { epoch: string; version: number } }
  | { kind: 'source-unselected'; message: string };
export interface WarehouseUpdateRequest extends WarehouseDraft {
  warehouseId: 'warehouse-hn-01'; commandId: string; epoch: string; expectedVersion: number;
}
export interface WarehouseCommandOutcome {
  replayed: boolean;
  receipt: {
    mode: 'MOCK'; commandId: string; epoch: string; command: 'warehouse.update'; actorKey: string;
    entityId: 'warehouse-hn-01'; previousVersion: number; version: number; changed: boolean;
    committedAt: string; snapshotRevision: number;
    record: { id: 'warehouse-hn-01'; kind: 'warehouse'; version: number; data: WarehouseSnapshot };
  };
}
/** Availability is supplied by the host's explicit policy binding, never inferred from a role label. */
export type WarehouseRecoveryResult =
  | { kind: 'empty' }
  | { kind: 'pending'; request: Readonly<WarehouseUpdateRequest>; code?: string }
  | { kind: 'committed'; request: Readonly<WarehouseUpdateRequest>; outcome: WarehouseCommandOutcome }
  | { kind: 'blocked'; code: string };
/** The host owns actor binding, write-ahead durability and exact-request replay. */
export interface WarehouseCommandRecovery {
  restore(): Promise<WarehouseRecoveryResult>;
  retry(): Promise<WarehouseRecoveryResult>;
  acknowledge(commandId: string): Promise<void>;
  /** Recheck the same actor/epoch around a private canonical read. Missing
   * support must not unlock a previously hidden recovery screen. */
  readCurrent?<T>(read: () => Promise<T>): Promise<T>;
}
export interface WarehouseCommandAdapter {
  readonly available: boolean;
  readonly recovery?: WarehouseCommandRecovery;
  update(request: Readonly<WarehouseUpdateRequest>, context?: { signal?: AbortSignal }): Promise<WarehouseCommandOutcome>;
}
/** Default remains read/draft only until a command adapter and versioned read are explicitly supplied. */
export interface WarehouseConfigAdapter {
  read(): WarehouseRead;
  /** Optional HTTP-backed refresh used by the integrated local runtime. */
  readAsync?: (context?: { signal?: AbortSignal }) => Promise<WarehouseRead>;
  command?: WarehouseCommandAdapter;
}
