import type { ShellLanguage } from '../../shared/shell-preferences';
import { formatBusinessPeriod } from '../../i18n/format-business-date';

// Exact buckets supplied by overview-fixture-adapter; coverage is September 2026 only.
const periods: Readonly<Record<string, { from: string; to: string }>> = {
  '01–07': { from: '2026-09-01', to: '2026-09-07' },
  '08–14': { from: '2026-09-08', to: '2026-09-14' },
  '15–21': { from: '2026-09-15', to: '2026-09-21' },
  '22–30': { from: '2026-09-22', to: '2026-09-30' },
};
export function formatOverviewBucketDate(label: string, language: ShellLanguage = 'vi'): string {
  if (!Object.hasOwn(periods, label)) return label;
  return language === 'zh-CN' ? formatBusinessPeriod(periods[label], language) : label + '/09/2026';
}
