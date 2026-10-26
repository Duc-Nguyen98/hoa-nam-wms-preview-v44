/** Errors in the approved local browser simulation; never a real service response. */
export class PreviewHttpError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly details?: unknown) {
    super(message); this.name = 'PreviewHttpError';
  }
}
