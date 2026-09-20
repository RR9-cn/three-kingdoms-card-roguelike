import {mkdir,readFile,writeFile,rename,rm,open} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {newTrigger,actTrigger,triggerView,previewTrigger,isTriggerState,type TriggerState,type TriggerAction} from '../packages/core/src/trigger';
interface Session {id:string;state:TriggerState;history:unknown[]}
export function orderedChoices(s:TriggerState){const rows:{ids:string[];total:number;extras:number}[]=[];for(const a of s.hand)for(const b of s.hand)for(const c of s.hand){if(a===b||b===c||a===c)continue;const p=previewTrigger(s,[a,b,c]);rows.push({ids:[a,b,c],total:p.total,extras:p.extras});}return rows.sort((a,b)=>b.total-a.total);}
function observation(s:Session){const v=triggerView(s.state);return{schemaVersion:2,sessionId:s.id,...v,choices:s.state.phase==='battle'?orderedChoices(s.state).slice(0,6):undefined};}
export class AiPlayService {
 constructor(private root=join(process.cwd(),'.ai-play','trigger-sessions')){}
 async handle(input:unknown){const r=input as Record<string,any>;if(!r||typeof r!=='object'||Array.isArray(r)||r.schemaVersion!==2)throw Error('schemaVersion must be 2 (collectible trigger cards)');
 const allowed:Record<string,string[]>={start:['schemaVersion','operation','seed'],observe:['schemaVersion','operation','sessionId'],history:['schemaVersion','operation','sessionId'],close:['schemaVersion','operation','sessionId'],act:['schemaVersion','operation','sessionId','seq','decision'],preview:['schemaVersion','operation','sessionId','ids']};
 if(!allowed[r.operation]||Object.keys(r).some(k=>!allowed[r.operation].includes(k)))throw Error('unknown operation or field');
 await mkdir(this.root,{recursive:true});
 if(r.operation==='start'){const s={id:randomUUID(),state:newTrigger(r.seed),history:[]};await writeFile(join(this.root,s.id+'.json'),JSON.stringify(s));return observation(s);}
 if(typeof r.sessionId!=='string'||! /^[a-f0-9-]{36}$/.test(r.sessionId))throw Error('invalid sessionId');const file=join(this.root,r.sessionId+'.json');
 let lock;try{lock=await open(file+'.lock','wx');}catch{throw Error('session busy; retry');}
 try{const s:Session=JSON.parse(await readFile(file,'utf8'));if(s.id!==r.sessionId||!isTriggerState(s.state))throw Error('invalid session');
 if(r.operation==='close'){await rm(file);return{closed:true};}if(r.operation==='history')return{sessionId:s.id,events:s.history};
 if(r.operation==='preview'){if(s.state.phase!=='battle')throw Error('preview requires battle');return previewTrigger(s.state,r.ids);}
 if(r.operation==='act'){const d=r.decision;if(!d||typeof d!=='object'||Array.isArray(d))throw Error('decision required');const keys:Record<string,string[]>={play:['type','ids'],swap:['type','ids'],next:['type'],take:['type','kind'],upgrade:['type','id']};if(!keys[d.type]||Object.keys(d).some(k=>!keys[d.type].includes(k)))throw Error('invalid decision');s.state=actTrigger(s.state,{...d,seq:r.seq} as TriggerAction);s.history.push({seq:s.state.seq,stage:s.state.stage+1,decision:d,result:d.type==='play'?s.state.result:undefined,phase:s.state.phase,edit:s.state.lastEdit});await writeFile(file+'.tmp',JSON.stringify(s));await rename(file+'.tmp',file);}
 return observation(s);
 }finally{await lock.close();await rm(file+'.lock',{force:true});}
 }
}
