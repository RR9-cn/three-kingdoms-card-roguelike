import {writeFileSync} from 'node:fs';
import {newForge,forgeAction,forgeView,isForgeState} from '@three-card/core';
import {STARTERS,FORGE_VERSION} from '@three-card/content';
import {forgeStrategy} from './forge-strategy';
import {counterplayStrategy} from './forge-counterplay';
const results=[];
for(const starter of STARTERS)for(const strategy of ['greedy','counterplay'] as const){let wins=0,discards=0,clears=0,tight=0,plays=0;const failures=Array(8).fill(0);
 for(let i=0;i<200;i++){let s=newForge(`forge-${i}`);for(let n=0;n<300&&!['victory','defeat'].includes(s.phase);n++){
 const a=(strategy==='greedy'?forgeStrategy:counterplayStrategy)(forgeView(s),starter);if(a.type==='discard')discards++;
 if(a.type==='next'&&s.score>=s.target){clears++;plays+=s.played;if(s.hands===0)tight++;}
 const r=forgeAction(s,{...a,seq:s.seq});if(r.error||!isForgeState(r.state))throw Error(r.error??'Invalid state');s=r.state;
 }if(s.phase==='victory')wins++;else if(s.phase==='defeat')failures[s.stage]++;else throw Error('Unterminated');}
 results.push({starter,strategy,runs:200,wins,winRate:wins/200,discards,clears,lastHandClears:tight,meanPlaysPerClear:plays/clears,failures});
}
writeFileSync(`docs/evidence/forge-${FORGE_VERSION}-comparison.json`,JSON.stringify({version:FORGE_VERSION,method:'Paired forge-0..199, same recruitment/edit policy. Counterplay discards one spare card to lift ambush unless already lethal; otherwise replaces three non-selected cards when projected remaining score is insufficient. No future draw/RNG access. Not optimal play or a human enjoyment measure.',results},null,2)+'\n');console.table(results);
