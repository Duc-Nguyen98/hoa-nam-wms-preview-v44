/** S25 opts into shared pins only when its widest sort control also fits.
 * This is screen composition policy, not a replacement for shared focus/scroll.
 */
export function dealerExportTableLayout(viewport: number, content: number, identity: number, control: number) {
  return {
    overflows: content > viewport + 1,
    pinIdentity: viewport >= identity + Math.max(44, control) + 24,
  };
}
