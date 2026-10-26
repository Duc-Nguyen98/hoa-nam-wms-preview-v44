import path from 'node:path';
import {defineConfig} from '@playwright/test';
const evidence = path.resolve('output', 'notification-p0-20261025');
export default defineConfig({testDir:'./tests/visual',testMatch:'notification.spec.ts',fullyParallel:false,workers:1,timeout:30000,expect:{timeout:5000},use:{baseURL:'http://127.0.0.1:5197',headless:true,locale:'vi-VN',timezoneId:'Asia/Bangkok',colorScheme:'light',reducedMotion:'reduce'},reporter:[['list'],['json',{outputFile:path.join(evidence,'playwright-results.json')}]],outputDir:path.join(evidence,'test-results')});
