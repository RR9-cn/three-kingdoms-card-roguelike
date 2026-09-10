import {test,expect} from '@playwright/test';
import {newForge,forgeAction,saveForge,bossEncounter} from '@three-card/core';
function fixture(stage:number,second=false){let s=newForge('boss-browser-fixture');s.phase='prepare';s.stage=stage;s=forgeAction(s,{seq:s.seq,type:'begin'}).state;s.hand=['spear-1','cavalry-2','bow-3','scheme-4','spear-5','bow-8'];s.draw=s.army.filter(c=>!s.hand.includes(c.id)).map(c=>c.id);s.discard=[];s.score=second?bossEncounter(s)!.threshold:bossEncounter(s)!.threshold-1;s.scouted=true;return s;}
test('boss identity, transition, retained-card counterplay and reload at 1280',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 for(const stage of [3,7]){
 const s=fixture(stage,stage===7),saved:Record<string,string>={};saveForge({get:k=>saved[k]??null,set:(k,v)=>{saved[k]=v;}},s);
 await page.goto('http://127.0.0.1:4173');await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem(k,v);},saved);await page.reload();await page.locator('[data-action=continue]').click();await page.waitForTimeout(180);
 await expect(page.locator('.boss-identity h2')).toHaveText(stage===3?'张宝':'张角');
 for(const id of s.hand.slice(0,3))await page.locator(`[data-action="card:${id}"]`).click();
 await page.screenshot({path:'docs/evidence/boss-layout-check.png'});
 expect(await page.locator('[data-action=play]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(stage===7){await expect(page.locator('.ledger')).toContainText('以谋避雷');await page.locator('[data-action="card:bow-3"]').click();await page.locator('[data-action="card:scheme-4"]').click();await expect(page.locator('.ledger')).toContainText('未留下谋牌');await page.screenshot({path:'docs/evidence/boss-zhangjiao-1280.png'});}
 else{await page.locator('[data-action=play]').click();await page.waitForTimeout(180);if(await page.locator('[data-action=skip-animation]').count()){await page.locator('[data-action=skip-animation]').click();await page.waitForTimeout(180);}await page.locator('[data-action=bank]').click();await page.waitForTimeout(180);await expect(page.locator('.phase-shift')).toBeVisible();await expect(page.locator('[data-action=next]')).toHaveText('迎战第二阶段 →');await page.screenshot({path:'docs/evidence/boss-zhangbao-transition.png'});expect(await page.locator('[data-action=next]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight)).toBe(true);await page.reload();await page.locator('[data-action=continue]').click();await expect(page.locator('.phase-shift')).toBeVisible();}
 }
});
