/** Shared preview search: normalize for comparison, never rewrite a source field. */
export function normalizeSearchText(value: string): string {
  return value.normalize('NFC').replace(/\s+/gu, ' ').trim()
    .toLocaleLowerCase('vi-VN').normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/đ/gu, 'd').normalize('NFC');
}

export function matchesSearch(value: string, query: string): boolean {
  return normalizeSearchText(value).includes(normalizeSearchText(query));
}

/** A substring must occur within one approved field; unrelated fields are not joined. */
export function matchesSearchFields<Row>(row: Row, query: string, fields: readonly ((row: Row) => unknown)[]): boolean {
  const needle = normalizeSearchText(query);
  if (!needle) return true;
  return fields.some(field => {
    const value = field(row);
    return value !== null && value !== undefined && normalizeSearchText(String(value)).includes(needle);
  });
}
