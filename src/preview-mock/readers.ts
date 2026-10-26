/** Owner-approved browser extraction. Uses candidate fixtures; no Node server dependency. */
import { BUSINESS_DEFAULT_QUERIES as defaults } from '../data/http/resource-defaults';
import type { BusinessScreenId } from '../data/http/api-contract';
import { createOverviewFixtureAdapter } from '../data/adapters/overview-fixture-adapter';
import { createDefectsFixtureAdapter } from '../data/adapters/defects-fixture-adapter';
import { createProductsFixtureAdapter } from '../data/adapters/products-fixture-adapter';
import { createSkusFixtureAdapter } from '../data/adapters/skus-fixture-adapter';
import { createRecipientsFixtureAdapter } from '../data/adapters/recipients-fixture-adapter';
import { createPvFixtureAdapter } from '../data/adapters/pv-products-fixture-adapter';
import { createWarrantyFixtureAdapter } from '../data/adapters/warranty-cases-fixture-adapter';
import { createPartsFixtureAdapter } from '../data/adapters/parts-slips-fixture-adapter';
import { createTraysFixtureAdapter } from '../data/adapters/trays-fixture-adapter';
import { createReceiptsFixtureAdapter } from '../data/adapters/receipts-fixture-adapter';
import { createPutawayQueueFixtureAdapter } from '../data/adapters/putaway-queue-fixture-adapter';
import { createPutawayOrdersFixtureAdapter } from '../data/adapters/putaway-orders-fixture-adapter';
import { createOutboundSlipsFixtureAdapter } from '../data/adapters/outbound-slips-fixture-adapter';
import { createInventoryFixtureAdapter } from '../data/adapters/inventory-fixture-adapter';
import { createReversalFixtureAdapter } from '../data/adapters/reversal-fixture-adapter';
import { createInboundReportFixtureAdapter } from '../data/adapters/inbound-report-fixture-adapter';
import { createOutboundReportFixtureAdapter } from '../data/adapters/outbound-report-fixture-adapter';
import { createMovementFixtureAdapter } from '../data/adapters/movement-history-fixture-adapter';
import { createInventoryReportFixtureAdapter } from '../data/adapters/inventory-report-fixture-adapter';
import { warrantyPartsReportFixtureAdapter } from '../data/adapters/warranty-parts-report-fixture-adapter';
import { createLabelReportFixtureAdapter } from '../data/adapters/label-report-fixture-adapter';
import { createDataQualityFixtureAdapter } from '../data/adapters/data-quality-fixture-adapter';
import { createDealerExportFixtureAdapter } from '../data/adapters/dealer-export-fixture-adapter';
import { createTraceFixtureAdapter } from '../data/adapters/goods-trace-fixture-adapter';

export interface BaselineReader { read(query: unknown, signal: AbortSignal, scenario?: string): Promise<unknown> }
function reader<Query extends object>(
  _defaults: Query, read: (query: Query, signal: AbortSignal, scenario?: string) => Promise<unknown>,
): BaselineReader { return { read: (query, signal, scenario) => read(query as Query, signal, scenario) }; }
const overview = createOverviewFixtureAdapter({ searchMatch: 'folded-includes', allowPeriodChange: true, pageSizeOptions: [4, 10, 15, 25, 50] });
const defects = createDefectsFixtureAdapter({ searchMatch: 'folded-includes' });
const products = createProductsFixtureAdapter(); const skus = createSkusFixtureAdapter();
const recipients = createRecipientsFixtureAdapter(); const pv = createPvFixtureAdapter();
const warranty = createWarrantyFixtureAdapter(); const parts = createPartsFixtureAdapter();
const trays = createTraysFixtureAdapter(); const receipts = createReceiptsFixtureAdapter();
const queue = createPutawayQueueFixtureAdapter(); const orders = createPutawayOrdersFixtureAdapter();
const outbound = createOutboundSlipsFixtureAdapter(); const inventory = createInventoryFixtureAdapter();
const reversals = createReversalFixtureAdapter(); const inboundReport = createInboundReportFixtureAdapter();
const outboundReport = createOutboundReportFixtureAdapter(); const movements = createMovementFixtureAdapter();
const inventoryReport = createInventoryReportFixtureAdapter(); const labels = createLabelReportFixtureAdapter();
const quality = createDataQualityFixtureAdapter();
const dealerExports = createDealerExportFixtureAdapter(), trace = createTraceFixtureAdapter();

export const baselineReaders: Record<BusinessScreenId, BaselineReader> = {
  S01: reader(defaults.S01, (query, signal, scenario) => overview.read(query, scenario, { signal })),
  S02: reader(defaults.S02, (query, signal, scenario) => defects.read(query, scenario, { signal })),
  S03: reader(defaults.S03, (query, signal, scenario) => products.read(query, scenario, { signal })),
  S04: reader(defaults.S04, (query, signal, scenario) => skus.read(query, scenario, { signal })),
  S05: reader(defaults.S05, (query, signal, scenario) => recipients.read(query, scenario, { signal })),
  S06: reader(defaults.S06, (query, signal, scenario) => pv.read(query, scenario, { signal })),
  S09: reader(defaults.S09, (query, signal) => warranty.read(query, { signal })),
  S10: reader(defaults.S10, (query, signal) => parts.read(query, { signal })),
  S11: reader(defaults.S11, (query, signal) => trays.read(query, { signal })),
  S12: reader(defaults.S12, (query, signal) => receipts.read(query, { signal })),
  S13: reader(defaults.S13, (query, signal) => queue.read(query, { signal })),
  S14: reader(defaults.S14, (query, signal) => orders.read(query, { signal })),
  S15: reader(defaults.S15, (query, signal) => outbound.read(query, { signal })),
  S16: reader(defaults.S16, (query, signal) => inventory.read(query, { signal })),
  S17: reader(defaults.S17, (query, signal) => reversals.read(query, { signal })),
  S18: reader(defaults.S18, (query, signal) => inboundReport.read(query, { signal })),
  S19: reader(defaults.S19, (query, signal) => outboundReport.read(query, { signal })),
  S20: reader(defaults.S20, (query, signal) => movements.read(query, { signal })),
  S21: reader(defaults.S21, (query, signal) => inventoryReport.read(query, { signal })),
  S22: reader(defaults.S22, (query, signal) => warrantyPartsReportFixtureAdapter.readSummary(query, { signal })),
  S23: reader(defaults.S23, (query, signal) => labels.read(query, { signal })),
  S24: reader(defaults.S24, (query, signal) => quality.read(query, { signal })),
  S25: reader(defaults.S25, (query, signal) => dealerExports.read(query, { signal })),
  S26: reader(defaults.S26, (query, signal) => trace.read(query, { signal })),
};
