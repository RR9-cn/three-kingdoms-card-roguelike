import test from 'node:test';
import assert from 'node:assert/strict';
import type {Score,ScoreStep} from '@three-card/core';
import {hasAdditionalScoring,pursuitAttackGain,settlementCausalChain,settlementCausalPanel} from '../apps/playtest/src/settlement-causality';

const steps:ScoreStep[]=[
 {source:'阵型',text:'合击 Lv.1 · 2倍率',chips:0,mult:2},
 {source:'阵牌',text:'+7点数',chips:7,mult:2,cardId:'spear-7'},
 {source:'张飞',text:'7点牌 · 发起第1次额外计分',chips:7,mult:2,cardId:'spear-7'},
 {source:'额外计分牌',text:'+7点数',chips:14,mult:2,cardId:'spear-7'},
 {source:'刘备',text:'低点牌：+10点数、+1倍率',chips:24,mult:3,cardId:'spear-7'},
 {source:'陆逊',text:'响应额外计分：+3倍率',chips:24,mult:6,cardId:'spear-7'},
 {source:'马超',text:'追击成功！追加第1/3次',chips:24,mult:6,cardId:'spear-7'},
 {source:'马超',text:'7点牌 · 发起第2次额外计分',chips:24,mult:6,cardId:'spear-7'},
 {source:'额外计分牌',text:'+7点数',chips:31,mult:6,cardId:'spear-7'},
 {source:'阵牌',text:'+2点数',chips:33,mult:6,cardId:'bow-2'},
];
const score:Score={category:1,chips:33,mult:6,total:222,steps,cards:[{id:'spear-7',suit:'spear',rank:7,bonus:0},{id:'bow-2',suit:'bow',rank:2,bonus:0},{id:'cavalry-7',suit:'cavalry',rank:7,bonus:0}],growth:{},penalty:1,floor:198,bursts:1};

test('causal chain appears only after a revealed trigger and grows in score-step order',()=>{
 assert.deepEqual(settlementCausalChain(score,2),[]);
 assert.deepEqual(settlementCausalChain(score,3).map(node=>node.label),['张飞']);
 assert.deepEqual(settlementCausalChain(score,7).map(node=>node.label),['张飞','枪7额外计分','刘备','陆逊','马超追击']);
});

test('a new extra-score trigger starts a new fragment and the next base card keeps it visible',()=>{
 assert.deepEqual(settlementCausalChain(score,8).map(node=>node.label),['马超']);
 assert.deepEqual(settlementCausalChain(score,9).map(node=>node.label),['马超','枪7额外计分']);
 assert.deepEqual(settlementCausalChain(score,10).map(node=>node.label),['马超','枪7额外计分']);
});

test('panel contains only nodes inside the revealed boundary',()=>{
 const html=settlementCausalPanel(score,4);
 assert.match(html,/张飞/);
 assert.match(html,/枪7额外计分/);
 assert.doesNotMatch(html,/刘备|陆逊|马超/);
});

test('settlement helpers distinguish an ordinary hand and report only resolved pursuit gain',()=>{
 assert.equal(hasAdditionalScoring(score),true);
 assert.equal(pursuitAttackGain(score),24);
 const ordinary={...score,steps:steps.filter(step=>step.source!=='额外计分牌'),total:48,floor:48,bursts:0};
 assert.equal(hasAdditionalScoring(ordinary),false);
 assert.equal(pursuitAttackGain(ordinary),0);
});
