import {writeFileSync} from 'node:fs';
import {newRun,runAction,runView,evaluate,type RunState,type RunAction,type PlayerView,type BattleAction} from '@three-card/core';
const strategies=['show','press','shape','cautious'] as const;
type Strategy=typeof strategies[number];
function decision(b:PlayerView,strategy:Strategy):Omit<BattleAction,'seq'>{
 if(b.phase==='roundEnd')return{type:'next'};
 const cat=evaluate(b.player).category;
 if(strategy==='shape'||strategy==='cautious'){
  if(b.exchanges===0&&cat===0){const sorted=b.player.map((c,i)=>({rank:c.rank,i})).sort((a,b)=>a.rank-b.rank);return{type:'exchange',slot:sorted[0].i};}
  if(!b.tacticUsed&&!b.used.includes('advance')&&b.tactics.includes('advance')&&b.command>0){let best=cat,slot=-1;for(let i=0;i<3;i++){if(b.player[i].rank===9)continue;const hand=b.player.map(c=>({...c}));hand[i].rank++;const score=evaluate(hand).category;if(score>best){best=score;slot=i;}}if(slot>=0)return{type:'tactic',tactic:'advance',slot};}
 }
 if(strategy==='cautious'&&cat===0)return{type:'commit',mode:'withdraw'};
 return strategy==='show'||(strategy==='shape'&&cat===0)?{type:'commit',mode:'show'}:{type:'commit',mode:'press',pressure:3};
}
export function simulate(seed:string,strategy:Strategy):RunState{
 let s=newRun(seed);let guard=0;
 while(!['victory','defeat'].includes(s.phase)){
  if(++guard>500)throw Error('non-terminating run');const v=runView(s);let a:Omit<RunAction,'seq'>;
  if(v.phase==='battle'){a=v.battle!.phase==='battleEnd'?{type:'finish-battle'}:{type:'battle',action:{...decision(v.battle!,strategy),seq:v.battle!.seq}};}
  else if(v.phase==='reward')a={type:'claim',choice:'skip',transactionId:v.reward!.id};
  else if(v.phase==='route')a={type:'enter',node:v.routes.includes('camp')?'camp':v.routes.includes('event')?'event':v.routes.includes('battle')?'battle':v.routes[0]};
  else if(v.phase==='camp')a={type:'camp',choice:'heal',transactionId:v.transactionId};
  else if(v.phase==='event')a={type:'event',choice:v.event==='physician'?'0':'1',transactionId:v.transactionId};
  else a={type:'leave'};
  const r=runAction(s,{...a,seq:s.seq});if(r.error)throw Error(r.error);s=r.state;
 }
 return s;
}
const count=1000;const results=strategies.map(strategy=>{let wins=0,rounds=0,maxLayer=0,firstWin:string|null=null;for(let i=0;i<count;i++){const seed=`balance-${i}`;const s=simulate(seed,strategy);if(s.phase==='victory'){wins++;firstWin??=seed;}rounds+=s.stats.rounds;maxLayer=Math.max(maxLayer,s.layer+1);}return {strategy,runs:count,wins,winRate:wins/count,meanRounds:rounds/count,maxLayer,firstWin};});
writeFileSync('docs/evidence/simulation.json',JSON.stringify({contentVersion:'0.1.0',seedPrefix:'balance-',count,notes:'Four fixed heuristics. Same route policy, skips rewards, no hidden information. Not a human win-rate estimate or complete build balance test.',results},null,2)+'\n');
console.table(results);
