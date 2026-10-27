import { DEFAULT_OVERVIEW_QUERY, type OverviewQuery } from '../../src/contracts/overview';
import { createOverviewController } from '../../src/controllers/overview-controller';
import { OVERVIEW_RUNTIME_POLICY } from '../../src/controllers/overview-runtime';
import { createOverviewFixtureAdapter } from '../../src/data/adapters/overview-fixture-adapter';

/** Test-entry only: the real source adapter keeps snapshot identity and CTA authority. */
export const REFERENCE_OVERVIEW_QUERY: OverviewQuery = {
  ...DEFAULT_OVERVIEW_QUERY, page: 1, pageSize: 4,
  period: { ...DEFAULT_OVERVIEW_QUERY.period },
};
export const REFERENCE_OVERVIEW_POLICY = {
  ...OVERVIEW_RUNTIME_POLICY, pageSizeOptions: [4, ...OVERVIEW_RUNTIME_POLICY.pageSizeOptions],
};

export function createReferenceOverviewController() {
  const controller = createOverviewController(createOverviewFixtureAdapter(REFERENCE_OVERVIEW_POLICY));
  return {
    ...controller,
    load: (query: OverviewQuery = structuredClone(REFERENCE_OVERVIEW_QUERY)) => controller.load(query),
    reset: (query: OverviewQuery = structuredClone(REFERENCE_OVERVIEW_QUERY)) => controller.reset(query),
  };
}
