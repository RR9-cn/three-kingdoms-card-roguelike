import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newForge,forgeAction,previewForge,saveForge,loadForge,isForgeState,type ForgeState,type ForgeAction} from '@three-card/core';

const act=(s:ForgeState,a:Omit<ForgeAction,'seq'>)=>{const r=forgeAction(s,{...a,seq:s.seq});assert.equal(r.error,undefined);assert.ok(isForgeState(r.state));return r.state;};
const storage=()=>{const m=new Map<string,string>();return{m,get:(k:string)=>m.get(k)??null,set:(k:string,v:string)=>{m.set(k,v);}};};
function fixture(seed:string,withRetrigger=true){let s=newForge(seed);s.phase='prepare';s.companions=(withRetrigger?['zhangfei','pursuit','chain']:['pursuit']).map(id=>({id:id as any,growth:0}));s=act(s,{type:'begin'});s.hand=['spear-7','cavalry-7','bow-2','scheme-4','spear-1','bow-9'];s.draw=s.army.filter(c=>!s.hand.includes(c.id)).map(c=>c.id);s.discard=[];return s;}
function miss(){for(let i=0;i<200;i++){const s=fixture('momentum-'+i),out=act(s,{type:'play',ids:s.hand.slice(0,3)});if(out.result!.bursts===0)return s;}throw Error('expected a failing pursuit seed');}

test('failed pursuit gains bounded momentum while preview stays pure',()=>{const s=miss(),before=structuredClone(s),ids=s.hand.slice(0,3);previewForge(s,ids);previewForge(s,ids);assert.deepEqual(s,before);const out=act(s,{type:'play',ids});assert.equal(out.momentum,1);assert.ok(out.result!.steps.some(x=>x.text.includes('军势 0 → 1')));s.momentum=5;assert.equal(act(s,{type:'play',ids}).momentum,5);});

test('two momentum guarantees only the next eligible pursuit',()=>{const s=miss(),ids=s.hand.slice(0,3),plain=act(s,{type:'play',ids});let primed=structuredClone(s);primed.momentum=2;primed=act(primed,{type:'prime'});assert.equal(primed.momentum,0);assert.equal(primed.primed,true);const guaranteed=act(primed,{type:'play',ids});assert.equal(guaranteed.result!.bursts,1);assert.equal(guaranteed.primed,false);assert.equal(guaranteed.rng.enemy,plain.rng.enemy);assert.ok(guaranteed.result!.steps.some(x=>x.source==='聚势追击'));
 let noTrigger=fixture('no-trigger',false);noTrigger.momentum=2;noTrigger=act(noTrigger,{type:'prime'});const rng=noTrigger.rng.enemy;noTrigger=act(noTrigger,{type:'play',ids:noTrigger.hand.slice(0,3)});assert.equal(noTrigger.primed,true);assert.equal(noTrigger.rng.enemy,rng);
});

test('prime action is atomic and momentum survives v7 restart',()=>{let s=fixture('prime-save');assert.equal(forgeAction(s,{seq:s.seq,type:'prime'}).state,s);s.momentum=2;s=act(s,{type:'prime'});const store=storage();saveForge(store,s);assert.deepEqual(loadForge(store).state,s);assert.ok(store.m.has('three-card:forge:v7:0'));const stale=forgeAction(s,{seq:s.seq-1,type:'prime'});assert.equal(stale.state,s);});
