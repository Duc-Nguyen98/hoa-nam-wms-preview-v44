import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});(page as any).qaErrors=errors;});
test.afterEach(async({page},info)=>{await info.attach('console-errors',{body:JSON.stringify((page as any).qaErrors),contentType:'application/json'});expect((page as any).qaErrors).toEqual([]);});

test('E-S01-001 fixture search/filter/page/detail/cancel and keyboard restoration',async({page})=>{
 await page.goto('/tests/functional/harness.html?screen=S01');await expect(page.locator('.ov-result-count')).toContainText('16');
 await page.locator('#ov-search-input').fill('S00-NO-MATCH');await expect(page.locator('.ov-result-count')).toContainText('0');
 await page.locator('.ov-reset').click();await page.locator('#ov-type-filter').selectOption('inbound');await expect(page.locator('.ov-result-count')).toContainText('8');
 await page.locator('#ov-status-filter').selectOption('posted');await expect(page.locator('.ov-result-count')).toContainText('5');
 await page.locator('.ov-reset').click();await page.locator('.hn-pagination button').filter({hasText:/^2$/}).click();
 const opener=page.locator('.ov-table-desktop .ov-document-link').first();await opener.click();await expect(page.locator('dialog[open]')).toBeVisible();
 await page.keyboard.press('Escape');await expect(opener).toBeFocused();await expect(page.locator('.hn-pagination [aria-current="page"]')).toHaveText('2');
 await page.screenshot({path:'output/functional-qa-20261027/s01-list.png'});
});
test('E-S01-002 loading and failed read/retry recover to accepted rows',async({page})=>{
 await page.goto('/tests/functional/harness.html?screen=S01&state=loading');await expect(page.locator('main [data-state="loading"]')).toContainText('Đang tải');
 await page.goto('/tests/functional/harness.html?screen=S01&state=error');await page.getByRole('button',{name:'Thử lại',exact:true}).click();await expect(page.locator('.ov-result-count')).toContainText('16');
});
test('E-S02-001 UI create/read/update/status verifies canonical Preview state',async({page})=>{
 await page.goto('/tests/functional/harness.html');await expect(page.locator('.df-list')).toBeVisible();
 await page.locator('[aria-describedby="s02-add-hint"]').click();await page.locator('#df-form-code').fill('QA-BROWSER');await page.locator('#df-form-name').fill('Lỗi kiểm thử');
 await page.getByRole('button',{name:'Lưu',exact:true}).click();await expect.poll(async()=>page.evaluate(async()=>{const r=await (window as any).__qa.read();return r.model.rows.some((x:any)=>x.code==='QA-BROWSER');})).toBe(true);
 // Explicit canonical-read acknowledgment is part of the durable journal UI.
 await expect(page.locator('dialog[open]')).toContainText('Chi tiết QA-BROWSER');
 await page.locator('dialog[open] .hn-global-modal__footer').getByRole('button',{name:'Đóng',exact:true}).click();
 const continueButton=page.getByRole('button',{name:'Tiếp tục',exact:true});await expect(continueButton).toBeEnabled();await continueButton.click();
 await expect(page.locator('[data-recovery-state]')).toHaveCount(0);
 await page.locator('.df-edit[aria-label="Sửa QA-BROWSER"]').click();await expect(page.locator('#df-form-code')).toHaveAttribute('readonly','');
 await page.locator('#df-form-name').fill('Lỗi đã sửa');await page.locator('#df-form-status').selectOption('inactive');await page.getByRole('button',{name:'Lưu',exact:true}).click();
 await expect.poll(async()=>page.evaluate(async()=>{const r=await (window as any).__qa.read();return r.model.rows.find((x:any)=>x.code==='QA-BROWSER')?.status;})).toBe('inactive');
 await expect.poll(async()=>page.evaluate(async()=>{const r=await (window as any).__qa.read();return r.model.rows.find((x:any)=>x.code==='QA-BROWSER')?.name;})).toBe('Lỗi đã sửa');
 await page.screenshot({path:'output/functional-qa-20261027/s02-committed.png'});
});
test('E-S02-002 validation, dirty cancel/confirm, query and no-result preserve records',async({page})=>{
 await page.goto('/tests/functional/harness.html');await expect(page.locator('.df-list')).toBeVisible();
 const before=await page.evaluate(async()=>await (window as any).__qa.read());
 await page.locator('[aria-describedby="s02-add-hint"]').click();await page.getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.locator('dialog[open]')).toContainText('Mã lỗi là bắt buộc.');
 await page.locator('#df-form-code').fill('UNSAVED');await page.getByRole('button',{name:'Hủy',exact:true}).click();await expect(page.getByText('Bỏ thay đổi chưa lưu?',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Tiếp tục chỉnh sửa',exact:true}).click();await expect(page.locator('#df-form-code')).toHaveValue('UNSAVED');
 await page.getByRole('button',{name:'Hủy',exact:true}).click();await page.getByRole('button',{name:'Bỏ thay đổi',exact:true}).click();await expect(page.locator('dialog[open]')).toHaveCount(0);
 await page.getByRole('searchbox',{name:'Tìm mã hoặc tên bệnh/lỗi',exact:true}).fill('S00-NO-MATCH');await expect(page.getByText('Không có hồ sơ phù hợp',{exact:true})).toBeVisible();
 const after=await page.evaluate(async()=>await (window as any).__qa.read());expect(after).toEqual(before);
});
test('E-UI-001 tablet/mobile page containment and named modal keyboard controls',async({page},info)=>{
 const geometry=[];
 for(const width of [800,390])for(const screen of ['S01','S02']){
  await page.setViewportSize({width,height:900});await page.goto('/tests/functional/harness.html?screen='+screen);
  await expect(page.locator(screen==='S01'?'.ov-result-count':'.df-list')).toBeVisible();
  const size=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));geometry.push({screen,...size});expect(size.document).toBeLessThanOrEqual(width);
  if(screen==='S02'){const opener=page.locator('[aria-describedby="s02-add-hint"]');await opener.click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(opener).toBeFocused();}
 }
 await info.attach('geometry',{body:JSON.stringify(geometry),contentType:'application/json'});
});
test('E-AUTH-001 local app clean login/session/setup reaches S01 within bounded test window',async({page},info)=>{
 await page.goto('/#/preview/S01');await expect(page.locator('#s07-username')).toBeVisible();
 await page.locator('#s07-username').fill('demo');await page.locator('#s07-password').fill('HoaNamDemo@2026');await page.locator('.s07-submit').click();await page.locator('.s08-confirm').click();
 await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();const started=Date.now();
 try{await expect(page.locator('.ov-result-count')).toBeVisible({timeout:60000});}
 finally{await info.attach('setup-observation',{body:JSON.stringify({elapsedMs:Date.now()-started,url:page.url(),body:(await page.locator('body').innerText()).slice(0,1800)}),contentType:'application/json'});}
});
