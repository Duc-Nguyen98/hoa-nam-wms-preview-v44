import path from 'node:path';
import {defineConfig} from '@playwright/test';
const evidence = path.resolve('output', 'notification-p0-20261025');
export default defineConfig({testDir:'./tests/visual',testMatch:'notification-independent.spec.ts',workers:1,fullyParallel:false,timeout:25000,expect:{timeout:4000},use:{baseURL:'http://127.0.0.1:5197',headless:true,locale:'vi-VN',timezoneId:'Asia/Bangkok',reducedMotion:'reduce'},reporter:[['list'],['json',{outputFile:path.join(evidence,'independent-results.json')}]],outputDir:path.join(evidence,'independent-test-results')});
