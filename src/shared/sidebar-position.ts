export interface SidebarPosition {
  top: number;
  key?: string;
  offset?: number;
}

const positions = new Map<string, SidebarPosition>();
const routes = new Map<string, string | undefined>();
const hoverHandoffs = new Map<string, { x: number; y: number; expiresAt: number }>();

/** A pointer navigation can remount the shell. Keep just that handoff alive,
 * then consume it after the new aside verifies the pointer is really over it.
 * Reading is pure because StrictMode may run state initializers twice. */
export function rememberSidebarHoverHandoff(scope: string, point: { x: number; y: number }) { hoverHandoffs.set(scope, { ...point, expiresAt: performance.now() + 1000 }); }
export function readSidebarHoverHandoff(scope: string) {
  const handoff = hoverHandoffs.get(scope);
  return handoff && handoff.expiresAt > performance.now() ? handoff : undefined;
}
export function clearSidebarHoverHandoff(scope: string) { hoverHandoffs.delete(scope); }

/** Session memory survives screen-owned shell remounts without persisting DOM. */
export function rememberSidebarPosition(slot: string, position: SidebarPosition) {
  positions.set(slot, position);
}

export function readSidebarPosition(slot: string) { return positions.get(slot); }

export function enterSidebarRoute(scope: string, activeKey?: string) {
  const changed = !routes.has(scope) || routes.get(scope) !== activeKey;
  routes.set(scope, activeKey);
  return changed;
}

export function captureSidebarPosition(nav: HTMLElement, anchor?: HTMLElement): SidebarPosition {
  const area = nav.getBoundingClientRect();
  const row = anchor ?? Array.from(nav.querySelectorAll<HTMLElement>('[data-nav-key]')).find(element => {
    const bounds = element.getBoundingClientRect();
    return bounds.height > 0 && bounds.bottom > area.top + 4;
  });
  return { top: nav.scrollTop, key: row?.dataset.navKey, offset: row ? row.getBoundingClientRect().top - area.top : undefined };
}

export function restoreSidebarPosition(nav: HTMLElement, position?: SidebarPosition) {
  if (!position) return;
  const row = position.key ? Array.from(nav.querySelectorAll<HTMLElement>('[data-nav-key]')).find(element => element.dataset.navKey === position.key) : undefined;
  const bounds = row?.getBoundingClientRect();
  // Use the saved anchor whenever it is still present. The anchor offset is
  // relative to the current scrollport, so the correction remains valid after
  // a route remount or after a group changes the menu's total height.
  const nextTop = bounds?.height && position.offset !== undefined
    ? nav.scrollTop + bounds.top - nav.getBoundingClientRect().top - position.offset
    : position.top;
  const maxTop = Math.max(0, nav.scrollHeight - nav.clientHeight);
  nav.scrollTop = Math.min(maxTop, Math.max(0, nextTop));
}

export function revealSidebarRow(nav: HTMLElement, row: HTMLElement) {
  const area = nav.getBoundingClientRect();
  const bounds = row.getBoundingClientRect();
  if (!bounds.height) return false;
  if (bounds.top < area.top + 8) nav.scrollTop += bounds.top - area.top - 8;
  else if (bounds.bottom > area.bottom - 8) nav.scrollTop += bounds.bottom - area.bottom + 8;
  return true;
}
