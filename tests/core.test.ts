import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { deck, evaluate, compare, newBattle, battleAction, playerView, aiView, enemyYields, randomState, random, shuffle, copy, type Card, type BattleState, type BattleAction } from '@three-card/core';
import { ENEMIES, validateContent, type Suit } from '@three-card/content';
const hand = (ranks: number[], suits: Suit[] = ['spear','cavalry','bow']): Card[] => ranks.map((rank,i) => ({ id:`test-${i}`, suit:suits[i], rank }));
const act = (s: BattleState, a: Omit<BattleAction,'seq'>) => { const r=battleAction(s,{...a,seq:s.seq}); assert.equal(r.error,undefined); return r.state; };
function duel(player=hand([4,5,6]), enemy=hand([8,8,2])) { const s=newBattle('fixture'); s.player=player; s.enemy=enemy; s.aiRoll=.99; return s; }

test('content validation and core platform independence',()=>{validateContent();for(const f of readdirSync('packages/core/src').filter(f=>f.endsWith('.ts'))){const code=readFileSync(`packages/core/src/${f}`,'utf8');assert.doesNotMatch(code,/\b(?:document|window|wx|Math\.random|Date\.now)\b/);}});
test('all 7140 base hands match independently counted distribution and permutations',()=>{
  const cards=deck(), counts=[0,0,0,0,0,0];
  for(let i=0;i<34;i++)for(let j=i+1;j<35;j++)for(let k=j+1;k<36;k++){
    const h=[cards[i],cards[j],cards[k]], value=evaluate(h); counts[value.category]++;
    assert.deepEqual(evaluate([h[2],h[0],h[1]]),value); assert.deepEqual(evaluate([h[1],h[0],h[2]]),value);
  }
  assert.deepEqual(counts,[4620,1728,420,308,28,36]);
});
test('rank boundaries, pair kicker, flush tiebreak and suit independence',()=>{
  assert.equal(evaluate(hand([1,2,3])).category,2);assert.equal(evaluate(hand([7,8,9])).category,2);assert.equal(evaluate(hand([9,1,2])).category,0);
  assert.equal(compare(hand([9,9,2]),hand([8,8,9])),1);assert.equal(compare(hand([9,9,2]),hand([9,9,3])),-1);
  assert.equal(compare(hand([7,8,9]),hand([9,8,7],['bow','spear','scheme'])),0);
  assert.equal(compare(hand([2,5,9],['bow','bow','bow']),hand([2,6,9],['spear','spear','spear'])),-1);
});
test('temporary duplicate faces are legal, duplicate physical cards rejected',()=>{
  assert.equal(evaluate(hand([7,7,7],['spear','spear','spear'])).category,5);
  const c=deck()[0];assert.throws(()=>evaluate([c,c,c]));assert.throws(()=>evaluate(hand([0,4,5])));
});
test('comparison is antisymmetric on seeded pairs and category trumps rank',()=>{
  const rng=randomState('order');for(let i=0;i<200;i++){const a=shuffle(deck(),rng,'player').slice(0,3),b=shuffle(deck(),rng,'enemy').slice(0,3);assert.equal(compare(a,b)+compare(b,a),0);}
  assert.equal(compare(hand([1,1,1]),hand([7,8,9],['spear','spear','spear'])),1);
});
test('random streams serialize and remain independent',()=>{
  const golden=randomState('reference');assert.deepEqual(Array.from({length:4},()=>random(golden,'player')),[0.41321895411238074,0.49045233777724206,0.49741989001631737,0.32776282308623195]);
  const a=randomState('seed'),b=copy(a);random(a,'ai');assert.equal(random(a,'player'),random(b,'player'));
  const restored=JSON.parse(JSON.stringify(a));assert.equal(random(a,'enemy'),random(restored,'enemy'));
  assert.equal(new Set(shuffle(deck(),a,'player').map(c=>c.id)).size,36);
});
test('replay including invalid action is identical and immutable',()=>{
  const original=newBattle('replay'), snapshot=copy(original);
  const invalid=battleAction(original,{type:'scout',seq:0,slot:0});assert.equal(invalid.state,original);assert.ok(invalid.error);
  const a=act(original,{type:'exchange',slot:1});const b=act(invalid.state,{type:'exchange',slot:1});assert.deepEqual(a,b);assert.deepEqual(original,snapshot);
});
test('Zhao Yun first exchange free; White Horse second costs one; no redraw of discarded card',()=>{
  let s=newBattle('white',{relics:['white-horse']});const discarded=s.player[0].id;s=act(s,{type:'exchange',slot:0});assert.equal(s.command,2);assert.ok(!s.reserve.some(c=>c.id===discarded));
  s=act(s,{type:'exchange',slot:1});assert.equal(s.command,1);const invalid=battleAction(s,{type:'exchange',slot:2,seq:s.seq});assert.ok(invalid.error);assert.equal(invalid.state,s);
});
test('scouting target and count are validated before resource consumption',()=>{
  let s=newBattle('scout');s=act(s,{type:'scout',slot:1});assert.equal(s.command,1);assert.ok(playerView(s).enemy[1]);
  for(const slot of [1,2,4]){const bad=battleAction(s,{seq:s.seq,type:'scout',slot});assert.ok(bad.error);assert.equal(bad.state,s);}
});
test('Advance re-evaluates hand and cannot affect rank nine',()=>{
  let s=duel(hand([4,5,5]));s=act(s,{type:'tactic',tactic:'advance',slot:2});assert.equal(evaluate(s.player).category,2);assert.equal(s.command,1);
  assert.ok(battleAction(s,{seq:s.seq,type:'tactic',tactic:'advance',slot:2}).error);
  s=duel(hand([9,5,5]));assert.ok(battleAction(s,{seq:0,type:'tactic',tactic:'advance',slot:0}).error);
});
test('Borrow Banner, Regroup, Fortify and Supply implement distinct effects',()=>{
  let s=newBattle('tactics',{tactics:['borrow-banner','regroup','supply']});const before=s.player[0].suit;const suit=before==='bow'?'spear':'bow';
  s=act(s,{type:'tactic',tactic:'borrow-banner',slot:0,suit});assert.equal(s.player[0].suit,suit);
  s=newBattle('tactics',{tactics:['regroup']});const top=s.reserve.slice(0,2);s=act(s,{type:'tactic',tactic:'regroup',slots:[2,0]});assert.deepEqual(s.player[0],top[0]);assert.deepEqual(s.player[2],top[1]);assert.equal(s.exchanges,0);
  s=newBattle('tactics',{tactics:['fortify']});s=act(s,{type:'tactic',tactic:'fortify'});assert.equal(s.shield,4);
  s=newBattle('tactics',{tactics:['supply']});s=act(s,{type:'tactic',tactic:'supply'});assert.equal(s.command,3);
});
test('Star Reading charges on opening; only choice may follow and preserves relative order',()=>{
  let s=newBattle('star',{tactics:['star-reading']});const top=copy(s.reserve.slice(0,4));s=act(s,{type:'tactic',tactic:'star-reading'});assert.equal(s.phase,'star');assert.equal(s.command,1);assert.deepEqual(playerView(s).star,top.slice(0,3));
  assert.ok(battleAction(s,{type:'commit',mode:'show',seq:s.seq}).error);
  s=act(copy(s),{type:'star-select',slot:2});assert.deepEqual(s.reserve.slice(0,4),[top[2],top[0],top[1],top[3]]);assert.equal(s.phase,'arrange');assert.equal(s.command,1);
});
test('zero command still allows free exchange, forbids tactic and scouting',()=>{
  let s=newBattle('zero');s.command=0;assert.ok(battleAction(s,{seq:0,type:'scout',slot:1}).error);assert.ok(battleAction(s,{seq:0,type:'tactic',tactic:'advance',slot:0}).error);s=act(s,{type:'exchange',slot:0});assert.equal(s.command,0);
});
test('straight at pressure 3 deals 12; triple beats it for 16',()=>{
  let s=act(duel(),{type:'commit',mode:'press',pressure:3});assert.equal(s.enemyHp,8);assert.equal(s.playerHp,40);assert.equal(s.result?.rawDamage,12);
  s=act(duel(hand([4,5,6]),hand([8,8,8])),{type:'commit',mode:'press',pressure:3});assert.equal(s.playerHp,24);assert.equal(s.result?.rawDamage,16);
});
test('shield reduces normal damage but not withdraw or tie',()=>{
  let s=duel(hand([1,3,5]),hand([8,8,8]));s.shield=4;s=act(s,{type:'commit',mode:'show'});assert.equal(s.playerHp,32);assert.equal(s.result?.shieldBlocked,4);
  s=duel();s.shield=20;s=act(s,{type:'commit',mode:'withdraw'});assert.equal(s.playerHp,37);
  s=duel(hand([7,8,9]),hand([9,8,7]));s.shield=20;s=act(s,{type:'commit',mode:'show'});assert.equal(s.playerHp,39);assert.equal(s.enemyHp,19);
});
test('enemy yield deals 5 at pressure 3 without reveal or relic damage',()=>{
  const s=duel();s.aiRoll=0;s.relics=['tiger-seal','spear-tassel'];const n=act(s,{type:'commit',mode:'press',pressure:3});assert.equal(n.enemyHp,15);assert.equal(n.result?.outcome,'enemy_yield');assert.equal(playerView(n).enemy.filter(Boolean).length,1);
});
test('stacking relics deals 20 on pressure 3 straight flush',()=>{
  const s=duel(hand([4,5,6],['spear','spear','spear']));s.relics=['tiger-seal','spear-tassel','common-banner'];assert.equal(act(s,{type:'commit',mode:'press',pressure:3}).result?.rawDamage,20);
});
test('exhaustion starts on round eight, never follows a lethal hit; simultaneous death loses',()=>{
  let s=duel(hand([4,5,6]),hand([6,5,4]));s.round=8;s.playerHp=5;s.enemyHp=5;s=act(s,{type:'commit',mode:'show'});assert.equal(s.phase,'battleEnd');assert.equal(s.victory,false);assert.equal(s.result?.exhaustion,4);
  s=duel();s.round=8;s.enemyHp=1;s.playerHp=2;s=act(s,{type:'commit',mode:'show'});assert.equal(s.playerHp,2);assert.equal(s.victory,true);assert.equal(s.result?.exhaustion,0);
});
test('Green Bag heals once after living victory, never resurrects',()=>{
  let s=duel();s.relics=['green-bag'];s.enemyHp=1;s.playerHp=10;s=act(s,{type:'commit',mode:'show'});assert.equal(s.playerHp,13);assert.ok(battleAction(s,{seq:s.seq,type:'next'}).error);
  s=duel(hand([4,5,6]),hand([6,5,4]));s.relics=['green-bag'];s.enemyHp=s.playerHp=1;s=act(s,{type:'commit',mode:'show'});assert.equal(s.playerHp,0);assert.equal(s.victory,false);
});
test('duplicate commit is rejected; next round resets temporary state only',()=>{
  let s=duel();s=act(s,{type:'tactic',tactic:'advance',slot:0});const cmd:BattleAction={seq:s.seq,type:'commit',mode:'show'};s=battleAction(s,cmd).state;assert.ok(battleAction(s,cmd).error);assert.ok(battleAction(s,{seq:s.seq,type:'scout',slot:1}).error);
  s=act(s,{type:'next'});assert.equal(s.command,2);assert.equal(s.shield,0);assert.deepEqual(s.used,['advance']);assert.equal(s.tacticUsed,false);
});
test('AI cannot see player dark slots; output invariant when they change',()=>{
  const s=duel(),v=aiView(s);s.player[1].rank=9;s.player[2].rank=9;assert.deepEqual(aiView(s),v);assert.equal(enemyYields(v,3,.15),enemyYields(aiView(s),3,.15));
  const view=playerView(s);assert.ok(!('reserve' in view));assert.ok(!('rng' in view));assert.ok(!('aiRoll' in view));assert.equal(view.enemy[1],null);
});
test('special third rounds show captain concealment and Zhang Jiao pressure floor',()=>{
  let s=newBattle('boss',{enemyId:'zhang-jiao'});s.phase='roundEnd';s.round=2;s=act(s,{type:'next'});assert.equal(s.pressure,2);assert.equal(enemyYields(aiView(s),3,0),false);assert.ok(battleAction(s,{type:'commit',mode:'press',pressure:2,seq:s.seq}).error);
  s=newBattle('captain',{enemyId:'yellow-captain'});s.round=2;s.phase='roundEnd';s=act(s,{type:'next'});assert.equal(s.seen.length,0);s=act(s,{type:'scout',slot:0});assert.deepEqual(s.seen,[0]);
});
test('tutorial survives two lessons and rejects off-script commands',()=>{
  let s=newBattle('tutorial',{tutorial:true});assert.ok(battleAction(s,{seq:0,type:'commit',mode:'press',pressure:3}).error);
  s=act(s,{type:'commit',mode:'show'});assert.equal(s.enemyHp,12);s=act(s,{type:'next'});assert.ok(battleAction(s,{seq:s.seq,type:'commit',mode:'show'}).error);
  s=act(s,{type:'exchange',slot:1});s=act(s,{type:'commit',mode:'show'});assert.equal(s.enemyHp,5);s=act(s,{type:'next'});assert.equal(s.round,3);
});
test('scripted single-battle wins and losses terminate, bounded with withdraw',()=>{
  for(const mode of ['show','withdraw'] as const){let s=newBattle('single');for(let n=0;n<60 && s.phase!=='battleEnd';n++)s=act(s,s.phase==='roundEnd'?{type:'next'}:{type:'commit',mode});assert.equal(s.phase,'battleEnd');if(mode==='withdraw')assert.equal(s.victory,false);}
});
