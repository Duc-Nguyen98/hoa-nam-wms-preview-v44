import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const base = process.env.S27_BASE_URL ?? 'http://127.0.0.1:5287';
const user = process.env.S27_DEMO_USER ?? process.env.VQ_USER;
const password = process.env.S27_DEMO_PASSWORD ?? process.env.VQ_PASSWORD;
if (!user || !password) throw Error('Provide local MOCK login through S27_DEMO_USER/S27_DEMO_PASSWORD or VQ_USER/VQ_PASSWORD.');
const out = process.env.S27_CASCADE_OUT ?? 'docs/quality/uiux-task-HN-S27-005/implementation/round2/cascade';
await fs.mkdir(out, { recursive: true });
if (await fs.stat(path.join(out, 'results.json')).catch(() => null)) throw Error('Evidence already exists; choose another S27_CASCADE_OUT.');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const source = async () => ({ head: git('rev-parse', 'HEAD'), status: git('status', '--porcelain', '--', 'src', 'tests'), cssSha256: createHash('sha256').update(await fs.readFile('src/features/S27/system-audit.css')).digest('hex') });
const report = { base, scenario: 'LOCAL_PUBLIC_PREVIEW_MOCK_ACTUAL_APP_CASCADE', started: new Date().toISOString(), sourceStart: await source(), results: [], errors: [], consoleErrors: [] };
const browser = await chromium.launch(), context = await browser.newContext({ viewport: { width: 1672, height: 941 }, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' }), page = await context.newPage();
page.setDefaultTimeout(30000);
page.on('pageerror', error => report.errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
try {
  await page.goto(base + '/#/preview/S07');
  await page.locator('#s07-username').fill(user); await page.locator('#s07-password').fill(password);
  await page.locator('.s07-submit').click(); await page.locator('.s08-confirm').click();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.locator('.ov-result-count').waitFor({ timeout: 180000 });
  await page.goto(base + '/#/preview/S27'); await page.locator('.s27-result-count').waitFor({ state: 'attached' });
  const scenario = await page.evaluate(async () => {
    const { createOperationalWebAdapter } = await import('/src/data/http/operational-preview-adapter.ts');
    const snapshot = await createOperationalWebAdapter(undefined, { scope: 'S27' }).read();
    const dates = snapshot.auditEvents.map(record => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(record.data.timestamp))).sort();
    return { date: dates.at(-1), count: snapshot.auditEvents.length };
  });
  if (!scenario.date) throw Error('Actual local source has no audit date.');
  report.sourceScenario = scenario;
  const [year, month, day] = scenario.date.split('-'), manual = `${day}/${month}/${year}`;
  await page.locator('#s27-operational-period').click();
  await page.locator('#s27-operational-period-manual-from').fill(manual); await page.locator('#s27-operational-period-manual-to').fill(manual);
  await page.locator('.hn-date-picker__popup[data-open="true"]').getByRole('button', { name: 'Áp dụng', exact: true }).click();
  await page.locator('#s27-operational-query-search').fill('stock-profiles.create');
  const opener = page.locator('[data-audit-detail-open]:visible').first(); await opener.waitFor();
  const id = await opener.getAttribute('data-audit-detail-open'); await opener.click();
  const dialog = page.locator('dialog.s27-detail-modal[open]'); await expect(dialog.locator('[data-audit-detail-id]')).toHaveAttribute('data-audit-detail-id', id);
  const original = await page.evaluate(async selected => {
    const { createOperationalWebAdapter } = await import('/src/data/http/operational-preview-adapter.ts');
    const snapshot = await createOperationalWebAdapter(undefined, { scope: 'S27' }).read(), row = snapshot.auditEvents.find(record => record.id === selected);
    if (!row) throw Error('Actual selected audit missing.');
    return [row.id, row.data.entityId, row.data.commandId, row.data.commitSnapshotId];
  }, id);
  for (const profile of [{ name: 'desktop-native', width: 1672, height: 941 }, { name: 'tablet-native', width: 992, height: 1586 }, { name: 'tablet', width: 800, height: 1280 }]) {
    await page.setViewportSize({ width: profile.width, height: profile.height });
    await page.evaluate(() => document.fonts.ready); await page.mouse.move(0, 0);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // Responsive changes inherit the shared button border-color transition.
    // Observe its settled token instead of sampling an intermediate alpha.
    if (profile.width <= 1100) await expect.poll(() => dialog.evaluate(element => {
      const probe = document.createElement('span'); probe.style.border = '1px solid var(--hn-border)'; element.append(probe);
      const expected = getComputedStyle(probe).borderTopColor; probe.remove();
      return [...element.querySelectorAll('[data-audit-copy]')].every(button => getComputedStyle(button).borderTopColor === expected);
    })).toBe(true);
    const row = await dialog.evaluate(element => {
      const read = node => { const rect = node.getBoundingClientRect(), css = getComputedStyle(node); return { width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom, border: css.borderTopColor, borderWidth: css.borderTopWidth, padding: css.padding, gap: css.gap }; };
      const probe = document.createElement('span'); probe.style.border = '1px solid var(--hn-border)'; element.append(probe);
      const expectedBorder = getComputedStyle(probe).borderTopColor; probe.remove();
      const body = element.querySelector('.hn-global-modal__body'), footer = element.querySelector('.hn-global-modal__footer');
      return { modal: read(element), header: read(element.querySelector('.hn-global-modal__header')), identity: read(element.querySelector('.s27-detail-identity')), information: read(element.querySelector('.s27-detail-section')), trace: read(element.querySelector('.s27-detail-trace')), footer: read(footer), expectedBorder, copies: [...element.querySelectorAll('[data-audit-copy]')].map(read), rawIds: [...element.querySelectorAll('[data-audit-raw-value]')].map(node => node.textContent), horizontalOverflow: body.scrollWidth > body.clientWidth, footerReachable: footer.getBoundingClientRect().bottom <= innerHeight, pageDescription: document.querySelector('.s27-operational .hn-page-description').innerText, reloadLeadingIcons: document.querySelectorAll('.s27-operational-period > .hn-button .hn-button__icon').length };
    });
    row.cardMetadata = await page.locator('.s27-operational-card:visible').evaluateAll(cards => cards.map(card => {
      const rect = value => ({ left: value.left, right: value.right, top: value.top, bottom: value.bottom });
      const dl = card.querySelector('dl');
      const fields = [...dl.querySelectorAll(':scope > div')].map(field => {
        const dt = field.querySelector('dt'), range = document.createRange(); range.selectNodeContents(dt);
        return { label: dt.textContent, column: rect(field.getBoundingClientRect()), fontSize: getComputedStyle(dt).fontSize, fragments: [...range.getClientRects()].map(rect) };
      });
      const overlaps = fields.slice(0, -1).flatMap((field, index) => field.fragments.flatMap(left => fields[index + 1].fragments.filter(right => Math.min(left.right, right.right) - Math.max(left.left, right.left) > 0.1 && Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 0.1).map(() => [field.label, fields[index + 1].label])));
      return { columns: getComputedStyle(dl).gridTemplateColumns, values: dl.querySelectorAll('dd').length, fields, overlaps };
    }));
    const failures = [];
    try {
      expect(row.rawIds).toEqual(original); expect(row.copies).toHaveLength(4); expect(row.horizontalOverflow).toBe(false); expect(row.footerReachable).toBe(true);
      expect(row.reloadLeadingIcons).toBe(0);
      expect(row.pageDescription).toBe(profile.width <= 1100 ? 'Theo dõi thao tác và truy vết sự kiện.' : 'Theo dõi thao tác và truy vết sự kiện. Dữ liệu trong phạm vi được cấp. Giờ Việt Nam.');
      if (profile.width <= 1100) {
        expect(row.cardMetadata.length).toBeGreaterThan(0);
        for (const card of row.cardMetadata) {
          expect(card.columns.split(' ')).toHaveLength(5); expect(card.values).toBe(5);
          expect(card.fields.map(field => field.label)).toEqual(['Người thao tác', 'Nguồn thực hiện', 'Đối tượng', 'Mã lệnh', 'Phiên bản']);
          expect(card.overlaps).toEqual([]);
          for (const field of card.fields) {
            expect(field.fontSize).toBe('16px');
            for (const fragment of field.fragments) { expect(fragment.left).toBeGreaterThanOrEqual(field.column.left - 0.1); expect(fragment.right).toBeLessThanOrEqual(field.column.right + 0.1); }
          }
        }
      }
      for (const copy of row.copies) { expect(copy.width).toBeGreaterThanOrEqual(44); expect(copy.height).toBeGreaterThanOrEqual(44); if (profile.width <= 1100) { expect(copy.borderWidth).toBe('1px'); expect(copy.border).toBe(row.expectedBorder); } }
    } catch (error) { failures.push(String(error)); }
    await page.screenshot({ path: path.join(out, `${profile.name}-modal.png`) });
    report.results.push({ profile: { ...profile, dpr: 1, purpose: 'actual-app cascade and section geometry diagnostic' }, ...row, failures });
  }
  expect(report.errors).toEqual([]); expect(report.consoleErrors).toEqual([]);
  report.status = report.results.some(row => row.failures.length) ? 'FAIL' : 'PASS';
  if (report.status === 'FAIL') process.exitCode = 1;
} catch (error) { report.status = 'FAIL'; report.failure = String(error); process.exitCode = 1; }
finally {
  report.sourceEnd = await source(); report.finished = new Date().toISOString();
  report.sourceStable = report.sourceStart.head === report.sourceEnd.head && report.sourceStart.cssSha256 === report.sourceEnd.cssSha256;
  if (!report.sourceStable) { report.status = 'FAIL'; process.exitCode = 1; }
  await fs.writeFile(path.join(out, 'results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, sourceStable: report.sourceStable, results: report.results.map(row => ({ profile: row.profile.name, modalHeight: row.modal.height, borders: row.copies.map(copy => copy.border), failures: row.failures })), errors: report.errors, failure: report.failure }));
  await browser.close();
}
