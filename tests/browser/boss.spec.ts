import {test,expect} from '@playwright/test';
import {newForge,forgeAction,saveForge,bossEncounter,type ForgeState} from '@three-card/core';
function fixture(stage:number,second=false){let s=newForge('boss-browser-fixture');s.phase='prepare';s.stage=stage;s=forgeAction(s,{seq:s.seq,type:'begin'}).state;s.hand=['spear-1','cavalry-2','bow-3','scheme-4','spear-5','bow-8'];s.draw=s.army.filter(c=>!s.hand.includes(c.id)).map(c=>c.id);s.discard=[];s.score=second?bossEncounter(s)!.threshold:bossEncounter(s)!.threshold-1;s.scouted=true;return s;}
async function load(page:import('@playwright/test').Page,s:ForgeState){const saved:Record<string,string>={};saveForge({get:k=>saved[k]??null,set:(k,v)=>{saved[k]=v;}},s);await page.goto('http://127.0.0.1:4173');await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem(k,v);},saved);await page.reload();await page.locator('[data-action=continue]').click();await page.waitForTimeout(180);}
test('boss identity, transition, played-scheme counterplay and reload at 1280',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 for(const stage of [3,7]){
 const s=fixture(stage,stage===7),saved:Record<string,string>={};saveForge({get:k=>saved[k]??null,set:(k,v)=>{saved[k]=v;}},s);
 await page.goto('http://127.0.0.1:4173');await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem(k,v);},saved);await page.reload();await page.locator('[data-action=continue]').click();await page.waitForTimeout(180);
 await expect(page.locator('.boss-identity h2')).toHaveText(stage===3?'假面掮客':'终局收藏家');
 for(const id of s.hand.slice(0,3))await page.locator(`[data-action="card:${id}"]`).click();
 await page.screenshot({path:'docs/evidence/boss-layout-check.png'});
 expect(await page.locator('[data-action=play]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(stage===7){await expect(page.locator('.ledger')).toContainText('未上拍诡物');await page.locator('[data-action="card:bow-3"]').click();await page.locator('[data-action="card:scheme-4"]').click();await expect(page.locator('.ledger')).toContainText('诡物压场');await page.screenshot({path:'docs/evidence/boss-zhangjiao-1280.png'});}
 else{await page.locator('[data-action=play]').click();await page.waitForTimeout(180);if(await page.locator('[data-action=skip-animation]').count()){await page.locator('[data-action=skip-animation]').click();await page.waitForTimeout(180);}await expect(page.locator('.phase-shift')).toBeVisible();await expect(page.locator('[data-action=next]')).toHaveText('接受新条件 →');await page.screenshot({path:'docs/evidence/boss-zhangbao-transition.png'});expect(await page.locator('[data-action=next]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight)).toBe(true);await page.reload();await page.locator('[data-action=continue]').click();await expect(page.locator('.phase-shift')).toBeVisible();}
 }
});

test('signature buyers use distinct idle, bid, inspection and defeat states',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 let idle=fixture(7,true);await load(page,idle);await expect(page.locator('.buyer-portrait.buyer-state-idle')).toBeVisible();await expect(page.locator('.buyer-portrait')).toBeVisible();
 for(const id of ['spear-1','cavalry-2','scheme-4'])await page.locator(`[data-action="card:${id}"]`).click();await page.locator('[data-action=play]').click();await expect(page.locator('.buyer-portrait.buyer-state-hit')).toBeVisible();await expect(page.locator('.boss-sheltered')).toContainText('保留诡物，审查未能压价');await page.waitForTimeout(120);await page.screenshot({path:'docs/evidence/boss-zhangjiao-hit.png'});
 await load(page,idle);for(const id of idle.hand.slice(0,3))await page.locator(`[data-action="card:${id}"]`).click();await page.locator('[data-action=play]').click();await expect(page.locator('.boss-punished')).toContainText('禁品审查！本轮最终成交价 ×0.6');await expect(page.locator('.buyer-portrait.buyer-state-thunder')).toBeVisible();await expect(page.locator('.ledger')).toContainText('未上拍诡物：最终成交价 ×0.6');await page.screenshot({path:'docs/evidence/boss-zhangjiao-struck.png'});
 let thunder=fixture(7,false);thunder=forgeAction(thunder,{seq:thunder.seq,type:'play',ids:thunder.hand.slice(0,3)}).state;thunder=forgeAction(thunder,{seq:thunder.seq,type:'bank'}).state;await load(page,thunder);await expect(page.locator('.buyer-portrait.buyer-state-thunder')).toBeVisible();await expect(page.locator('.buyer-portrait')).toBeVisible();await page.waitForTimeout(500);await page.screenshot({path:'docs/evidence/boss-zhangjiao-thunder.png'});
 let defeated=fixture(7,true);defeated.score=defeated.target-1;defeated=forgeAction(defeated,{seq:defeated.seq,type:'play',ids:defeated.hand.slice(0,3)}).state;defeated=forgeAction(defeated,{seq:defeated.seq,type:'bank'}).state;await load(page,defeated);await expect(page.locator('.buyer-portrait.buyer-state-defeat')).toBeVisible();await page.waitForTimeout(800);await page.screenshot({path:'docs/evidence/boss-zhangjiao-defeat.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await load(page,fixture(7,true));const box=await page.locator('.buyer-portrait.buyer-state-idle').boundingBox();await page.waitForTimeout(300);expect(await page.locator('.buyer-portrait.buyer-state-idle').boundingBox()).toEqual(box);
});

test('home demo enters a disposable built final auction',async({page})=>{
 await page.goto('http://127.0.0.1:4173');await page.evaluate(()=>localStorage.clear());await page.reload();
 await page.getByRole('button',{name:'规则',exact:true}).click();await expect(page.locator('.formation-guide-row')).toHaveCount(6);await expect(page.locator('.formation-guide')).toContainText('连号专场');await expect(page.locator('.formation-guide')).toContainText('估值 × 6');await page.screenshot({path:'docs/evidence/formation-rules.png'});await page.waitForTimeout(180);await page.locator('[data-action=close]').click();await page.waitForTimeout(180);
 await expect(page.locator('[data-action=demo]')).toHaveText('竞价试玩 · 直达最后一槌');await page.locator('[data-action=demo]').click();await page.waitForTimeout(180);
 await expect(page.locator('.demo-strip')).toContainText('临时牌局，不会覆盖当前夜拍');await expect(page.locator('.demo-strip')).not.toContainText(/双生客|红手套|落槌人|抬价人/);await expect(page.locator('[aria-label="终局收藏家签名买家"]')).toBeVisible();await expect(page.locator('.band-card')).toHaveCount(5);await expect(page.locator('.buyer-portrait.buyer-state-idle')).toBeVisible();await expect(page.locator('[data-action=prime]')).toHaveCount(0);await expect(page.locator('.momentum-panel')).toHaveCount(0);
 for(const id of ['spear-7','cavalry-7','bow-9'])await page.locator(`[data-action="card:${id}"]`).click();await expect(page.locator('.formation-definition')).toContainText('其中两张估值相同');await page.locator('[data-action=play]').click();await page.waitForTimeout(180);await page.locator('[data-action=skip-animation]').click();await expect(page.locator('.chain-tier')).toContainText(/举牌|竞价升温|全场失控/);await page.screenshot({path:'docs/evidence/chain-feedback.png'});
 expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('three-card:forge')).length)).toBe(0);
 await page.locator('[data-action=home]').click();await expect(page.locator('[data-action=continue]')).toHaveCount(0);
});
