import type { OperationalSnapshot } from '../contracts/operational-preview';
import { canonicalBusinessJson } from '../preview-mock/business-repository';
import { sha256Text } from '../preview-mock/operational-hash';
import { exportOperationalReport, pinOperationalReports, type OperationalReportQuery, type OperationalReports } from './operational-reports';

const digest = (value: unknown) => sha256Text(canonicalBusinessJson(value));
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
const population = <T extends { complete: unknown }>(value: T) => { const { complete: _complete, ...rest } = value; return rest; };

/** Opt-in Preview QA only. Copies a verified read; has no repository, command,
 * download, clock override or grant. Every row and token survives both probes. */
export async function inspectIncompleteExport(
  source: OperationalSnapshot,
  query: OperationalReportQuery,
  exporter: typeof exportOperationalReport = exportOperationalReport,
) {
  const before = digest(source);
  // A bad actual source/query must fail normally, never masquerade as a passed probe.
  const completeReport = pinOperationalReports(source, query);
  const completeReportBefore = digest(completeReport);
  const sourceProbe = { ...structuredClone(source), complete: false };
  const exportProbe = { ...structuredClone(completeReport), complete: false };
  if (digest(population(sourceProbe)) !== digest(population(source))
    || digest(population(exportProbe)) !== digest(population(completeReport))) return fail('QA_POPULATION_CHANGED');
  let sourceCode: string | null = null, exportCode: string | null = null, exportReturned = false;
  // Deliberately invalid completeness metadata at the existing typed boundary.
  // No partial population or alternate report hash is fabricated.
  try { pinOperationalReports(sourceProbe as unknown as OperationalSnapshot, query); }
  catch (error) { sourceCode = (error as { code?: string }).code ?? 'UNKNOWN_ERROR'; }
  try { await exporter(exportProbe as unknown as OperationalReports, 'cases'); exportReturned = true; }
  catch (error) { exportCode = (error as { code?: string }).code ?? 'UNKNOWN_ERROR'; }
  if (digest(source) !== before || digest(completeReport) !== completeReportBefore) return fail('QA_SOURCE_CHANGED');
  if (sourceCode !== 'INCOMPLETE_POPULATION' || exportCode !== 'INCOMPLETE_POPULATION' || exportReturned) return fail('QA_EXPECTED_REFUSAL_MISSING');
  return {
    status: 'OBSERVED_REFUSAL_NOT_E2E_ACCEPTANCE' as const,
    mode: 'PREVIEW_MOCK_QA_READ_ONLY' as const,
    token: structuredClone(source.token), query: { ...query },
    changedMetadata: { source: { complete: { before: true, probe: false } }, report: { complete: { before: true, probe: false } } },
    sourceSha256: before, sourceAfterSha256: digest(source), completeReportSha256: completeReport.sha256,
    sourcePopulationSha256: digest(population(source)), sourceProbePopulationSha256: digest(population(sourceProbe)),
    reportPopulationSha256: digest(population(completeReport)), reportProbePopulationSha256: digest(population(exportProbe)),
    rowCounts: Object.fromEntries(Object.entries(source).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, (value as unknown[]).length])),
    sourceGuard: { code: sourceCode, pinCreated: false },
    exportGuard: { code: exportCode, returnedBytes: false, downloadCreated: false },
    originalCompleteReportUnchanged: true,
    limits: 'Single-probe completeness metadata only; no missing-row simulation, stored-state mutation, Real API or full-flow acceptance.',
  };
}
