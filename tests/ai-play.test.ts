import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {AiPlayService} from '../tools/ai-play-lib';

test('interactive AI play exposes all public hand choices and auto-settles a play',async()=>{
 const root=await mkdtemp(join(tmpdir(),'three-card-ai-play-'));
 try{
  const service=new AiPlayService(root),start=await service.handle({schemaVersion:1,operation:'start',seed:'agent-run',starter:'liubei'}) as any;
  assert.equal(start.phase,'battle');assert.equal(start.hand.length,6);assert.equal(start.combinations.length,20);assert.match(start.actions[0],/^play/);assert.ok(!JSON.stringify(start).includes('"rng"'));assert.ok(!JSON.stringify(start).includes('"draw"'));
  const best=start.combinations[0],next=await service.handle({schemaVersion:1,operation:'act',sessionId:start.sessionId,turn:start.turn,decision:{type:'play',cards:best[0]}}) as any;
  assert.ok(next.turn>=start.turn+3);assert.ok(['battle','shop','defeat'].includes(next.phase));assert.equal(next.lastResult.guaranteed,best[2]);assert.ok(next.lastResult.actual>=0);
  await assert.rejects(()=>service.handle({schemaVersion:1,operation:'act',sessionId:start.sessionId,turn:start.turn,decision:{type:'play',cards:[1,2,3]}}),/stale turn/);
  const history=await new AiPlayService(root).handle({schemaVersion:1,operation:'history',sessionId:start.sessionId}) as any;assert.equal(history.history.length,1);assert.equal(history.history[0].kind,'play');
  const closed=await service.handle({schemaVersion:1,operation:'close',sessionId:start.sessionId}) as any;assert.equal(closed.closed,true);await assert.rejects(()=>service.handle({schemaVersion:1,operation:'observe',sessionId:start.sessionId}),/not found/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('interactive AI can reach the shop and depart directly into the next battle',async()=>{
 const root=await mkdtemp(join(tmpdir(),'three-card-ai-shop-'));
 try{
  const service=new AiPlayService(root);let view=await service.handle({schemaVersion:1,operation:'start',seed:'shop-run',starter:'zhouyu'}) as any;
  for(let i=0;i<4&&view.phase==='battle';i++)view=await service.handle({schemaVersion:1,operation:'act',sessionId:view.sessionId,turn:view.turn,decision:{type:'play',cards:view.combinations[0][0]}}) as any;
  assert.equal(view.phase,'shop');assert.equal(view.offers.length,3);assert.ok(view.editOffer);assert.equal(view.nextStage.name,'长坂试锋');
  view=await service.handle({schemaVersion:1,operation:'act',sessionId:view.sessionId,turn:view.turn,decision:{type:'buy_edit'}}) as any;assert.equal(view.phase,'forge');assert.ok(view.targets.length>=6);
  const edit=view.edit.type,first=view.targets[0],decision=edit==='level'?{type:'apply_edit',category:1}:{type:'apply_edit',target:first[0],...edit==='suit'?{suit:String(first[1]).startsWith('谋')?'spear':'scheme'}:{}};
  view=await service.handle({schemaVersion:1,operation:'act',sessionId:view.sessionId,turn:view.turn,decision}) as any;assert.equal(view.phase,'shop');
  view=await service.handle({schemaVersion:1,operation:'act',sessionId:view.sessionId,turn:view.turn,decision:{type:'depart',pressure:true}}) as any;
  assert.equal(view.phase,'battle');assert.equal(view.stage.number,2);assert.equal(view.stage.target,330);
 }finally{await rm(root,{recursive:true,force:true});}
});
