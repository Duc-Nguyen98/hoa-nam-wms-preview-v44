import {defineConfig} from '@playwright/test';
import path from 'node:path';
export default defineConfig({testDir:'.',testMatch:'badge.spec.ts',workers:1,timeout:45000,expect:{timeout:500},use:{baseURL:'http://127.0.0.1:5231',headless:true},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5231 --strictPort',url:'http://127.0.0.1:5231/tests/canary/badge.html',reuseExistingServer:false},reporter:[['list'],['json',{outputFile:path.resolve(process.env.CANARY_RESULTS??'docs/quality/canary/HN-AUTO-NC-BADGE-001/before/results.json')}]],outputDir:path.resolve('output/canary-badge')});
