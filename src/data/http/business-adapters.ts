import type { AxiosInstance } from 'axios';
import type { OverviewDataAdapter } from '../../contracts/overview';
import type { DefectsDataAdapter } from '../../contracts/defects';
import type { ProductsDataAdapter } from '../../contracts/products';
import type { SkusDataAdapter } from '../../contracts/skus';
import type { RecipientsDataAdapter } from '../../contracts/recipients';
import type { PvDataAdapter } from '../../contracts/pv-products';
import type { WarrantyAdapter } from '../../contracts/warranty-cases';
import type { PartsAdapter } from '../../contracts/parts-slips';
import type { TraysAdapter } from '../../contracts/trays';
import type { ReceiptsAdapter } from '../../contracts/receipts';
import type { PutawayQueueAdapter } from '../../contracts/putaway-queue';
import type { PutawayOrdersAdapter } from '../../contracts/putaway-orders';
import type { OutboundSlipsAdapter } from '../../contracts/outbound-slips';
import type { InventoryAdapter } from '../../contracts/inventory-reconciliation';
import type { ReversalAdapter } from '../../contracts/reversal-slips';
import type { InboundReportAdapter } from '../../contracts/inbound-report';
import type { OutboundReportAdapter } from '../../contracts/outbound-report';
import type { MovementAdapter } from '../../contracts/movement-history';
import type { InventoryReportAdapter } from '../../contracts/inventory-report';
import type { WarrantyReportAdapter } from '../../contracts/warranty-parts-report';
import type { LabelReportAdapter } from '../../contracts/label-report';
import type { DataQualityAdapter } from '../../contracts/data-quality-report';
import type { DealerExportAdapter } from '../../contracts/dealer-export-report';
import type { TraceAdapter } from '../../contracts/goods-trace-report';
import type { ListReadContext } from '../../shared/list-runtime';
import { apiClient, readBusinessResource } from './api-client';
import { BUSINESS_DEFAULT_QUERIES as defaults } from './resource-defaults';
import type { BusinessScreenId } from './api-contract';
import { IS_BROWSER_PREVIEW } from '../../preview-mode';
import { createInboundReportFixtureAdapter } from '../adapters/inbound-report-fixture-adapter';
import { createOutboundReportFixtureAdapter } from '../adapters/outbound-report-fixture-adapter';
import { createMovementFixtureAdapter } from '../adapters/movement-history-fixture-adapter';
import { createInventoryReportFixtureAdapter } from '../adapters/inventory-report-fixture-adapter';
import { warrantyPartsReportFixtureAdapter } from '../adapters/warranty-parts-report-fixture-adapter';
import { createDataQualityFixtureAdapter } from '../adapters/data-quality-fixture-adapter';
import { createDealerExportFixtureAdapter } from '../adapters/dealer-export-fixture-adapter';
import { createTraceFixtureAdapter } from '../adapters/goods-trace-fixture-adapter';

export interface BusinessHttpAdapters {
  S01: OverviewDataAdapter; S02: DefectsDataAdapter; S03: ProductsDataAdapter; S04: SkusDataAdapter;
  S05: RecipientsDataAdapter; S06: PvDataAdapter; S09: WarrantyAdapter; S10: PartsAdapter; S11: TraysAdapter;
  S12: ReceiptsAdapter; S13: PutawayQueueAdapter; S14: PutawayOrdersAdapter; S15: OutboundSlipsAdapter;
  S16: InventoryAdapter; S17: ReversalAdapter; S18: InboundReportAdapter; S19: OutboundReportAdapter;
  S20: MovementAdapter; S21: InventoryReportAdapter; S22: WarrantyReportAdapter; S23: LabelReportAdapter; S24: DataQualityAdapter;
  S25: DealerExportAdapter; S26: TraceAdapter;
}
function legacyRead<Query extends object, Result>(screen: BusinessScreenId, defaultQuery: Query, client: AxiosInstance) {
  return { read: (query: Query = defaultQuery, scenario?: string, context?: ListReadContext): Promise<Result> =>
    readBusinessResource<Result>(screen, query, { ...context, scenario }, client) };
}
function listRead<Query extends object, Result>(screen: BusinessScreenId, defaultQuery: Query, client: AxiosInstance) {
  return { read: (query: Query = defaultQuery, context?: ListReadContext): Promise<Result> =>
    readBusinessResource<Result>(screen, query, context, client) };
}
/**
 * Report screens use the approved local source fixtures in the public preview
 * so they remain populated without a report API. Production keeps the HTTP
 * adapters and the real service boundary.
 */
export function createBusinessHttpAdapters(client: AxiosInstance = apiClient): BusinessHttpAdapters {
  const previewReports: Partial<Pick<BusinessHttpAdapters, 'S18' | 'S19' | 'S20' | 'S21' | 'S22' | 'S24' | 'S25' | 'S26'>> = IS_BROWSER_PREVIEW ? {
    S18: createInboundReportFixtureAdapter(),
    S19: createOutboundReportFixtureAdapter(),
    S20: createMovementFixtureAdapter(),
    S21: createInventoryReportFixtureAdapter(),
    S22: warrantyPartsReportFixtureAdapter,
    S24: createDataQualityFixtureAdapter(),
    S25: createDealerExportFixtureAdapter(),
    S26: createTraceFixtureAdapter(),
  } : {};
  return {
    S01: legacyRead('S01', defaults.S01, client), S02: legacyRead('S02', defaults.S02, client),
    S03: legacyRead('S03', defaults.S03, client), S04: legacyRead('S04', defaults.S04, client),
    S05: legacyRead('S05', defaults.S05, client), S06: legacyRead('S06', defaults.S06, client),
    S09: listRead('S09', defaults.S09, client), S10: listRead('S10', defaults.S10, client),
    S11: listRead('S11', defaults.S11, client), S12: listRead('S12', defaults.S12, client),
    S13: listRead('S13', defaults.S13, client), S14: listRead('S14', defaults.S14, client),
    S15: listRead('S15', defaults.S15, client), S16: listRead('S16', defaults.S16, client),
    S17: listRead('S17', defaults.S17, client),
    S18: previewReports.S18 ?? listRead('S18', defaults.S18, client),
    S19: previewReports.S19 ?? listRead('S19', defaults.S19, client),
    S20: previewReports.S20 ?? listRead('S20', defaults.S20, client),
    S21: previewReports.S21 ?? listRead('S21', defaults.S21, client),
    S22: previewReports.S22 ?? { readSummary: (period, context) => readBusinessResource('S22', period, context, client) },
    // Labels are mutable in Preview; reads must share the command repository.
    S23: listRead('S23', defaults.S23, client),
    S24: previewReports.S24 ?? listRead('S24', defaults.S24, client),
    S25: previewReports.S25 ?? listRead('S25', defaults.S25, client),
    S26: previewReports.S26 ?? listRead('S26', defaults.S26, client),
  };
}
export const businessHttpAdapters = createBusinessHttpAdapters();
