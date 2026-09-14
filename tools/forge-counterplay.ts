import {forgeRule} from '@three-card/core';
import {bestForgeHand,forgeStrategy} from './forge-strategy';
import {STAGES,type CompanionId} from '@three-card/content';
import type {ForgeView,ForgeAction,ForgeTuning} from '@three-card/core';
/** Uses public hand and remaining resources only; never samples the real draw pile. */
export function counterplayStrategy(v:ForgeView,starter:CompanionId,tuning?:ForgeTuning):Omit<ForgeAction,'seq'>{
 if(v.phase!=='battle')return forgeStrategy(v,starter,tuning);
 const best=bestForgeHand(v,tuning),gap=v.target-v.score;
 if(v.discards>0&&best.score<gap){
  const spare=v.hand.filter(c=>!best.ids.includes(c.id));
  if(forgeRule(v)==='ambush'&&!v.scouted)return{type:'discard',ids:[spare[0].id]};
  if(best.score*v.hands<gap)return{type:'discard',ids:spare.map(c=>c.id)};
 }
 return{type:'play',ids:best.ids};
}
