import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newForge,forgeAction,previewForge,copy,saveForge,loadForge,type ForgeState,type ForgeAction} from '@three-card/core';
const act=(s:ForgeState,a:Omit<ForgeAction,'seq'>)=>{const r=forgeAction(s,{...a,seq:s.seq});assert.equal(r.error,undefined);return r.state;};
function battle(stage:number){let s=newForge('threat');s=act(s,{type:'starter',id:'liubei'});s.stage=stage;return act(s,{type:'begin'});}
test('ambush lifts only for this hand; preview equals committed result and restore',()=>{
 let s=battle(3);s.target=99999;const ids=s.hand.slice(0,3),before=previewForge(s,ids);assert.equal(before.penalty,.65);
 const kept=[...ids];s=act(s,{type:'discard',ids:[s.hand[5]]});assert.ok(kept.every(id=>s.hand.includes(id)));assert.equal(s.discards,1);const p=previewForge(s,ids);assert.equal(p.penalty,1);assert.equal(before.total,Math.floor(p.chips*p.mult*.65));
 const map=new Map<string,string>();const storage={get:(k:string)=>map.get(k)??null,set:(k:string,v:string)=>{map.set(k,v);}};saveForge(storage,s);assert.deepEqual(loadForge(storage).state,s);
 s=act(s,{type:'play',ids});assert.equal(s.result?.total,p.total);s=act(s,{type:'next'});assert.equal(s.scouted,false);assert.equal(s.discards,1);assert.equal(previewForge(s,s.hand.slice(0,3)).penalty,.65);
});
test('invalid redraw cannot lift ambush or consume randomness',()=>{const s=battle(3);const snapshot=copy(s);const r=forgeAction(s,{seq:s.seq,type:'discard',ids:[s.hand[0],s.hand[0]]});assert.ok(r.error);assert.equal(r.state,s);assert.deepEqual(s,snapshot);});
test('ordinary journey battles preserve baseline scoring despite prior hand state',()=>{for(const stage of [0,1,2,4,5,6]){const s=battle(stage),ids=s.hand.slice(0,3),category=previewForge(s,ids).category;s.lastSuit=s.army.find(c=>c.id===ids[0])!.suit;s.lastCategory=category;const p=previewForge(s,ids);assert.equal(p.penalty,1);const r=act(s,{type:'play',ids});assert.equal(r.result?.total,p.total);assert.equal(r.lastSuit,p.cards[0].suit);}});
test('seal damage increase is lower than pressure target increase',()=>{let s=battle(0);s.companions=[{id:'seal',growth:0}];const ids=s.hand.slice(0,3),plain=previewForge(s,ids);s.pressed=true;const pressed=previewForge(s,ids);assert.equal(pressed.mult,plain.mult*1.25);s.phase='prepare';s=act(s,{type:'begin',pressed:true});assert.equal(s.target,270);assert.ok(pressed.total/270<plain.total/180);});

test('older build saves are preserved and never loaded under new targets',()=>{const map=new Map([['three-card:forge:v7:0','old-payload']]);const storage={get:(k:string)=>map.get(k)??null,set:(k:string,v:string)=>{map.set(k,v);}};assert.equal(loadForge(storage).state,null);assert.ok(loadForge(storage).notice);saveForge(storage,newForge('new'));assert.equal(map.get('three-card:forge:v7:0'),'old-payload');assert.equal(loadForge(storage).state?.contentVersion,'0.7.0');});
