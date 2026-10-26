import {defineConfig} from '@playwright/test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export default defineConfig({
  testDir:path.join(root,'tests/visual'),testMatch:'notification-independent.spec.ts',workers:1,fullyParallel:false,retries:0,timeout:25000,
  expect:{timeout:4000},
  use:{baseURL:'http://127.0.0.1:5199',headless:true,locale:'vi-VN',timezoneId:'Asia/Bangkok',reducedMotion:'reduce',trace:'retain-on-failure',screenshot:'only-on-failure',video:'retain-on-failure'},
  reporter:[['list'],['json',{outputFile:path.join(root,'output/ci/browser-results.json')}],['html',{outputFolder:path.join(root,'output/ci/browser-report'),open:'never'}]],
  outputDir:path.join(root,'output/ci/browser-artifacts'),
  webServer:{cwd:root,command:'npm run dev -- --port 5199 --strictPort',url:'http://127.0.0.1:5199/tests/visual/notification.html',reuseExistingServer:false,timeout:60000},
});
