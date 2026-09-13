import test from 'node:test';
import assert from 'node:assert/strict';
import {deck,newForge,type ArmyCard,type ForgeState} from '@three-card/core';
import {analyzeChoiceDivergence,choiceDivergenceMarkdown,enumerateBestChoices,seededHands} from '../tools/choice-divergence';

function battleState(ids:string[]):ForgeState{
  const state=newForge('choice-test');
  state.phase='battle';
  state.army=deck().map(card=>({...card,bonus:0}));
  state.hand=ids;
  state.draw=state.army.map(card=>card.id).filter(id=>!ids.includes(id));
  state.discard=[];
  state.hands=4;
  state.discards=2;
  return state;
}

test('choice analysis is deterministic for identical inputs',()=>{
  const left=analyzeChoiceDivergence({seed:'repeatable',sampleCount:8});
  const right=analyzeChoiceDivergence({seed:'repeatable',sampleCount:8});
  assert.deepEqual(left,right);
  assert.deepEqual(seededHands('repeatable',3),seededHands('repeatable',3));
  assert.equal(left.summary.buildCount,299);
});

test('best choice enumeration preserves every tied optimum without advancing randomness',()=>{
  const state=battleState(['spear-1','cavalry-1','bow-1','scheme-1','spear-2','cavalry-2']);
  const before=structuredClone(state.rng);
  const best=enumerateBestChoices(state);
  assert.equal(best.score,30);
  assert.equal(best.choices.length,4);
  assert.ok(best.secondScore<best.score);
  assert.deepEqual(state.rng,before);
});

test('marginal metrics distinguish a changed choice from score-only and hidden-random effects',()=>{
  const cards=deck().map(card=>({...card,bonus:0} satisfies ArmyCard));
  const byId=new Map(cards.map(card=>[card.id,card]));
  const hand=['spear-1','cavalry-2','bow-3','scheme-4','spear-8','cavalry-9'].map(id=>structuredClone(byId.get(id)!));
  const report=analyzeChoiceDivergence({seed:'fixture',sampleCount:1,hands:[hand]});
  const liubei=report.generals.find(metric=>metric.id==='liubei')!;
  const pursuit=report.generals.find(metric=>metric.id==='pursuit')!;
  assert.ok(liubei.choiceChangeRate>0);
  assert.ok(liubei.meanScoreUpliftPct>0);
  assert.equal(pursuit.scope,'random-after-play');
  assert.equal(pursuit.choiceChangeRate,0);
  assert.equal(pursuit.meanScoreUpliftPct,0);
  assert.match(choiceDivergenceMarkdown(report),/不抽取马超追击等出牌后隐藏随机结果/);
});
