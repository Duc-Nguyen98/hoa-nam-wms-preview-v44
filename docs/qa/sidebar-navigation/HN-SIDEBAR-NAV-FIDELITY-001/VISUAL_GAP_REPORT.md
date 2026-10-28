# Visual gap and geometry report

## Browser conditions

- Chromium, Light theme, Vietnamese locale, Preview mock, runtime credentials entered only in memory.
- Desktop CSS viewport: 1672×941.
- Tablet CSS viewport: 992×1586.
- PNG dimensions were treated as artifact dimensions, not CSS viewport assumptions.

## Measurements

| State | Before | After | Result |
|---|---:|---:|---|
| Desktop sidebar width | 260px | 320px | Owner revision applied |
| Desktop function search | absent | present | PASS |
| Desktop active surface | translucent raised block | transparent + 6px dot | PASS |
| Tablet drawer width | 280px | 350px | Owner revision applied |
| Tablet function search | absent | present | PASS |
| Tablet body scroll while open | hidden | hidden | PASS |
| Tablet Escape close | not available in baseline capture | closes drawer | PASS |

## Screenshot artifacts

- Desktop: `screenshots/desktop/before.png`, `after.png`, `overlay.png`, `diff.png`.
- Tablet closed: `screenshots/tablet/closed-before.png`, `closed-after.png`.
- Tablet open: `screenshots/tablet/open-before.png`, `open-after.png`, `open-overlay.png`, `open-diff.png`.

Diff pixel ratios are measurement artifacts only (desktop 10.88%, tablet-open 14.34%); they are not a pass/fail score because the scoped revision intentionally changes sidebar width, surface, search and state treatment.

No golden baseline was modified.
