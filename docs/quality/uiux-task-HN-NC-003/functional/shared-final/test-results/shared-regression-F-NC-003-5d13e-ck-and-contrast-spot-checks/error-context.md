# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shared-regression.spec.ts >> F-NC-003-SHARED-800-dark actual app modal semantics, collision-safe mark-all feedback and contrast spot checks
- Location: docs\quality\uiux-task-HN-NC-003\functional\shared-regression.spec.ts:7:67

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.fill: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('#s07-username')

```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import fs from 'node:fs/promises';
  3  | import path from 'node:path';
  4  | import {execFileSync} from 'node:child_process';
  5  | import {createHash} from 'node:crypto';
  6  | const evidence=path.resolve(process.env.QA_SHARED_EVIDENCE_DIR??'docs/quality/uiux-task-HN-NC-003/functional/shared-after');
  7  | for(const width of [1920,800])for(const theme of ['light','dark'])test(`F-NC-003-SHARED-${width}-${theme} actual app modal semantics, collision-safe mark-all feedback and contrast spot checks`,async({page},info)=>{
  8  |  const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree=execFileSync('git',['rev-parse','HEAD:src'],{encoding:'utf8'}).trim();
  9  |  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>errors.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));
  10 |  await page.setViewportSize({width,height:width===1920?1080:1280});await page.addInitScript(theme=>{localStorage.setItem('hn-wms.s00.language.v1','vi');localStorage.setItem('hn-wms.s00.theme.v1',theme);},theme);
> 11 |  await page.goto('/#/preview/S01');await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await expect(page.locator('.ov-result-count')).toBeVisible({timeout:90000});
     |                                                                        ^ Error: locator.fill: Test timeout of 120000ms exceeded.
  12 |  await page.locator('.hn-notifications').click();const d=page.locator('dialog[open]');await expect(d.locator('.hn-notification-item')).toHaveCount(6);await expect(d).toHaveAccessibleName(/Trung tâm thông báo/);await expect(d.getByRole('heading',{name:/Trung tâm thông báo/})).toBeVisible();await expect(d.getByRole('banner')).toHaveCount(0);await page.evaluate(()=>document.fonts.ready);
  13 |  const sampleContrast=()=>d.evaluate(dialog=>{
  14 |   const selectors=['.hn-global-modal__heading h2','.hn-global-modal__heading p','.hn-notification-heading-badge','.hn-notification-search input','.hn-notification-tabs button','.hn-notification-tabs button span','.hn-notification-mark-all','.hn-notification-item-copy strong','.hn-notification-item-copy>span','.hn-notification-item>time','.hn-notification-group h3','.hn-notification-detail-title','.hn-notification-category','.hn-notification-detail-body','.hn-notification-business-card dt','.hn-notification-business-card dd','.hn-notification-business-status','.hn-notification-primary','.hn-notification-toggle-read','.hn-notification-reading-notice','.hn-notification-list-footer'];
  15 |   const rgb=(value:string)=>{const n=value.match(/[\d.]+/g)?.map(Number);return n&&n.length>=3?[n[0],n[1],n[2],n[3]??1]:null;};
  16 |   const over=(f:number[],b:number[])=>{const a=f[3]+b[3]*(1-f[3]);return [...f.slice(0,3).map((v,i)=>(v*f[3]+b[i]*b[3]*(1-f[3]))/(a||1)),a];};
  17 |   const lum=(c:number[])=>{const l=c.slice(0,3).map(v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;});return .2126*l[0]+.7152*l[1]+.0722*l[2];};
  18 |   const records:any[]=[];
  19 |   for(const selector of selectors)for(const [index,element]of [...dialog.querySelectorAll<HTMLElement>(selector)].entries()){
  20 |    if(!element.getClientRects().length||getComputedStyle(element).visibility!=='visible')continue;
  21 |    for(const pseudo of selector==='.hn-notification-search input'?['::placeholder']:['']){
  22 |     const s=getComputedStyle(element,pseudo||null),layers:any[]=[],uncertainties:string[]=[];let node:HTMLElement|null=element,bg=[0,0,0,0],opacity=Number(s.opacity);
  23 |     while(node){const st=getComputedStyle(node),color=rgb(st.backgroundColor);layers.push({tag:node.tagName,class:node.className,color:st.backgroundColor,image:st.backgroundImage,opacity:st.opacity});
  24 |      if(st.backgroundImage!=='none')uncertainties.push('background-image');
  25 |      for(const p of ['::before','::after']){const ps=getComputedStyle(node,p);if(ps.content!=='none'&&ps.content!=='normal'&&ps.display!=='none'&&ps.visibility!=='hidden')uncertainties.push(`${node.className}${p}`);}
  26 |      if(color)bg=over(bg,color);if(bg[3]>=.999)break;node=node.parentElement;
  27 |     }
  28 |     for(let parent=element.parentElement;parent;parent=parent.parentElement)if(Number(getComputedStyle(parent).opacity)!==1)uncertainties.push('ancestor-opacity');
  29 |     if(bg[3]<.999)uncertainties.push('unresolved-opaque-background');const fg=rgb(s.color);if(!fg)uncertainties.push('unparsed-foreground');
  30 |     const effective=fg?over([fg[0],fg[1],fg[2],fg[3]*opacity],bg):null,ratio=effective?(Math.max(lum(effective),lum(bg))+.05)/(Math.min(lum(effective),lum(bg))+.05):null;
  31 |     const size=parseFloat(s.fontSize),weight=Number(s.fontWeight)||400,required=size>=24||(size>=18.6667&&weight>=700)?3:4.5;
  32 |     records.push({selector,index,pseudo,text:pseudo?element.getAttribute('placeholder'):element.textContent?.trim(),foreground:s.color,opacity,fontSize:s.fontSize,fontWeight:s.fontWeight,background:bg,effective,ratio,required,uncertainties,layers,status:uncertainties.length?'INCOMPLETE':ratio!==null&&ratio>=required?'PASS':'FAIL'});
  33 |    }
  34 |   }return records;
  35 |  });
  36 |  await fs.mkdir(evidence,{recursive:true});const contrast=(await sampleContrast()).map(r=>({...r,view:'initial-list/default-detail'}));for(let i=0;i<4;i++){await d.locator('.hn-notification-item').nth(i).click();await expect(d.locator('[data-notification-detail]')).toBeVisible();const status=d.locator('.hn-notification-business-status');if(await status.count())await status.first().scrollIntoViewIfNeeded();contrast.push(...(await sampleContrast()).map(r=>({...r,view:`detail-${i}`})));await page.screenshot({path:`${evidence}/${width}-${theme}-detail-${i}.png`});if(width===800)await d.getByRole('button',{name:'Quay lại danh sách',exact:true}).click();}
  37 |  const hashes=[];for(const file of ['src/notifications/notifications.css','src/shared/GlobalModal.tsx','src/toast/GlobalToastProvider.tsx'])hashes.push({file,sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex')});await fs.writeFile(`${evidence}/contrast-${width}-${theme}.json`,JSON.stringify({sha,tree,sourceAtSampling:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingSourceDiff:execFileSync('git',['diff','HEAD','--','src'],{encoding:'utf8'}),hashes,contrast},null,2));
  38 |  const group=page.getByRole('group',{name:'Thông báo tạm thời',exact:true,includeHidden:true});await expect(group).toHaveCount(1);
  39 |  await d.getByRole('button',{name:'Đánh dấu tất cả đã đọc',exact:true}).click();await expect(page.locator('.hn-notifications__count')).toHaveCount(0);
  40 |  await expect.poll(async()=>Number(await page.locator('.hn-global-toast-region').getAttribute('data-queued-count'))+await page.locator('.hn-global-toast').count()).toBe(1);await expect(d.getByRole('button',{name:'Đóng trung tâm thông báo',exact:true})).toBeEnabled();
  41 |  const beforeClose=await page.locator('.hn-global-toast-region').evaluate(e=>{const rect=(el:Element)=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};const toast=[...e.querySelectorAll<HTMLElement>('.hn-global-toast')].filter(x=>x.getClientRects().length&&getComputedStyle(x).visibility!=='hidden');const controls=[...document.querySelectorAll<HTMLElement>('dialog[open] button,dialog[open] a,dialog[open] input')].filter(x=>!e.contains(x)&&x.getClientRects().length&&getComputedStyle(x).visibility!=='hidden');return {queued:e.getAttribute('data-queued-count'),suspended:e.getAttribute('data-suspended'),visibleToasts:toast.length,toastRects:toast.map(rect),controlRects:controls.map(rect),collisions:toast.flatMap(t=>controls.filter(c=>{const a=rect(t),b=rect(c);return a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;}).map(c=>c.getAttribute('aria-label')??c.textContent))};});expect(beforeClose.collisions).toEqual([]);
  42 |  await fs.mkdir(evidence,{recursive:true});await page.screenshot({path:`${evidence}/${width}-${theme}-modal-queued.png`});await page.keyboard.press('Escape');await expect(d).toHaveCount(0);await expect(page.locator('.hn-notifications')).toBeFocused();const status=group.getByRole('status');await expect(status).toBeVisible();await expect(status).toHaveAttribute('aria-atomic','true');await expect(status).toContainText('Thao tác thành công');
  43 |  const afterClose=await status.boundingBox();await page.screenshot({path:`${evidence}/${width}-${theme}-feedback.png`});await status.getByRole('button',{name:'Đóng thông báo',exact:true}).focus();await page.keyboard.press('Enter');await expect(group.getByRole('status')).toHaveCount(0);await expect(page.locator('#main-content')).toBeFocused();
  44 |  const otherOpener=page.locator('[data-overview-detail-opener]:visible:not(:disabled)').first();await expect(otherOpener).toBeVisible();const otherId=await otherOpener.getAttribute('data-overview-detail-opener');await otherOpener.click();const other=page.locator('dialog[open].ov-detail-modal');await expect(other).toHaveAccessibleName(/Chi tiết phiếu/);await expect(other.getByRole('heading',{name:/Chi tiết phiếu/})).toBeVisible();await expect(other.getByRole('banner')).toHaveCount(0);await expect(other.locator('[data-overview-detail-id]')).toHaveAttribute('data-overview-detail-id',otherId!);for(let i=0;i<16;i++){await page.keyboard.press(i<8?'Tab':'Shift+Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('dialog[open].ov-detail-modal'))).toBe(true);}await page.screenshot({path:`${evidence}/${width}-${theme}-s01-detail.png`});await page.keyboard.press('Escape');await expect(other).not.toBeVisible();await expect(otherOpener).toBeFocused();
  45 |  const sourceEnd={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree:execFileSync('git',['rev-parse','HEAD:src'],{encoding:'utf8'}).trim(),diff:execFileSync('git',['diff','HEAD','--','src'],{encoding:'utf8'})};
  46 |  const record={sha,tree,sourceEnd,profile:{width,theme},errors,beforeClose,afterClose,otherGlobalModalConsumer:{route:'#/preview/S01',component:'AcceptedRowDetail',recordId:otherId,titleFocusEscapeReturn:'PASS'},contrast,contrastScope:'Computed solid-background visible NC text spot checks, WCAG AA normal4.5/large3.0. Not comprehensive WCAG/contrast certification; pseudo/gradient uncertainties remain INCOMPLETE.'};await fs.writeFile(`${evidence}/${width}-${theme}.json`,JSON.stringify(record,null,2));await info.attach('shared-regression',{body:JSON.stringify(record),contentType:'application/json'});
  47 |  expect(sourceEnd).toEqual({sha,tree,diff:''});expect(errors).toEqual([]);expect(contrast.filter(r=>r.status==='FAIL').map(({selector,text,ratio,required,view})=>({selector,text,ratio,required,view}))).toEqual([]);
  48 | });
  49 | 
```