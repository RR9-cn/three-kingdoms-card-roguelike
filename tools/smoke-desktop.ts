import {_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const dir=await mkdtemp(join(tmpdir(),'midnight-native-'));
const app=await electron.launch({args:['apps/desktop/main.cjs'],env:{...process.env,THREE_CARD_USER_DATA:dir}});
try{const page=await app.firstWindow();await page.waitForSelector('#seed');await page.locator('#seed').fill('smoke-0');await page.locator('[data-action="start"]').click();await page.waitForSelector('.hand .card');assert.equal(await page.locator('.hand').evaluate(e=>getComputedStyle(e).display),'grid');for(let i=0;i<3;i++)await page.locator('.hand .card').nth(i).click();await page.locator('[data-action="play"]').click();await page.locator('[data-action="skip"]').click();await page.screenshot({path:'docs/evidence/trigger-desktop.png',fullPage:true});const total=await page.locator('.scoreboard strong').innerText();await page.reload();await page.locator('[data-action="resume"]').click();assert.equal(await page.locator('.scoreboard strong').innerText(),total);console.log(JSON.stringify({platform:process.platform,launch:true,styles:true,play:true,restore:true,total}));}finally{await app.close();await rm(dir,{recursive:true,force:true});}
