import type { PageStateKind } from './PageState';
export function readFailureKind(error: unknown): PageStateKind {
 const record = error && typeof error === 'object' ? error as Record<string, unknown> : undefined;
 const code = typeof error === 'string' ? error : record?.code != null ? String(record.code) : '';
 if (['SESSION_EXPIRED','UNAUTHORIZED','AUTH_REQUIRED'].includes(code)) return 'unauthorized';
 if (['FORBIDDEN','MOCK_COMMAND_FORBIDDEN','ACCESS_DENIED'].includes(code) || code.startsWith('FORBIDDEN_')) return 'forbidden';
 if (['NOT_FOUND','RECORD_NOT_FOUND'].includes(code)) return 'record-not-found';
 const response = record?.response;
 const status = record?.status ?? (response && typeof response === 'object' ? (response as Record<string, unknown>).status : undefined);
 if (status === 401) return 'unauthorized';
 if (status === 403) return 'forbidden';
 if (status === 404) return 'record-not-found';
 return 'error';
}
