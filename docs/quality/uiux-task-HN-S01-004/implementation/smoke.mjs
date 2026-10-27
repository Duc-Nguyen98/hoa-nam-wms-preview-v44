import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const out = new URL('./smoke-results.json', import.meta.url);
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [width, height] of [[1920, 1080], [800, 1280], [1672, 941], [992, 1586], [793, 1983]]) {
    const context = await browser.newContext({ viewport: { width, height },
      hasTouch: width < 1101, timezoneId: 'Asia/Ho_Chi_Minh', locale: 'vi-VN' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${process.env.S01_SMOKE_BASE ?? 'http://127.0.0.1:5273'}/tests/s01/harness.html?state=reference`);
    await page.locator('.ov-result-count').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const dashboard = await page.evaluate(() => {
      const box = s => { const e = document.querySelector(s), r = e.getBoundingClientRect(), c = getComputedStyle(e);
        return { x: r.x, y: r.y, width: r.width, height: r.height, padding: c.padding, gap: c.gap }; };
      const targets = [...document.querySelectorAll('.ov-screen button,.ov-screen input,.ov-screen select')]
        .filter(e => e.getClientRects().length).map(e => { const b = e.getBoundingClientRect();
          return { name: e.getAttribute('aria-label') || e.textContent, width: b.width, height: b.height }; });
      return { viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        boxes: Object.fromEntries(['.ov-page-heading', '.ov-metrics', '.ov-metric', '.ov-attention', '.ov-quick', '.ov-activity', '.ov-filters', '.ov-search .hn-filter-input', '#ov-search-input', '#ov-type-filter'].map(s => [s, box(s)])),
        stock: document.querySelector('.ov-metric[data-unknown=true]').innerText,
        pending: document.querySelector('.ov-attention__count').textContent,
        pager: document.querySelector('.hn-pagination').innerText,
        smallTargets: targets.filter(t => t.width < 44 || t.height < 44) };
    });
    const contrast = [];
    for (const theme of ['light', 'dark']) {
      contrast.push(await page.evaluate(theme => {
        document.documentElement.setAttribute('data-hn-theme', theme);
        const c = getComputedStyle(document.querySelector('.ov-attention__count'));
        const rgb = s => s.match(/[\d.]+/g).slice(0, 3).map(Number);
        const luminance = s => rgb(s).map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4)
          .reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
        const a = luminance(c.color), b = luminance(c.backgroundColor);
        return { theme, color: c.color, background: c.backgroundColor, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
      }, theme));
    }
    await page.evaluate(() => document.documentElement.setAttribute('data-hn-theme', 'light'));
    await page.locator('.ov-attention [data-overview-detail-opener="p12-stock-PX-0007"].ov-document-link').click();
    const detail = await page.locator('dialog.ov-detail-modal').evaluate(e => {
      const field = e.querySelector('.ov-detail-field'), label = field.querySelector('dt span'), icon = field.querySelector('dt svg');
      const modal = e.getBoundingClientRect();
      const body = e.querySelector('.hn-global-modal__body');
      body.scrollTop = body.scrollHeight;
      const id = e.querySelector('.ov-detail-id').getBoundingClientRect(), bodyBox = body.getBoundingClientRect();
      return { id: e.querySelector('[data-overview-detail-id]').getAttribute('data-overview-detail-id'),
        modal: { width: modal.width, height: modal.height },
        labelOffset: label.getBoundingClientRect().x - modal.x,
        iconToLabel: label.getBoundingClientRect().x - icon.getBoundingClientRect().x,
        fields: [...e.querySelectorAll('.ov-detail-field')].map(f => ({ y: f.getBoundingClientRect().y, height: f.getBoundingClientRect().height })),
        idReachable: id.top >= bodyBox.top && id.bottom <= bodyBox.bottom,
        ctaDisabled: e.querySelector('.hn-global-modal__footer .hn-button--primary').getAttribute('aria-disabled') };
    });
    results.push({ width, errors, dashboard, contrast, detail });
    await context.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(out, JSON.stringify({ purpose: 'Implementation smoke; independent AFTER QA remains required', results }, null, 2));
}
console.log(JSON.stringify(results.map(r => ({ width: r.width, errors: r.errors, boxes: r.dashboard.boxes,
  smallTargets: r.dashboard.smallTargets, contrast: r.contrast, detail: r.detail }))));
