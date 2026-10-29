import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=process.env.INVENTORY_BASE??'http://127.0.0.1:5340';
const out=process.env.INVENTORY_OUT??'docs/qa/inventory-reconciliation/HN-INVENTORY-RECON-FIDELITY-001/functional/independent-shared';
await fs.mkdir(out,{recursive:true});
const files=['src/features/S21/InventoryReportScreen.tsx','src/features/putaway/TrayUi.tsx','src/shared/read-failure-kind.ts','src/shared/PageState.tsx','src/shared/list-runtime.ts'];
const custody=async()=>Object.fromEntries(await Promise.all(files.map(async f=>[f,createHash('sha256').update(await fs.readFile(f)).digest('hex')])));
const before=await custody(),checks=[],errors=[];
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:800,height:1280},locale:'vi-VN'}),page=await context.newPage();
page.setDefaultTimeout(7000);page.on('pageerror',e=>errors.push(e.message));
const go=async(which)=>{await page.goto(base+'/tests/inventory-recon-fidelity/component-harness.html?case='+which);await page.locator('.s21-screen').waitFor();};
async function run(name,fn){const observations={};try{await fn(observations);checks.push({name,status:'PASS',observations});}catch(e){const screenshot=`${out}/failure-${checks.length+1}.png`;await page.screenshot({path:screenshot,fullPage:true}).catch(()=>{});checks.push({name,status:'FAIL',error:String(e),screenshot,observations});}console.log(checks.at(-1).status,name);await fs.writeFile(out+'/progress.json',JSON.stringify({checks,errors},null,2));}
try{
for(const [which,kind]of [['s21-session','unauthorized'],['s21-forbidden','forbidden'],['s21-notfound','record-not-found'],['s21-network','error'],['s21-loading','loading']])await run(`S21 initial ${which} maps to ${kind}`,async o=>{await go(which);const panel=page.locator('.s21-screen [data-state]');await expect(panel).toHaveAttribute('data-state',kind);o.text=await panel.innerText();o.buttons=await panel.getByRole('button').allTextContents();expect(await page.locator('.s21-screen tbody tr').count()).toBe(0);if(kind==='error')expect(o.buttons.length).toBe(1);else expect(o.buttons).toEqual([]);});
await run('S21 network retry accepts fixture read and replaces failure with report rows',async o=>{await go('s21-retry');const panel=page.locator('.s21-screen [data-state="error"]');await expect(panel).toBeVisible();await panel.getByRole('button').click();await expect(page.locator('.s21-screen tbody tr').first()).toBeVisible();expect(await page.locator('.s21-screen [data-state="error"]').count()).toBe(0);o.reads=await page.evaluate(()=>window.reconQaReportReads);expect(o.reads).toBe(2);o.rows=await page.locator('.s21-screen tbody tr').count();});
await run('S21 later read failure retains accepted rows with visible feedback',async o=>{await go('s21-accepted');const rows=page.locator('.s21-screen tbody tr');await expect(rows.first()).toBeVisible();o.before=await rows.allTextContents();await page.locator('.s21-status-filters').getByRole('button',{name:'Cần kiểm tra',exact:true}).click();await expect(page.locator('.s21-screen')).toContainText('Dữ liệu và điều kiện đã áp dụng được giữ nguyên.');expect(await rows.allTextContents()).toEqual(o.before);o.reads=await page.evaluate(()=>window.reconQaReportReads);expect(o.reads).toBe(2);expect(await page.locator('.s21-screen [data-state="loading"]').count()).toBe(0);});
}finally{await context.close();await browser.close();}
const after=await custody(),result={mode:'MOCK_COMPONENT',scope:'Actual S21 legacy report with injected fixture reads; no backend/RBAC certification',beforeSource:before,afterSource:after,sourceUnchanged:JSON.stringify(before)===JSON.stringify(after),checks,errors};
await fs.writeFile(out+'/results.json',JSON.stringify(result,null,2));
if(checks.some(c=>c.status==='FAIL')||errors.length||!result.sourceUnchanged)process.exitCode=1;
