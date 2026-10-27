# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tablet-delta.spec.ts >> F-NC-003-DELTA-801-zh-CN-light actual responsive read/unread/filter/detail and shared feedback
- Location: docs\quality\uiux-task-HN-NC-003\functional\tablet-delta.spec.ts:10:25

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Tiếp tục', exact: true })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - paragraph [ref=e4]: Hoa Nam WMS
    - heading "Bắt đầu phiên làm việc" [level=1] [ref=e5]
    - paragraph [ref=e6]: Chuẩn bị dữ liệu mẫu và phiên làm việc riêng trong trình duyệt này để tiếp tục.
    - paragraph [ref=e7]: Dữ liệu được lưu riêng trong trình duyệt; thao tác không gửi tới kho thật.
    - button "继续" [ref=e8] [cursor=pointer]
    - paragraph [ref=e9]:
      - link "Thông tin phiên bản" [ref=e10] [cursor=pointer]:
        - /url: ./release.html
  - generic:
    - group "临时通知"
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import fs from 'node:fs/promises';
  3  | import path from 'node:path';
  4  | import {execFileSync} from 'node:child_process';
  5  | import {createHash} from 'node:crypto';
  6  | const evidence=path.resolve(process.env.QA_TABLET_EVIDENCE_DIR??'docs/quality/uiux-task-HN-NC-003/functional/tablet-delta');
  7  | const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8'}).trim();
  8  | async function custody(){return {sha:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD:src'),diff:git('diff','HEAD','--','src'),cssSha256:createHash('sha256').update(await fs.readFile('src/notifications/notifications.css')).digest('hex')};}
  9  | const profiles=[{width:992,height:1586,language:'vi',theme:'light'},{width:992,height:1586,language:'vi',theme:'dark'},{width:900,height:1440,language:'en',theme:'light'},{width:801,height:1280,language:'zh-CN',theme:'light'}];
  10 | for(const p of profiles)test(`F-NC-003-DELTA-${p.width}-${p.language}-${p.theme} actual responsive read/unread/filter/detail and shared feedback`,async({page},info)=>{
  11 |  const start=await custody();expect(start.diff).toBe('');expect(start.sha).toBe(process.env.QA_EXPECTED_SHA??start.sha);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>errors.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));
> 12 |  await page.setViewportSize({width:p.width,height:p.height});await page.addInitScript(p=>{localStorage.setItem('hn-wms.s00.language.v1',p.language);localStorage.setItem('hn-wms.s00.theme.v1',p.theme);},p);await page.goto('/#/preview/S01');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await expect(page.locator('.ov-result-count')).toBeVisible({timeout:90000});await page.locator('.hn-notifications').click();const d=page.locator('dialog[open]');await expect(d.locator('.hn-notification-item')).toHaveCount(6);await page.evaluate(()=>document.fonts.ready);await expect(page.locator('html')).toHaveAttribute('data-hn-theme',p.theme);await expect(d).toHaveAttribute('lang',p.language==='zh-CN'?'zh-CN':p.language==='vi'?'vi-VN':'en');
     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ^ Error: locator.click: Test timeout of 120000ms exceeded.
  13 |  await fs.mkdir(evidence,{recursive:true});const name=`${p.width}-${p.language}-${p.theme}`,measurements:any[]=[];
  14 |  async function measure(state:string){const geometry=await d.evaluate(dialog=>{const rect=(el:Element)=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};const visible=(el:Element)=>el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';return {modal:rect(dialog),viewport:{width:innerWidth,height:innerHeight},overflow:{dialog:dialog.scrollWidth-dialog.clientWidth,page:document.documentElement.scrollWidth-innerWidth},rows:[...dialog.querySelectorAll<HTMLElement>('.hn-notification-item')].filter(visible).map(row=>{const title=row.querySelector('strong')!,time=row.querySelector('time')!;return {id:row.dataset.notificationId,unread:row.dataset.unread,selected:row.dataset.selected,row:rect(row),title:rect(title),time:rect(time),children:[...row.children].filter(visible).map(rect)};}),controls:[...dialog.querySelectorAll<HTMLElement>('.hn-global-modal__close,.hn-notification-mark-all,.hn-notification-tabs button,.hn-notification-search input')].filter(visible).map(el=>({class:el.className,rect:rect(el),disabled:el.matches(':disabled')}))};});measurements.push({state,...geometry});expect(geometry.overflow.dialog).toBeLessThanOrEqual(1);expect(geometry.overflow.page).toBeLessThanOrEqual(1);expect(geometry.modal.x).toBeGreaterThanOrEqual(23);expect(geometry.modal.y).toBeGreaterThanOrEqual(23);expect(geometry.modal.right).toBeLessThanOrEqual(p.width-23);expect(geometry.modal.bottom).toBeLessThanOrEqual(p.height-23);for(const row of geometry.rows){expect(row.row.height).toBeGreaterThanOrEqual(44);expect(row.title.right).toBeLessThanOrEqual(row.time.x+1);for(const c of row.children){expect(c.x).toBeGreaterThanOrEqual(row.row.x-1);expect(c.right).toBeLessThanOrEqual(row.row.right+1);expect(c.y).toBeGreaterThanOrEqual(row.row.y-1);expect(c.bottom).toBeLessThanOrEqual(row.row.bottom+1);}}for(const c of geometry.controls){expect(c.rect.height).toBeGreaterThanOrEqual(44);expect(c.rect.width).toBeGreaterThanOrEqual(44);expect(c.rect.right).toBeLessThanOrEqual(geometry.modal.right+1);expect(c.rect.x).toBeGreaterThanOrEqual(geometry.modal.x-1);}return geometry;}
  15 |  await measure('initial-list-2-unread');await page.screenshot({path:`${evidence}/${name}-initial.png`});await expect(d.locator('[data-notification-unread-count]')).toHaveAttribute('data-notification-unread-count','2');const firstUnread=d.locator('.hn-notification-item[data-unread="true"]').first();const id=await firstUnread.getAttribute('data-notification-id'),query=await firstUnread.locator('.hn-notification-item-copy>span').innerText();await firstUnread.click();await expect(d.locator('[data-notification-detail]')).toHaveAttribute('data-notification-detail',id!);await expect(d.locator('[data-notification-unread-count]')).toHaveAttribute('data-notification-unread-count','2');
  16 |  const cta=d.locator('.hn-notification-primary');await expect(cta).toHaveAttribute('href',/^#\/preview\/S\d+/);await cta.scrollIntoViewIfNeeded();const cb=await cta.boundingBox(),pane=await d.locator('.hn-notification-detail-pane-wrap').boundingBox();expect(cb!.x).toBeGreaterThanOrEqual(pane!.x);expect(cb!.y).toBeGreaterThanOrEqual(pane!.y);expect(cb!.y+cb!.height).toBeLessThanOrEqual(pane!.y+pane!.height+1);await page.screenshot({path:`${evidence}/${name}-detail.png`});await d.locator('.hn-notification-detail-back').click();const selectionOnly=await measure('selection-only-back-no-mutation');for(const old of measurements[0].rows){const current=selectionOnly.rows.find((r:any)=>r.id===old.id);for(const key of ['x','y','width','height'] as const)expect(Math.abs(current.row[key]-old.row[key]),`selection-only row ${old.id} ${key}`).toBeLessThanOrEqual(1);}await d.locator(`[data-notification-id="${id}"]`).click();await d.locator('.hn-notification-toggle-read').click();await expect(d.locator('[data-notification-unread-count]')).toHaveAttribute('data-notification-unread-count','1');await d.locator('.hn-notification-toggle-read').click();await expect(d.locator('[data-notification-unread-count]')).toHaveAttribute('data-notification-unread-count','2');await d.locator('.hn-notification-detail-back').click();
  17 |  await d.locator('.hn-notification-search input').fill(query);await expect(d.locator(`[data-notification-id="${id}"]`)).toBeVisible();await d.locator('.hn-notification-search input').fill('NO-RESULT-HN-NC-003-DELTA');await expect(d.locator('.hn-notification-item')).toHaveCount(0);await expect(d.locator('.hn-page-state[data-state="no-results"]')).toBeVisible();await measure('search-no-results');await d.locator('.hn-notification-search input').fill('');await d.locator('[data-tab="unread"]').click();await expect(d.locator('.hn-notification-item')).toHaveCount(2);await measure('unread-filter-2');await d.locator(`[data-notification-id="${id}"]`).click();await d.locator('.hn-notification-toggle-read').click();await expect(d.locator('.hn-notification-list-pane')).toBeVisible();await expect(d.locator('.hn-notification-item')).toHaveCount(1);await expect(d.locator('.hn-notification-search input')).toBeFocused();await measure('unread-filter-after-read-1');await page.screenshot({path:`${evidence}/${name}-after-filtered-read.png`});
  18 |  await d.locator('[data-tab="all"]').click();await d.locator('.hn-notification-mark-all').click();await expect(d.locator('[data-notification-unread-count]')).toHaveCount(0);await expect(page.locator('.hn-notifications__count')).toHaveCount(0);await expect(d.locator('.hn-notification-mark-all')).toBeDisabled();await expect(d.locator('.hn-notification-item[data-unread="true"]')).toHaveCount(0);await measure('all-read-0');await page.screenshot({path:`${evidence}/${name}-all-read.png`});await page.keyboard.press('Escape');await expect(d).toHaveCount(0);await expect(page.locator('.hn-notifications')).toBeFocused();const close=page.locator('.hn-global-toast .hn-global-toast-close');await expect(close).toBeVisible();await close.focus();await page.keyboard.press('Enter');await expect(page.locator('.hn-global-toast')).toHaveCount(0);await expect(page.locator('#main-content')).toBeFocused();
  19 |  const end=await custody(),record={profile:p,start,end,errors,selectedId:id,measurements,environment:'LOCAL authenticated Preview mock',scope:'Final CSS delta801..1100portrait: dynamic list/detail/read-unread/filter, safe viewport containment, actual controls reachability, toast focus'};await fs.writeFile(`${evidence}/${name}.json`,JSON.stringify(record,null,2));await info.attach('tablet-delta',{body:JSON.stringify(record),contentType:'application/json'});expect(end).toEqual(start);expect(errors).toEqual([]);
  20 | });
  21 | 
```