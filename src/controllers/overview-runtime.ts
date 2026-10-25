import { createOverviewController } from './overview-controller';
import { createOverviewFixtureAdapter } from '../data/adapters/overview-fixture-adapter';
import { PAGE_SIZE_OPTIONS } from '../shared/table-query';

// Owner's 2026-10-10 request enables real fixture search and these page sizes.
// Range behavior was confirmed by the Owner; the UI consumes S00's range picker.
export const OVERVIEW_RUNTIME_POLICY = {
  searchMatch: 'folded-includes',
  allowPeriodChange: true,
  pageSizeOptions: [4, ...PAGE_SIZE_OPTIONS],
} as const;
export const createOverviewRuntimeController = () => createOverviewController(createOverviewFixtureAdapter(OVERVIEW_RUNTIME_POLICY));
