import { DEFAULT_OVERVIEW_QUERY } from '../../contracts/overview';
import { DEFAULT_DEFECTS_QUERY } from '../../contracts/defects';
import { DEFAULT_PRODUCTS_QUERY } from '../../contracts/products';
import { DEFAULT_SKUS_QUERY } from '../../contracts/skus';
import { DEFAULT_RECIPIENTS_QUERY } from '../../contracts/recipients';
import { DEFAULT_PV_QUERY } from '../../contracts/pv-products';
import { DEFAULT_WARRANTY_QUERY } from '../../contracts/warranty-cases';
import { DEFAULT_PARTS_QUERY } from '../../contracts/parts-slips';
import { DEFAULT_TRAYS_QUERY } from '../../contracts/trays';
import { DEFAULT_RECEIPTS_QUERY } from '../../contracts/receipts';
import { DEFAULT_PUTAWAY_QUEUE_QUERY } from '../../contracts/putaway-queue';
import { DEFAULT_PUTAWAY_ORDERS_QUERY } from '../../contracts/putaway-orders';
import { DEFAULT_OUTBOUND_SLIPS_QUERY } from '../../contracts/outbound-slips';
import { DEFAULT_INVENTORY_QUERY } from '../../contracts/inventory-reconciliation';
import { DEFAULT_REVERSAL_QUERY } from '../../contracts/reversal-slips';
import { DEFAULT_INBOUND_REPORT_QUERY } from '../../contracts/inbound-report';
import { DEFAULT_OUTBOUND_REPORT_QUERY } from '../../contracts/outbound-report';
import { DEFAULT_MOVEMENT_QUERY } from '../../contracts/movement-history';
import { DEFAULT_INVENTORY_REPORT_QUERY } from '../../contracts/inventory-report';
import { DEFAULT_WARRANTY_REPORT_PERIOD } from '../../contracts/warranty-parts-report';
import { DEFAULT_LABEL_REPORT_QUERY } from '../../contracts/label-report';
import { DEFAULT_DATA_QUALITY_QUERY } from '../../contracts/data-quality-report';
import type { BusinessScreenId } from './api-contract';
import { DEFAULT_DEALER_EXPORT_QUERY } from '../../contracts/dealer-export-report';
import { DEFAULT_TRACE_QUERY } from '../../contracts/goods-trace-report';

/** Query defaults are shared serialization metadata; this module contains no business records. */
export const BUSINESS_DEFAULT_QUERIES = {
  S01: DEFAULT_OVERVIEW_QUERY, S02: DEFAULT_DEFECTS_QUERY, S03: DEFAULT_PRODUCTS_QUERY, S04: DEFAULT_SKUS_QUERY,
  S05: DEFAULT_RECIPIENTS_QUERY, S06: DEFAULT_PV_QUERY, S09: DEFAULT_WARRANTY_QUERY, S10: DEFAULT_PARTS_QUERY,
  S11: DEFAULT_TRAYS_QUERY, S12: DEFAULT_RECEIPTS_QUERY, S13: DEFAULT_PUTAWAY_QUEUE_QUERY, S14: DEFAULT_PUTAWAY_ORDERS_QUERY,
  S15: DEFAULT_OUTBOUND_SLIPS_QUERY, S16: DEFAULT_INVENTORY_QUERY, S17: DEFAULT_REVERSAL_QUERY,
  S18: DEFAULT_INBOUND_REPORT_QUERY, S19: DEFAULT_OUTBOUND_REPORT_QUERY, S20: DEFAULT_MOVEMENT_QUERY,
  S21: DEFAULT_INVENTORY_REPORT_QUERY, S22: DEFAULT_WARRANTY_REPORT_PERIOD, S23: DEFAULT_LABEL_REPORT_QUERY, S24: DEFAULT_DATA_QUALITY_QUERY,
  S25: DEFAULT_DEALER_EXPORT_QUERY, S26: DEFAULT_TRACE_QUERY,
} satisfies Record<BusinessScreenId, object>;
