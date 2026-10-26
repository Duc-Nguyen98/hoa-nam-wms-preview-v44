import { strToU8, zipSync } from 'fflate';

export type HoaNamColumn = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'percent';
  width?: number;
};

export type HoaNamWorkbookInput = {
  title: string;
  periodLabel: string;
  filtersLabel: string;
  exportedAt: Date;
  columns: HoaNamColumn[];
  rows: Record<string, unknown>[];
  translate?: (value: string) => string;
};

const xml = (value: unknown): string => String(value)
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function colName(index: number): string {
  let value = index + 1;
  let name = '';
  while (value) { value--; name = String.fromCharCode(65 + value % 26) + name; value = Math.floor(value / 26); }
  return name;
}

const textCell = (ref: string, value: unknown, style: number): string =>
  `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
const numCell = (ref: string, value: number, style: number): string =>
  `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
const blankCell = (ref: string, style: number): string => `<c r="${ref}" s="${style}"/>`;

function vietnamParts(date: Date): number[] {
  if (!Number.isFinite(date.getTime())) throw new TypeError('Invalid date value');
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const read = (name: string) => Number(parts.find((part) => part.type === name)?.value);
  return [read('year'), read('month'), read('day'), read('hour'), read('minute'), read('second')];
}

function dateParts(value: unknown, type: 'date' | 'datetime'): number[] {
  if (value instanceof Date) return vietnamParts(value);
  if (typeof value !== 'string') throw new TypeError(`Invalid ${type} value`);
  const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = value.match(dateOnlyPattern);
  if (match) {
    const [year, month, date] = match.slice(1).map(Number);
    if (new Date(Date.UTC(year, month - 1, date)).toISOString().slice(0, 10) !== value) throw new TypeError(`Invalid ${type} value`);
    return [year, month, date, 0, 0, 0];
  }
  const timestamp = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|([+-])(\d{2}):(\d{2}))$/);
  if (!timestamp) throw new TypeError(`Invalid ${type} value`);
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , , zoneHourText, zoneMinuteText] = timestamp;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const hour = Number(hourText), minute = Number(minuteText), second = Number(secondText ?? 0);
  if (new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) !== `${yearText}-${monthText}-${dayText}` ||
      hour > 23 || minute > 59 || second > 59 || Number(zoneHourText ?? 0) > 23 || Number(zoneMinuteText ?? 0) > 59) {
    throw new TypeError(`Invalid ${type} value`);
  }
  const parsed = new Date(value);
  return vietnamParts(parsed);
}

function serial(parts: number[], withTime: boolean): number {
  const [year, month, day, hour, minute, second] = parts;
  const days = (Date.UTC(year, month - 1, day) - Date.UTC(1899, 11, 30)) / 86400000;
  return days + (withTime ? (hour * 3600 + minute * 60 + second) / 86400 : 0);
}

function dataCell(ref: string, value: unknown, type: HoaNamColumn['type'], alternate: boolean): string {
  const offset = alternate ? 1 : 0;
  if (value === null || value === undefined || value === '') return blankCell(ref, 6 + offset);
  if (type === 'text') return textCell(ref, value, 6 + offset);
  if (type === 'date' || type === 'datetime') {
    return numCell(ref, serial(dateParts(value, type), type === 'datetime'), (type === 'date' ? 10 : 12) + offset);
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`Invalid ${type} value for ${ref}`);
  return numCell(ref, type === 'percent' ? value / 100 : value, (type === 'percent' ? 14 : 8) + offset);
}

const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="5"><numFmt numFmtId="164" formatCode="#,##0.##"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/><numFmt numFmtId="166" formatCode="dd/mm/yyyy hh:mm"/><numFmt numFmtId="167" formatCode="0.0%"/><numFmt numFmtId="168" formatCode="#,##0"/></numFmts>
<fonts count="5"><font><sz val="10"/><name val="Arial"/><color rgb="FF17324D"/></font><font><b/><sz val="14"/><name val="Arial"/><color rgb="FFFFFFFF"/></font><font><b/><sz val="14"/><name val="Arial"/><color rgb="FFFFFFFF"/></font><font><b/><sz val="10"/><name val="Arial"/><color rgb="FF0A3765"/></font><font><b/><sz val="10"/><name val="Arial"/><color rgb="FFFFFFFF"/></font></fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0A3765"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF004E74"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF4F8"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="18"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFill="1" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="0" fillId="4" borderId="0" xfId="0" applyFill="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"><alignment horizontal="right"/></xf>
<xf numFmtId="164" fontId="0" fillId="4" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1"><alignment horizontal="right"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="4" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1"/>
<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="166" fontId="0" fillId="4" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1"/>
<xf numFmtId="167" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="167" fontId="0" fillId="4" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1"/>
<xf numFmtId="168" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="168" fontId="0" fillId="4" borderId="0" xfId="0" applyNumberFormat="1" applyFill="1"/></cellXfs></styleSheet>`;

export function buildHoaNamWorkbook(input: HoaNamWorkbookInput): Uint8Array<ArrayBuffer> {
  const tx = input.translate ?? ((value: string) => value);
  if (!(input.exportedAt instanceof Date)) throw new TypeError('exportedAt must be a Date');
  const exportedSerial = serial(vietnamParts(input.exportedAt), true);
  if (!Array.isArray(input.columns) || !input.columns.length) throw new TypeError('At least one data column is required');
  if (!Array.isArray(input.rows)) throw new TypeError('rows must be an array');
  const seen = new Set<string>();
  for (const column of input.columns) {
    if (!column.key || seen.has(column.key) || !['text','number','date','datetime','percent'].includes(column.type)) throw new TypeError('Invalid or duplicate column');
    seen.add(column.key);
  }
  const count = input.columns.length + 1;
  const last = colName(Math.max(6, count - 1));
  const tableLast = colName(count - 1);
  const lastRow = Math.max(7, 7 + input.rows.length);
  const widths = [7, 22, 16, 26, 15, 18, 24];
  const cols = Array.from({ length: Math.max(7, count) }, (_, i) => {
    const specified = i === 0 ? 7 : input.columns[i - 1]?.width;
    const width = specified ?? widths[i] ?? 20;
    if (!Number.isFinite(width) || width <= 0 || width > 255) throw new TypeError(`Invalid width for column ${i + 1}`);
    return `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`;
  }).join('');
  const band = (row: number, value: string, style: number, height: number) =>
    `<row r="${row}" ht="${height}" customHeight="1">${Array.from({length: Math.max(7,count)}, (_,i) => i === 0 ? textCell(`A${row}`,value,style) : blankCell(`${colName(i)}${row}`,style)).join('')}</row>`;
  const meta = (row: number, label: string, value: string | number, valueStyle = 4) =>
    `<row r="${row}" ht="25" customHeight="1">${textCell(`A${row}`,label,3)}${blankCell(`B${row}`,3)}${typeof value === 'number' ? numCell(`C${row}`,value,valueStyle) : textCell(`C${row}`,value,valueStyle)}</row>`;
  const header = `<row r="7" ht="34" customHeight="1">${[tx('STT'),...input.columns.map(c => c.label)].map((v,i)=>textCell(`${colName(i)}7`,v,5)).join('')}</row>`;
  const rows = input.rows.map((record, index) => {
    const row = index + 8;
    const alternate = index % 2 === 0;
    const cells = [numCell(`A${row}`,index + 1,alternate ? 17 : 16), ...input.columns.map((column,i) => dataCell(`${colName(i + 1)}${row}`,record[column.key],column.type,alternate))];
    return `<row r="${row}" ht="27" customHeight="1">${cells.join('')}</row>`;
  }).join('');
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${last}${lastRow}"/><sheetViews><sheetView showGridLines="0" workbookViewId="0"><pane ySplit="7" topLeftCell="A8" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A8" sqref="A8"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${cols}</cols><sheetData>${band(1,'HOANAM WMS',1,32)}${band(2,input.title || tx('BÁO CÁO HOẠT ĐỘNG'),2,34)}${meta(3,tx('Kỳ báo cáo:'),input.periodLabel)}${meta(4,tx('Bộ lọc:'),input.filtersLabel)}${meta(5,tx('Thời điểm xuất:'),exportedSerial,12)}<row r="6" ht="11" customHeight="1"/>${header}${rows}</sheetData><autoFilter ref="A7:${tableLast}${lastRow}"/><mergeCells count="8"><mergeCell ref="A1:${last}1"/><mergeCell ref="A2:${last}2"/><mergeCell ref="A3:B3"/><mergeCell ref="C3:${last}3"/><mergeCell ref="A4:B4"/><mergeCell ref="C4:${last}4"/><mergeCell ref="A5:B5"/><mergeCell ref="C5:${last}5"/></mergeCells><printOptions horizontalCentered="0"/><pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="BaoCao" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Titles" localSheetId="0">'BaoCao'!$1:$7</definedName></definedNames><calcPr calcId="0"/></workbook>`;
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'),
    '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
    'xl/workbook.xml': strToU8(workbook),
    'xl/_rels/workbook.xml.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'),
    'xl/worksheets/sheet1.xml': strToU8(sheet),
    'xl/styles.xml': strToU8(styles),
  };
  return zipSync(Object.fromEntries(Object.entries(files).map(([name,data]) => [name,[data,{mtime:new Date('1980-01-01T00:00:00Z')}]])),{level:6}) as Uint8Array<ArrayBuffer>;
}
