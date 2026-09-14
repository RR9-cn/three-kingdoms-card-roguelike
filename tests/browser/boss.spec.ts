import {test,expect} from '@playwright/test';
import {newForge,forgeAction,saveForge,bossEncounter,type ForgeState} from '@three-card/core';
function fixture(stage:number,second=false){let s=newForge('boss-browser-fixture');s.phase='prepare';s.stage=stage;s=forgeAction(s,{seq:s.seq,type:'begin'}).state;s.hand=['spear-1','cavalry-2','bow-3','scheme-4','spear-5','bow-8'];s.draw=s.army.filter(c=>!s.hand.includes(c.id)).map(c=>c.id);s.discard=[];s.score=second?bossEncounter(s)!.threshold:bossEncounter(s)!.threshold-1;s.scouted=true;return s;}
async function load(page:import('@playwright/test').Page,s:ForgeState){const saved:Record<string,string>={};saveForge({get:k=>saved[k]??null,set:(k,v)=>{saved[k]=v;}},s);await page.goto('http://127.0.0.1:4173');await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem(k,v);},saved);await page.reload();await page.locator('[data-action=continue]').click();await page.waitForTimeout(180);}
test('boss identity, transition, played-scheme counterplay and reload at 1280',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 for(const stage of [3,7]){
 const s=fixture(stage,stage===7),saved:Record<string,string>={};saveForge({get:k=>saved[k]??null,set:(k,v)=>{saved[k]=v;}},s);
 await page.goto('http://127.0.0.1:4173');await page.evaluate(data=>{localStorage.clear();for(const[k,v]of Object.entries(data))localStorage.setItem(k,v);},saved);await page.reload();await page.locator('[data-action=continue]').click();await page.waitForTimeout(180);
 await expect(page.locator('.boss-identity h2')).toHaveText(stage===3?'张宝':'张角');
 for(const id of s.hand.slice(0,3))await page.locator(`[data-action="card:${id}"]`).click();
 await page.screenshot({path:'docs/evidence/boss-layout-check.png'});
 expect(await page.locator('[data-action=play]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(stage===7){await expect(page.locator('.ledger')).toContainText('未打出谋牌');await page.locator('[data-action="card:bow-3"]').click();await page.locator('[data-action="card:scheme-4"]').click();await expect(page.locator('.ledger')).toContainText('以谋避雷');await page.screenshot({path:'docs/evidence/boss-zhangjiao-1280.png'});}
 else{await page.locator('[data-action=play]').click();await page.waitForTimeout(180);if(await page.locator('[data-action=skip-animation]').count()){await page.locator('[data-action=skip-animation]').click();await page.waitForTimeout(180);}await expect(page.locator('.phase-shift')).toBeVisible();await expect(page.locator('[data-action=next]')).toHaveText('迎战第二阶段 →');await page.screenshot({path:'docs/evidence/boss-zhangbao-transition.png'});expect(await page.locator('[data-action=next]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight)).toBe(true);await page.reload();await page.locator('[data-action=continue]').click();await expect(page.locator('.phase-shift')).toBeVisible();}
 }
});

test('Zhang Jiao uses distinct idle, hit, thunder and defeat pixel motions',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 let idle=fixture(7,true);await load(page,idle);await expect(page.locator('[data-boss-motion=idle]')).toBeVisible();await expect(page.locator('.boss-actor')).toBeVisible();
 for(const id of ['spear-1','cavalry-2','scheme-4'])await page.locator(`[data-action="card:${id}"]`).click();await page.locator('[data-action=play]').click();await expect(page.locator('[data-boss-motion=hit]')).toBeVisible();await expect(page.locator('.boss-sheltered')).toContainText('谋牌避雷！本手攻势未被削减');await page.waitForTimeout(220);await expect(page.locator('[data-boss-motion=hit]')).toHaveAttribute('src',/hit-[1-5]\.png/);await page.screenshot({path:'docs/evidence/boss-zhangjiao-hit.png'});
 await load(page,idle);for(const id of idle.hand.slice(0,3))await page.locator(`[data-action="card:${id}"]`).click();await page.locator('[data-action=play]').click();await expect(page.locator('.boss-punished')).toContainText('天雷命中！本手最终攻势 ×0.6');await expect(page.locator('[data-boss-motion=thunder]')).toBeVisible();await expect(page.locator('.ledger')).toContainText('未打出谋牌：最终攻势 ×0.6');await page.screenshot({path:'docs/evidence/boss-zhangjiao-struck.png'});
 let thunder=fixture(7,false);thunder=forgeAction(thunder,{seq:thunder.seq,type:'play',ids:thunder.hand.slice(0,3)}).state;thunder=forgeAction(thunder,{seq:thunder.seq,type:'bank'}).state;await load(page,thunder);await expect(page.locator('[data-boss-motion=thunder]')).toBeVisible();await expect(page.locator('.boss-lightning.one')).toBeVisible();await page.waitForTimeout(500);await page.screenshot({path:'docs/evidence/boss-zhangjiao-thunder.png'});
 let defeated=fixture(7,true);defeated.score=defeated.target-1;defeated=forgeAction(defeated,{seq:defeated.seq,type:'play',ids:defeated.hand.slice(0,3)}).state;defeated=forgeAction(defeated,{seq:defeated.seq,type:'bank'}).state;await load(page,defeated);await expect(page.locator('[data-boss-motion=defeat]')).toBeVisible();await page.waitForTimeout(800);await page.screenshot({path:'docs/evidence/boss-zhangjiao-defeat.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await load(page,fixture(7,true));const src=await page.locator('[data-boss-motion=idle]').getAttribute('src');await page.waitForTimeout(300);expect(await page.locator('[data-boss-motion=idle]').getAttribute('src')).toBe(src);
});

test('home demo enters a disposable built Zhang Jiao battle',async({page})=>{
 await page.goto('http://127.0.0.1:4173');await page.evaluate(()=>localStorage.clear());await page.reload();
 await page.getByRole('button',{name:'规则',exact:true}).click();await expect(page.locator('.formation-guide-row')).toHaveCount(6);await expect(page.locator('.formation-guide')).toContainText('同袍连阵');await expect(page.locator('.formation-guide')).toContainText('点数 × 6');await page.screenshot({path:'docs/evidence/formation-rules.png'});await page.waitForTimeout(180);await page.locator('[data-action=close]').click();await page.waitForTimeout(180);
 await expect(page.locator('[data-action=demo]')).toHaveText('连锁试玩 · 直达张角');await page.locator('[data-action=demo]').click();await page.waitForTimeout(180);
 await expect(page.locator('.demo-strip')).toContainText('临时牌局，不会覆盖当前征程');await expect(page.locator('.demo-strip')).not.toContainText(/张飞|马超|诸葛亮|陆逊/);await expect(page.locator('[aria-label="张角首领战"]')).toBeVisible();await expect(page.locator('.band-card')).toHaveCount(5);await expect(page.locator('[data-boss-motion=idle]')).toBeVisible();await expect(page.locator('[data-action=prime]')).toHaveCount(0);await expect(page.locator('.momentum-panel')).toHaveCount(0);
 for(const id of ['spear-7','cavalry-7','bow-9'])await page.locator(`[data-action="card:${id}"]`).click();await expect(page.locator('.formation-definition')).toContainText('其中两张点数相同');await page.locator('[data-action=play]').click();await page.waitForTimeout(180);await page.locator('[data-action=skip-animation]').click();await expect(page.locator('.chain-tier')).toContainText(/追击|连营|破军/);await page.screenshot({path:'docs/evidence/chain-feedback.png'});
 expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('three-card:forge')).length)).toBe(0);
 await page.locator('[data-action=home]').click();await expect(page.locator('[data-action=continue]')).toHaveCount(0);
});
