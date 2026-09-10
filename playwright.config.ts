import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',workers:1,use:{channel:'chrome',headless:true,viewport:{width:1440,height:900}},webServer:{command:'npm run dev',url:'http://127.0.0.1:4173',reuseExistingServer:true},reporter:'list'});
