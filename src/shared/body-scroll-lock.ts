interface SavedProperty { value: string; priority: string }
interface BodyLock {
  owners: Set<symbol>;
  saved: Map<string, SavedProperty>;
}
const locks = new WeakMap<HTMLElement, BodyLock>();

/** Nested overlays may close in either order. Only the last owner restores
 * the original inline styles; nested acquisition never adds another gutter. */
export function acquireBodyScrollLock(doc: Document = document): () => void {
  const body = doc.body, view = doc.defaultView;
  if (!body || !view) return () => {};
  let lock = locks.get(body);
  if (!lock) {
    const properties = ['overflow-x', 'overflow-y', 'padding-right'];
    lock = { owners: new Set(), saved: new Map(properties.map(property => [property, {
      value: body.style.getPropertyValue(property), priority: body.style.getPropertyPriority(property),
    }])) };
    const gutter = Math.max(0, view.innerWidth - doc.documentElement.clientWidth);
    const padding = Number.parseFloat(view.getComputedStyle(body).paddingRight) || 0;
    if (gutter > 0) body.style.setProperty('padding-right', `${padding + gutter}px`);
    body.style.setProperty('overflow', 'hidden');
    locks.set(body, lock);
  }
  const owner = Symbol('body-scroll-lock');
  lock.owners.add(owner);
  return () => {
    if (!lock.owners.delete(owner) || lock.owners.size) return;
    for (const [property, saved] of lock.saved) {
      if (saved.value) body.style.setProperty(property, saved.value, saved.priority);
      else body.style.removeProperty(property);
    }
    locks.delete(body);
  };
}
