import {counterplayStrategy} from './forge-counterplay';
import {_electron as electron,type Page} from '@playwright/test';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import type {ForgeView,ForgeAction} from '@three-card/core';
import {bestForgeHand,forgeStrategy} from './forge-strategy';
const userData=await mkdtemp(path.join(tmpdir(),'three-card-forge-'));
const launch=()=>electron.launch({...(process.env.THREE_CARD_EXECUTABLE?{executablePath:process.env.THREE_CARD_EXECUTABLE,args:[]}:{args:['apps/desktop/main.cjs']}),env:{...process.env,THREE_CARD_USER_DATA:userData}});
let app=await launch();let page=await app.firstWindow();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
const read=()=>page.evaluate(()=>JSON.parse((window as any).render_game_to_text()).view) as Promise<ForgeView>;
const click=async(action:string)=>{await page.locator(`[data-action="${action}"]`).click();if(!action.startsWith('card:'))await page.waitForTimeout(180);};
async function act(a:Omit<ForgeAction,'seq'>){if((a.type==='play'||a.type==='discard')){for(const id of a.ids!)await click('card:'+id);await click(a.type);}else if(a.type==='begin')await click('begin:normal');else if(a.type==='recruit'||a.type==='buy'){await click(a.type+':'+a.id);if(a.replace)await click('replace:'+a.replace);}else if(a.type==='reorder')await click((a.direction===1?'right:':'left:')+a.id);else{if(a.type==='bank'&&await page.locator('[data-action=skip-animation]').count())await click('skip-animation');await click(a.type);}}
try{
 await page.waitForSelector('#seed');await page.locator('.legacy-link').click();await page.waitForSelector('[data-action=tutorial]');await page.locator('a[href="./index.html"]').click();await page.waitForSelector('#seed');
 await page.locator('#seed').fill('forge-v051-7');await click('new');await click('starter:liubei');await click('begin:normal');
 assert.equal(await page.evaluate(()=>typeof (window as any).require),'undefined');
 await act(counterplayStrategy(await read(),'liubei'));const before=await read();await page.screenshot({path:'docs/evidence/forge-desktop-battle.png'});
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].minimize());await page.waitForSelector('[data-action=resume]');await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].restore());await page.screenshot({path:'docs/evidence/forge-desktop-pause.png'});
 await app.close();app=await launch();page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.waitForSelector('[data-action=continue]');await click('continue');assert.deepEqual(await read(),before);
 for(let i=0;i<200;i++){const v=await read();if(['victory','defeat'].includes(v.phase))break;if([3,7].includes(v.stage)&&v.phase==='battle')await page.screenshot({path:`docs/evidence/boss-native-stage-${v.stage+1}.png`});await act(counterplayStrategy(v,'liubei'));}
 assert.equal((await read()).phase,'victory');await page.screenshot({path:'docs/evidence/forge-desktop-victory.png'});
 const completed=await read();await click('extend');
 for(let i=0;i<40;i++){const v=await read();if(v.phase==='battle')break;await act(counterplayStrategy(v,'liubei'));}
 const challenge=await read();assert.equal(challenge.challenge,1);assert.equal(challenge.stats.cleared,8);assert.equal(challenge.stats.edits,completed.stats.edits+1);for(const card of completed.army){const kept=challenge.army.find(c=>c.id===card.id);assert.ok(kept);assert.equal(kept.suit,card.suit);assert.ok(kept.rank>=card.rank);assert.ok(kept.bonus>=card.bonus);}assert.ok(challenge.levels.every((level,i)=>level>=completed.levels[i]));assert.ok(challenge.stats.best>=completed.stats.best);await page.screenshot({path:'docs/evidence/burst-native-endless.png'});
 await act({type:'play',ids:bestForgeHand(challenge).ids});if(await page.locator('[data-action=skip-animation]').count())await click('skip-animation');await click('gamble');const wagered=await read();assert.ok(['win','loss'].includes(wagered.settlement));await page.screenshot({path:'docs/evidence/burst-native-wager.png'});
 await app.close();app=await launch();page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.waitForSelector('[data-action=continue]');await click('continue');assert.deepEqual(await read(),wagered);assert.equal(await page.locator('[data-action=gamble]').count(),0);assert.deepEqual(errors,[]);
 await writeFile('docs/evidence/forge-v051-desktop-smoke.json',JSON.stringify({version:'0.5.1',platform:process.platform,arch:process.arch,packaged:!!process.env.THREE_CARD_EXECUTABLE,offlineLocalPages:true,legacyNavigation:true,rendererNodeDisabled:true,minimizePause:true,restartRestore:true,fullCampaignVictory:true,endlessContinuation:true,wagerSettledAndRestored:true,randomPostBattleEdit:true,errors},null,2)+'\n');console.log('Forge desktop: native campaign, random edit, local legacy navigation, pause and restart restore passed.');
}finally{await app.close().catch(()=>{});}
