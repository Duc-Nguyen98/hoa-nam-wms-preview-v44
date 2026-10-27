import { createOverviewController } from './overview-controller';
import { createOverviewFixtureAdapter } from '../data/adapters/overview-fixture-adapter';
import { PAGE_SIZE_OPTIONS } from '../shared/table-query';

// Runtime paging follows the shared Foundation lock. Artwork page-size 4 is
// supplied only by the isolated reference harness, never by the application.
export const OVERVIEW_RUNTIME_POLICY = {
  searchMatch: 'folded-includes',
  allowPeriodChange: true,
  pageSizeOptions: PAGE_SIZE_OPTIONS,
} as const;
export const createOverviewRuntimeController = () => createOverviewController(createOverviewFixtureAdapter(OVERVIEW_RUNTIME_POLICY));
