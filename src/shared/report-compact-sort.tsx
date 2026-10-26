import { useUiCopy } from '../i18n/use-ui-copy';
import { FilterSelect } from './controls';

export type ReportSortDirection = 'asc' | 'desc';

export type ReportCompactSortOption<Key extends string> = {
  key: Key;
  label: string;
  /** Copy for ascending and descending order, respectively. */
  orders: readonly [string, string];
};

/**
 * Responsive reports use this native select when columns are combined. It
 * only exposes sort keys already supplied by the screen's report contract;
 * ordering and data requests remain owned by that screen/controller.
 */
export function ReportCompactSort<Key extends string>({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: { sortKey: Key; sortDirection: ReportSortDirection };
  options: readonly ReportCompactSortOption<Key>[];
  onChange: (sortKey: Key, sortDirection: ReportSortDirection) => void;
}) {
  const tx = useUiCopy();
  const selected = `${value.sortKey}:${value.sortDirection}`;
  return <div className="hn-report-compact-sort">
    <FilterSelect id={id} label={tx("Sắp xếp")} value={selected} onChange={event => {
      const separator = event.currentTarget.value.lastIndexOf(':');
      if (separator < 1) return;
      const sortKey = event.currentTarget.value.slice(0, separator) as Key;
      const sortDirection = event.currentTarget.value.slice(separator + 1) as ReportSortDirection;
      if ((sortDirection === 'asc' || sortDirection === 'desc') && options.some(option => option.key === sortKey)) onChange(sortKey, sortDirection);
    }}>
      {options.flatMap(option => (['asc', 'desc'] as const).map((direction, index) =>
        <option key={`${option.key}:${direction}`} value={`${option.key}:${direction}`}>
          {tx(option.label)} · {tx(option.orders[index])}
        </option>
      ))}
    </FilterSelect>
  </div>;
}
