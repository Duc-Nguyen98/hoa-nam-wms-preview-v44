import {defineConfig} from '@playwright/test';
import path from 'node:path';
const evidence=path.resolve(process.env.QA_EVIDENCE_DIR??'output/functional-remediation-HN-NC-MA-PILOT-002/candidate-browser');
export default defineConfig({testDir:'..',testMatch:['pilot.spec.ts','app.spec.ts','wave-ad/*.spec.ts'],workers:1,fullyParallel:false,
 timeout:120000,expect:{timeout:10000},use:{baseURL:'http://127.0.0.1:5206',headless:true,locale:'vi-VN',timezoneId:'Asia/Bangkok',reducedMotion:'reduce',viewport:{width:1440,height:900},actionTimeout:10000,trace:'on',screenshot:'only-on-failure',video:'retain-on-failure'},
 reporter:[['list'],['json',{outputFile:evidence+'/browser-results.json'}],['html',{outputFolder:evidence+'/playwright-report',open:'never'}]],outputDir:evidence+'/test-results',
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5206 --strictPort',url:'http://127.0.0.1:5206',reuseExistingServer:false,timeout:60000}});
