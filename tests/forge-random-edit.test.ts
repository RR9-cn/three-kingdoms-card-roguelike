import {test} from 'node:test';
import assert from 'node:assert/strict';
import {copy,forgeAction,isForgeState,newForge,type ForgeAction,type ForgeState} from '@three-card/core';

const act=(state:ForgeState,action:Omit<ForgeAction,'seq'>)=>{
 const result=forgeAction(state,{...action,seq:state.seq});
 assert.equal(result.error,undefined);
 assert.ok(isForgeState(result.state));
 return result.state;
};

function forge(seed:string){const state=newForge(seed);state.phase='forge';return state;}

test('random post-battle edit is deterministic and applies exactly one positive result',()=>{
 const seen=new Set<string>();
 for(let i=0;i<400;i++){
  const before=forge(`random-edit-${i}`),snapshot=copy(before);
  const after=act(before,{type:'random-edit'}),again=act(copy(snapshot),{type:'random-edit'});
  assert.deepEqual(after,again);
  assert.equal(after.phase,'shop');
  assert.equal(after.stats.edits,1);
  assert.ok(after.lastEdit);
  assert.equal(after.offers.length,3);
  const kind=after.lastEdit!.split('：')[0];seen.add(kind);
  const oldCards=new Map(snapshot.army.map(c=>[c.id,c]));
  const changedCards=after.army.filter(c=>{const old=oldCards.get(c.id);return !old||old.rank!==c.rank||old.bonus!==c.bonus||old.suit!==c.suit;});
  const levelGain=after.levels.reduce((a,b)=>a+b,0)-snapshot.levels.reduce((a,b)=>a+b,0);
  if(kind==='军师募兵'){assert.equal(after.army.length,snapshot.army.length+1);assert.equal(changedCards.length,1);assert.ok(changedCards[0].id.startsWith('copy-'));assert.equal(levelGain,0);}
  if(kind==='军师练兵'){assert.equal(after.army.length,snapshot.army.length);assert.equal(changedCards.length,1);assert.ok(changedCards[0].rank>oldCards.get(changedCards[0].id)!.rank);assert.equal(levelGain,0);}
  if(kind==='军师精锐'){assert.equal(after.army.length,snapshot.army.length);assert.equal(changedCards.length,1);assert.equal(changedCards[0].bonus,oldCards.get(changedCards[0].id)!.bonus+12);assert.equal(levelGain,0);}
  if(kind==='军师研习'){assert.equal(after.army.length,snapshot.army.length);assert.equal(changedCards.length,0);assert.equal(levelGain,1);}
 }
 assert.deepEqual([...seen].sort(),['军师募兵','军师研习','军师精锐','军师练兵'].sort());
});

test('ineligible edit types leave the random pool and skip applies no edit',()=>{
 let full=forge('full-ranks');
 full.army=Array.from({length:60},(_,i)=>({...full.army[i%full.army.length],id:`full-${i}`,rank:9}));
 const before=copy(full),after=act(full,{type:'random-edit'});
 assert.equal(after.army.length,60);
 assert.ok(after.lastEdit?.startsWith('军师精锐')||after.lastEdit?.startsWith('军师研习'));
 assert.ok(after.army.some((c,i)=>c.bonus>before.army[i].bonus)||after.levels.some((n,i)=>n>before.levels[i]));

 const skipped=forge('skip-edit');
 const result=act(skipped,{type:'edit',id:'skip'}),replayed=act(copy(skipped),{type:'edit',id:'skip'});
 assert.deepEqual(result,replayed);
 assert.equal(result.gold,skipped.gold+3);
 assert.equal(result.stats.edits,0);
 assert.equal(result.lastEdit,null);
});

test('random edit rejects wrong phase and duplicate sequence atomically',()=>{
 const state=newForge('invalid-random-edit'),snapshot=copy(state);
 const invalid=forgeAction(state,{seq:state.seq,type:'random-edit'});
 assert.ok(invalid.error);
 assert.equal(invalid.state,state);
 assert.deepEqual(state,snapshot);

 const first=act(forge('duplicate-random-edit'),{type:'random-edit'});
 const duplicate=forgeAction(first,{seq:first.seq-1,type:'random-edit'});
 assert.ok(duplicate.error);
 assert.equal(duplicate.state,first);
});
