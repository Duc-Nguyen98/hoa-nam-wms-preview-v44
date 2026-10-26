import {defineConfig} from '@playwright/test';
const evidence=process.env.QA_EVIDENCE_DIR??'output/functional-qa-20261027';
export default defineConfig({testDir:'./tests/functional',testMatch:'*.spec.ts',workers:1,fullyParallel:false,
 timeout:90000,expect:{timeout:7000},use:{baseURL:'http://127.0.0.1:5204',headless:true,locale:'vi-VN',timezoneId:'Asia/Bangkok',reducedMotion:'reduce',viewport:{width:1440,height:900},actionTimeout:7000,trace:'retain-on-failure',screenshot:'only-on-failure',video:'retain-on-failure'},
 reporter:[['list'],['json',{outputFile:evidence+'/browser-results.json'}],['html',{outputFolder:evidence+'/playwright-report',open:'never'}]],outputDir:evidence+'/test-results',
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5204 --strictPort',url:'http://127.0.0.1:5204',reuseExistingServer:!process.env.CI,timeout:30000}});
