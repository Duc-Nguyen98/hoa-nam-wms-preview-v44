/** S22 presentation contract only. No backend DTO, endpoint or permission is inferred. */
export type WarrantyReportPeriod = Readonly<{ from: string; to: string }>;
export const DEFAULT_WARRANTY_REPORT_PERIOD: WarrantyReportPeriod = Object.freeze({ from: '2026-09-04', to: '2026-09-10' });
export interface WarrantyReportSummary {
  total: number;
  completed: number;
  processing: number;
  waiting: number;
  incomplete: number;
  overdueWithinIncomplete: number;
}
/** Existing canonical transport shape; Premium detail metadata remains supported below. */
export interface WarrantyReportRow {
  id: string; code: string; serial: string | null; sku: string; productName: string; partName: string;
  receivedAt: string; dueAt: string | null; status: 'Hoàn tất' | 'Đang xử lý' | 'Chờ tiếp nhận';
}
export interface WarrantyReportModel {
  period: WarrantyReportPeriod;
  summary: WarrantyReportSummary;
  details: {
    kind?: never;
    rows?: never;
    availability: 'AVAILABLE';
    selectedFixture: 'DESKTOP';
    /** Declared detail scope, not the report aggregate. Rows use the detail adapter. */
    total: number;
  } | {
    kind?: 'blocked'; availability: 'BLOCKED_SOURCE_CONFLICT'; selectedFixture: null; rows: null; total: null;
  } | {
    kind: 'available'; availability?: 'AVAILABLE'; selectedFixture?: null; rows: WarrantyReportRow[]; total: number;
  };
}
export type WarrantyReportReadResult =
  | { kind: 'available'; model: WarrantyReportModel }
  | { kind: 'blocked'; reason: 'MISSING_PERIOD_SNAPSHOT' };
export interface WarrantyReportAdapter {
  readSummary(period: WarrantyReportPeriod, context: { signal: AbortSignal }): Promise<WarrantyReportReadResult>;
}
export function warrantyReportDateLabel(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}
export function warrantyReportPeriodLabel(period: WarrantyReportPeriod): string {
  return `${warrantyReportDateLabel(period.from)} – ${warrantyReportDateLabel(period.to)}`;
}
