import test from 'node:test';
import assert from 'node:assert/strict';
import type {Score,ScoreStep} from '@three-card/core';
import {settlementPresentation} from '../apps/playtest/src/settlement-animation';

const steps:ScoreStep[]=[
 {source:'阵型',text:'合击 Lv.1 · 2倍率',chips:0,mult:2},
 {source:'阵牌',text:'+7点数',chips:7,mult:2,cardId:'spear-7'},
 {source:'双生客',text:'7点牌 · 发起第1次额外计分',chips:7,mult:2,cardId:'spear-7'},
 {source:'额外计分牌',text:'+7点数',chips:14,mult:2,cardId:'spear-7'},
 {source:'抬价人',text:'响应额外计分：+3倍率',chips:14,mult:5,cardId:'spear-7'},
];
const score:Score={category:1,chips:14,mult:5,total:70,floor:70,bursts:0,steps,cards:[{id:'spear-7',suit:'spear',rank:7,bonus:0},{id:'bow-2',suit:'bow',rank:2,bonus:0},{id:'cavalry-7',suit:'cavalry',rank:7,bonus:0}],growth:{},penalty:1};

test('settlement presentation advances from lots through set and bidding to hammer',()=>{
 assert.deepEqual(settlementPresentation(score,0),{beat:'lots',visibleCount:0,complete:false,ordinary:false,activeStep:null,activeCardId:null,displayTotal:0});
 assert.equal(settlementPresentation(score,1).beat,'set');
 assert.equal(settlementPresentation(score,2).beat,'bidding');
 assert.equal(settlementPresentation(score,4).activeCardId,'spear-7');
 const complete=settlementPresentation(score,999);
 assert.equal(complete.beat,'hammer');
 assert.equal(complete.displayTotal,70);
 assert.equal(complete.visibleCount,steps.length);
});

test('ordinary settlement is distinguished without changing staged totals',()=>{
 const ordinary={...score,steps:steps.slice(0,2),chips:7,mult:2,total:14,floor:14};
 const middle=settlementPresentation(ordinary,2);
 assert.equal(middle.ordinary,true);
 assert.equal(middle.beat,'hammer');
 assert.equal(middle.displayTotal,14);
});

test('penalty changes the displayed price only after its causal step is visible',()=>{
 const penalized={...score,penalty:.5,total:35,steps:[...steps,{source:'重复估价',text:'最终成交价 ×0.5',chips:14,mult:5}]};
 assert.equal(settlementPresentation(penalized,5).displayTotal,70);
 assert.equal(settlementPresentation(penalized,6).displayTotal,35);
});
