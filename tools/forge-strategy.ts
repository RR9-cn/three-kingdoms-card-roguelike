import {previewForge,randomState,type ForgeView,type ForgeState,type ForgeAction} from '@three-card/core';
import {COMPANIONS,type CompanionId} from '@three-card/content';
export function bestForgeHand(v:ForgeView){const s:ForgeState={...v,hand:v.hand.map(c=>c.id),rng:randomState('public-view'),draw:[],discard:[]};let best={ids:[] as string[],score:-1,category:0};for(let i=0;i<v.hand.length;i++)for(let j=i+1;j<v.hand.length;j++)for(let k=j+1;k<v.hand.length;k++){const ids=[v.hand[i].id,v.hand[j].id,v.hand[k].id];const p=previewForge(s,ids);if(p.total>best.score)best={ids,score:p.total,category:p.category};}return best;}
const preferences:Record<string,CompanionId[]>={guanyu:['guanyu','zhangfei','pursuit','chain','zhugeliang','zhouyu','zhaoyun','liubei','diaochan','oath','abacus','caocao'],zhouyu:['zhouyu','pursuit','chain','diaochan','zhaoyun','zhugeliang','oath','liubei','guanyu','abacus','caocao','zhangfei'],liubei:['liubei','zhugeliang','pursuit','chain','zhaoyun','zhouyu','zhangfei','guanyu','abacus','caocao','diaochan','oath']};
export function forgeStrategy(v:ForgeView,starter:CompanionId):Omit<ForgeAction,'seq'>{const pref=preferences[starter]??preferences.guanyu,rank=(id:CompanionId)=>pref.includes(id)?pref.indexOf(id):99;const sorted=(ids:CompanionId[])=>[...ids].sort((a,b)=>rank(a)-rank(b));
 if(v.phase==='starter')return{type:'starter',id:starter};
 if(v.phase==='prepare')return{type:'begin'};
 if(v.phase==='battle')return{type:'play',ids:bestForgeHand(v).ids};
 if(v.phase==='result')return{type:v.settlement==='pending'?'bank':'next'};
 if(v.phase==='recruit'){const id=sorted(v.recruits)[0];if(!id)return{type:'recruit',id:'skip'};if(v.companions.length<5)return{type:'recruit',id};const worst=sorted(v.companions.map(c=>c.id)).at(-1)!;return rank(id)<rank(worst)?{type:'recruit',id,replace:worst}:{type:'recruit',id:'skip'};}
 if(v.phase==='forge'){
  if(!v.pendingEdit)return{type:'random-edit'};
  if(v.pendingEdit==='level')return{type:'edit',edit:'level',category:starter==='guanyu'?1:starter==='zhouyu'?3:0};
  const ordered=[...v.army].sort((a,b)=>starter==='liubei'?a.rank-b.rank:b.rank-a.rank),card=v.pendingEdit==='remove'?ordered.at(-1)!:ordered.find(c=>v.pendingEdit!=='rank'||c.rank<9)!;
  if(v.pendingEdit==='suit')return{type:'edit',edit:'suit',cardId:card.id,suit:card.suit==='scheme'?'spear':'scheme'};
  return{type:'edit',edit:v.pendingEdit,cardId:card.id};
 }
 if(v.phase==='shop'){
  const available=sorted(v.offers.filter(o=>!o.sold&&!v.companions.some(c=>c.id===o.id)&&v.gold>=COMPANIONS[o.id].price).map(o=>o.id));
  if(available.length){const id=available[0];if(v.companions.length<5)return{type:'buy',id};const worst=sorted(v.companions.map(c=>c.id)).at(-1)!;if(rank(id)<rank(worst))return{type:'buy',id,replace:worst};}
  if(v.gold>24&&v.refreshes<2)return{type:'refresh'};
  return{type:'depart'};
 }
 throw Error('terminal state');
}
