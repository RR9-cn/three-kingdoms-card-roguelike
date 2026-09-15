import type {Score} from '@three-card/core';
import {COMPANIONS,SUIT_NAMES} from '@three-card/content';

export interface CausalNode {label:string;kind:'source'|'card'|'response'}

const generalNames:Set<string>=new Set(Object.values(COMPANIONS).map(companion=>companion.name));

export function hasAdditionalScoring(score:Score):boolean{
 return score.steps.some(step=>step.source==='额外计分牌');
}

export function pursuitAttackGain(score:Score):number{
 return score.bursts>0?Math.max(0,score.total-score.floor):0;
}

export function settlementCausalChain(score:Score,visibleCount:number):CausalNode[]{
 let current:CausalNode[]|null=null,last:CausalNode[]=[];
 let cardId:string|undefined;
 for(const step of score.steps.slice(0,Math.max(0,visibleCount))){
  if(step.text.includes('发起第')&&step.cardId){
   current=[{label:step.source,kind:'source'}];
   cardId=step.cardId;
   continue;
  }
  if(!current)continue;
  if(step.source==='阵牌'){
   last=current;
   current=null;
   cardId=undefined;
   continue;
  }
  if(step.cardId!==cardId)continue;
  if(step.source==='额外计分牌'){
   const card=score.cards.find(item=>item.id===step.cardId);
   if(card)current.push({label:`${SUIT_NAMES[card.suit]}${card.rank}追加竞价`,kind:'card'});
   continue;
  }
  if(generalNames.has(step.source)){
   const label=step.text.includes('追击成功')?`${step.source}再举牌`:step.text.includes('未触发')?`${step.source}未加价`:step.source;
   if(current.at(-1)?.label!==label)current.push({label,kind:'response'});
  }
 }
 return current??last;
}

const escape=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));

export function settlementCausalPanel(score:Score,visibleCount:number):string{
 const nodes=settlementCausalChain(score,visibleCount);
 if(!nodes.length)return'';
 return `<div class="causal-chain" role="status" aria-label="当前竞价：${nodes.map(node=>escape(node.label)).join('，')}\"><small>本轮竞价</small><div>${nodes.map((node,index)=>`${index?'<i aria-hidden="true">→</i>':''}<b class="${node.kind}${index===nodes.length-1?' active':''}">${escape(node.label)}</b>`).join('')}</div></div>`;
}
