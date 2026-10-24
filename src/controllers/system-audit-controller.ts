import { dateRangeBlocker } from '../shared/date-policy';
import { createListController } from '../shared/list-runtime';
import { createSystemAuditFixtureAdapter } from '../data/adapters/system-audit-fixture-adapter';
import { DEFAULT_SYSTEM_AUDIT_QUERY, type SystemAuditAdapter } from '../contracts/system-audit';

export function createSystemAuditController(adapter: SystemAuditAdapter = createSystemAuditFixtureAdapter()) {
  return createListController(adapter, {
    initialQuery: structuredClone(DEFAULT_SYSTEM_AUDIT_QUERY),
    validate: query => dateRangeBlocker(query.period),
    queryOptions: { searchKey: 'search', filterKeys: ['period', 'eventType', 'module', 'actorId'], sortKeys: ['sortKey', 'sortDirection'] },
  });
}
