import {test,expect,type Page} from '@playwright/test';
const click=async(page:Page,action:string)=>{await page.locator(`[data-action="${action}"]`).click();await page.waitForTimeout(190);};
const state=(page:Page)=>page.evaluate(()=>JSON.parse((window as any).render_game_to_text()));
test('tutorial, visible information, save reload and desktop layouts',async({page})=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/legacy.html');await page.screenshot({path:'docs/evidence/home-1440.png'});await click(page,'tutorial');expect((await state(page)).view.battle.enemy.filter(Boolean)).toHaveLength(1);await page.screenshot({path:'docs/evidence/battle-1440.png'});await click(page,'show');expect((await state(page)).view.battle.enemyHp).toBe(12);await click(page,'next');await click(page,'own:1');await click(page,'exchange');expect((await state(page)).view.battle.player[1].rank).toBe(8);await click(page,'show');expect((await state(page)).view.battle.enemyHp).toBe(5);const before=(await state(page)).view;await page.reload();await click(page,'continue');expect((await state(page)).view).toEqual(before);await page.setViewportSize({width:1280,height:720});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.locator('[data-action=next]').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight)).toBe(true);await page.screenshot({path:'docs/evidence/battle-1280.png'});expect(errors).toEqual([]);});
test('single battle defeat through public UI commands',async({page})=>{await page.goto('http://127.0.0.1:4173/legacy.html');await click(page,'single');for(let i=0;i<30;i++){const b=(await state(page)).view.battle;if(b.phase==='battleEnd')break;await click(page,b.phase==='roundEnd'?'next':'withdraw');}expect((await state(page)).view.battle.victory).toBe(false);await click(page,'finish');expect((await state(page)).view.phase).toBe('defeat');await page.screenshot({path:'docs/evidence/defeat.png'});});
test('tutorial battle reaches victory through public UI',async({page})=>{await page.goto('http://127.0.0.1:4173/legacy.html');await page.locator('#seed').fill('battle-proof');await click(page,'tutorial');await click(page,'show');await click(page,'next');await click(page,'own:1');await click(page,'exchange');await click(page,'show');for(let i=0;i<30;i++){const b=(await state(page)).view.battle;if(b.phase==='battleEnd')break;await click(page,b.phase==='roundEnd'?'next':'show');}expect((await state(page)).view.battle.victory).toBe(true);await click(page,'finish');expect((await state(page)).view.phase).toBe('reward');await page.screenshot({path:'docs/evidence/reward.png'});});

test('complete seeded campaign, with mid-run reload and keyboard controls',async({page})=>{
 test.setTimeout(90000);await page.goto('http://127.0.0.1:4173/legacy.html');await page.locator('#seed').fill('balance-10');await click(page,'new');let restored=false;
 for(let step=0;step<250;step++){
  const v=(await state(page)).view;if(['victory','defeat'].includes(v.phase))break;
  if(!restored&&v.layer>=2){const before=v;await page.reload();await click(page,'continue');expect((await state(page)).view).toEqual(before);restored=true;}
  if(v.phase==='battle'){if(v.battle.phase==='battleEnd')await click(page,'finish');else{await page.keyboard.press('Enter');await page.waitForTimeout(190);}}
  else if(v.phase==='reward')await click(page,'claim:skip');
  else if(v.phase==='route')await click(page,'route:'+(v.routes.includes('camp')?'camp':v.routes.includes('event')?'event':v.routes.includes('battle')?'battle':v.routes[0]));
  else if(v.phase==='camp')await click(page,'camp:heal');
  else if(v.phase==='event')await click(page,v.event==='physician'?'event:0':'event:1');
  else await click(page,'leave');
 }
 expect((await state(page)).view.phase).toBe('victory');expect(restored).toBe(true);await page.screenshot({path:'docs/evidence/campaign-victory.png'});
});
