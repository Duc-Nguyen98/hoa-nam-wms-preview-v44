/** Page through only the exposed middle area; leave overlap for reading context. */
export function labelTableScrollStep(viewportWidth: number, pinnedWidth: number): number {
  const exposed = Math.max(1, viewportWidth - Math.max(0, pinnedWidth));
  return Math.max(1, Math.floor(exposed * .8));
}
