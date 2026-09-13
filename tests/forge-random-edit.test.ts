import {test} from 'node:test';
import assert from 'node:assert/strict';
import {copy,forgeAction,isForgeState,newForge,type ForgeAction,type ForgeState} from '@three-card/core';
import type {ForgeEdit} from '@three-card/content';

const act=(state:ForgeState,action:Omit<ForgeAction,'seq'>)=>{const result=forgeAction(state,{...action,seq:state.seq});assert.equal(result.error,undefined);assert.ok(isForgeState(result.state));return result.state;};
function forge(seed:string){const state=newForge(seed);state.phase='forge';return state;}
function resolve(state:ForgeState){const edit=state.pendingEdit!;if(edit==='level')return act(state,{type:'edit',edit,category:2});const card=state.army.find(c=>edit!=='rank'||c.rank<9)!;return act(state,{type:'edit',edit,cardId:card.id,...edit==='suit'?{suit:card.suit==='scheme'?'spear':'scheme'}:{}});}

test('random edit reveals one saved type, then player target applies exactly once',()=>{const seen=new Set<ForgeEdit>();for(let i=0;i<500;i++){const before=forge(`target-edit-${i}`),revealed=act(before,{type:'random-edit'}),again=act(copy(before),{type:'random-edit'});assert.deepEqual(revealed,again);assert.equal(revealed.phase,'forge');assert.ok(revealed.pendingEdit);assert.equal(revealed.stats.edits,0);seen.add(revealed.pendingEdit!);const after=resolve(revealed);assert.equal(after.phase,'shop');assert.equal(after.pendingEdit,null);assert.equal(after.stats.edits,1);assert.ok(after.lastEdit);assert.equal(after.offers.length,3);}assert.deepEqual([...seen].sort(),['remove','copy','rank','enhance','suit','level'].sort());});

test('revealed edit rejects reroll, skip and mismatched action atomically',()=>{const revealed=act(forge('locked-edit'),{type:'random-edit'});for(const action of [{type:'random-edit'},{type:'edit',id:'skip'},{type:'edit',edit:revealed.pendingEdit==='level'?'copy':'level',category:1,cardId:revealed.army[0].id}] as Omit<ForgeAction,'seq'>[]){const result=forgeAction(revealed,{...action,seq:revealed.seq});assert.ok(result.error);assert.equal(result.state,revealed);}});

test('ineligible types leave reveal pool and skipping before reveal gives gold',()=>{let full=forge('full-ranks');full.army=Array.from({length:60},(_,i)=>({...full.army[i%full.army.length],id:`full-${i}`,rank:9}));for(let i=0;i<100;i++){const state=copy(full);state.seed=`full-${i}`;state.rng=newForge(state.seed).rng;const revealed=act(state,{type:'random-edit'});assert.ok(!['copy','rank'].includes(revealed.pendingEdit!));}const skipped=act(forge('skip-edit'),{type:'edit',id:'skip'});assert.equal(skipped.phase,'shop');assert.equal(skipped.gold,15);assert.equal(skipped.stats.edits,0);});

test('old v8 state without pendingEdit remains loadable',()=>{const state:any=newForge('old-state');delete state.pendingEdit;assert.equal(isForgeState(state),true);assert.equal(state.pendingEdit,null);});
