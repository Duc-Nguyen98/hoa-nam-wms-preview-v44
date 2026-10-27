import {defineConfig} from '@playwright/test';
import path from 'node:path';
const evidence=path.resolve(process.env.QA_TABLET_EVIDENCE_DIR??'docs/quality/uiux-task-HN-NC-003/functional/tablet-delta');
export default defineConfig({testDir:'.',testMatch:'tablet-delta.spec.ts',workers:1,fullyParallel:false,timeout:120000,expect:{timeout:10000},use:{baseURL:'http://127.0.0.1:5254',headless:true,locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce',trace:'retain-on-failure',screenshot:'only-on-failure'},reporter:[['list'],['json',{outputFile:evidence+'/browser-results.json'}]],outputDir:evidence+'/test-results',webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5254 --strictPort',url:'http://127.0.0.1:5254',reuseExistingServer:false,timeout:60000}});
