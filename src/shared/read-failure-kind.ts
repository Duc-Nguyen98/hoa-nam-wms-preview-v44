import type { PageStateKind } from './PageState';
export function readFailureKind(error: unknown): PageStateKind {
 const code = typeof error === 'string' ? error : error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
 if (['SESSION_EXPIRED','UNAUTHORIZED','AUTH_REQUIRED'].includes(code)) return 'unauthorized';
 if (['FORBIDDEN','MOCK_COMMAND_FORBIDDEN','ACCESS_DENIED'].includes(code)) return 'forbidden';
 if (['NOT_FOUND','RECORD_NOT_FOUND'].includes(code)) return 'record-not-found';
 return 'error';
}
