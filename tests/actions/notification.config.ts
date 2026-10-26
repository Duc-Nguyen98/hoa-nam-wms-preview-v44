import path from 'node:path';
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'../visual',testMatch:/notification(-independent)?\.spec\.ts/,workers:1,timeout:30000,use:{baseURL:'http://127.0.0.1:5185',headless:true,locale:'vi-VN',timezoneId:'Asia/Bangkok',colorScheme:'light',reducedMotion:'reduce'},reporter:[['list'],['json',{outputFile:path.resolve('output/actions-local/notification-results.json')}]],outputDir:path.resolve('output/actions-local/notification-traces')});
