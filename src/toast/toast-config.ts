/** HN_GLOBAL_TOAST_CONTRACT_v1.0 — S00#1 owns changes to this contract. */
export const TOAST_CONFIG = Object.freeze({
  headerSelector: '.hn-header', headerGap: 16, maxWidth: 390, stackGap: 10,
  viewportMargin: 16, entrance: 350, lifetime: 3000, exit: 300,
  queueLifetime: 30000, maxVisible: 3, maxPending: 20,
});

export function headerToastGeometry(header: { right: number; bottom: number; width: number } | null, viewportWidth: number, viewportHeight: number, origin = { left: 0, top: 0 }) {
  const rightEdge = header ? header.right - origin.left : viewportWidth - TOAST_CONFIG.viewportMargin;
  const top = Math.max(TOAST_CONFIG.viewportMargin, (header ? header.bottom - origin.top : 0) + TOAST_CONFIG.headerGap);
  return { top, right: Math.max(0, viewportWidth - rightEdge), width: Math.max(0, Math.min(TOAST_CONFIG.maxWidth, header?.width ?? viewportWidth - 2 * TOAST_CONFIG.viewportMargin)), availableHeight: Math.max(0, viewportHeight - top - TOAST_CONFIG.viewportMargin) };
}
