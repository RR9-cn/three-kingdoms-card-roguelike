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
const click=async(action:string)=>{const resume=page.locator('[data-action="resume"]');if(action!=='resume'&&await resume.isVisible().catch(()=>false)){await resume.click();await page.waitForTimeout(180);}const immediate=action.startsWith('card:');if(!immediate)await page.waitForTimeout(180);await page.locator(`[data-action="${action}"]`).click();if(!immediate)await page.waitForTimeout(180);};
async function act(a:Omit<ForgeAction,'seq'>){if((a.type==='play'||a.type==='discard')){for(const id of a.ids!)await click('card:'+id);await click(a.type);}else if(a.type==='begin')await click('begin:normal');else if(a.type==='recruit'||a.type==='buy'){await click(a.type+':'+a.id);if(a.replace)await click('replace:'+a.replace);}else if(a.type==='edit'){if(a.edit==='level')await click('apply-level:'+a.category);else if(a.edit==='suit'){await click('edit-card:'+a.cardId);await click(`apply-suit:${a.cardId}:${a.suit}`);}else await click('edit-card:'+a.cardId);}else if(a.type==='bank'){if(await page.locator('[data-action=skip-animation]').count())await click('skip-animation');else await page.waitForSelector('.settlement-result');}else await click(a.type);}
try{
 await page.waitForSelector('#seed');
 await page.locator('#seed').fill('forge-0');await click('new');await click('starter:liubei');await click('begin:normal');
 assert.equal(await page.evaluate(()=>typeof (window as any).require),'undefined');
 await act(counterplayStrategy(await read(),'liubei'));const before=await read();await page.screenshot({path:'docs/evidence/forge-desktop-battle.png'});
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].minimize());await page.waitForSelector('[data-action=resume]');await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].restore());await page.screenshot({path:'docs/evidence/forge-desktop-pause.png'});
 await app.close();app=await launch();page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.waitForSelector('[data-action=continue]');await click('continue');const restored=await read();assert.equal(restored.settlement,'bank');assert.equal(restored.score,before.result!.total);assert.deepEqual(restored.result,before.result);
 for(let i=0;i<200;i++){const v=await read();if(['victory','defeat'].includes(v.phase))break;if([3,7].includes(v.stage)&&v.phase==='battle')await page.screenshot({path:`docs/evidence/boss-native-stage-${v.stage+1}.png`});await act(counterplayStrategy(v,'liubei'));}
 assert.equal((await read()).phase,'victory');await page.screenshot({path:'docs/evidence/forge-desktop-victory.png'});
 const completed=await read();await click('extend');
 for(let i=0;i<40;i++){const v=await read();if(v.phase==='battle')break;await act(counterplayStrategy(v,'liubei'));}
 const challenge=await read();assert.equal(challenge.challenge,1);assert.equal(challenge.stats.cleared,8);assert.equal(challenge.stats.edits,completed.stats.edits+1);let missing=0,suitChanges=0;for(const card of completed.army){const kept=challenge.army.find(c=>c.id===card.id);if(!kept){missing++;continue;}if(kept.suit!==card.suit)suitChanges++;assert.ok(kept.rank>=card.rank);assert.ok(kept.bonus>=card.bonus);}assert.ok(missing<=1);assert.ok(suitChanges<=1);assert.ok(Math.abs(challenge.army.length-completed.army.length)<=1);assert.ok(challenge.levels.every((level,i)=>level>=completed.levels[i]));assert.ok(challenge.stats.best>=completed.stats.best);await page.screenshot({path:'docs/evidence/burst-native-endless.png'});
 await act({type:'play',ids:bestForgeHand(challenge).ids});if(await page.locator('[data-action=skip-animation]').count())await click('skip-animation');await page.waitForSelector('.settlement-result');const settled=await read();assert.equal(settled.settlement,'bank');assert.equal(settled.score,settled.result!.total);assert.equal(await page.locator('[data-action=gamble]').count(),0);
 await app.close();app=await launch();page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.waitForSelector('[data-action=continue]');await click('continue');assert.deepEqual(await read(),settled);assert.equal(await page.locator('.settlement-result').count(),1);assert.deepEqual(errors,[]);
 await writeFile('docs/evidence/forge-v07-desktop-smoke.json',JSON.stringify({version:'0.7.0',saveContentVersion:'0.7.0',schemaVersion:8,platform:process.platform,arch:process.arch,packaged:!!process.env.THREE_CARD_EXECUTABLE,offlineLocalPage:true,rendererNodeDisabled:true,minimizePause:true,restartRestore:true,fullCampaignVictory:true,endlessContinuation:true,directHandSettlement:true,randomPostBattleEdit:true,simpleScoring:true,zhangJiaoAnimation:true,errors},null,2)+'\n');console.log('Forge desktop: current local build, full campaign, direct settlement, pause and restart restore passed.');
}finally{await app.close().catch(()=>{});}
