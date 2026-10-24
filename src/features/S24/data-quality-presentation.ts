import type { DataQualitySortKey } from '../../contracts/data-quality-report';

/** A merged header retains the active field instead of silently losing its sort. */
export function dataQualityVisibleSorts(compact: boolean, active: DataQualitySortKey | null) {
  return {
    reference: compact && active === 'object' ? 'object' : 'referenceCode',
    result: compact && active === 'detail' ? 'detail' : 'result',
  } as const;
}
