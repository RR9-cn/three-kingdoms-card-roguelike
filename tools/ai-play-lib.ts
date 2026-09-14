import {mkdir,readFile,rename,rm,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {bossEncounter,forgeAction,forgeView,isForgeState,newForge,previewForge,randomState,type ForgeAction,type ForgeState,type ForgeView} from '@three-card/core';
import {COMPANIONS,FORGE_RULES,HAND_NAMES,STARTERS,STAGES,SUITS,SUIT_NAMES,type CompanionId,type ForgeEdit,type Suit} from '@three-card/content';

export type AiDecision=
 | {type:'begin';pressure?:boolean}
 | {type:'play'|'discard';cards:number[]}
 | {type:'buy_general';offer:number;replace?:number}
 | {type:'buy_edit'}
 | {type:'apply_edit';target?:number;category?:number;suit?:Suit}
 | {type:'sell_general';general:number}
 | {type:'depart';pressure?:boolean}
 | {type:'refresh'|'extend'};
export type AiPlayRequest=
 | {schemaVersion:1;operation:'start';seed:string;starter:CompanionId;pressure?:boolean}
 | {schemaVersion:1;operation:'observe'|'history'|'close';sessionId:string}
 | {schemaVersion:1;operation:'act';sessionId:string;turn:number;decision:AiDecision};

interface PlayEvent {turn:number;stage:number;kind:string;detail:string}
interface Session {schemaVersion:1;id:string;starter:CompanionId;state:ForgeState;history:PlayEvent[]}
interface LastResult {formation:string;cards:string;guaranteed:number;actual:number;penalty:number;triggers:string[]}

const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const keys=(value:Record<string,unknown>,allowed:string[],name:string)=>{const unknown=Object.keys(value).filter(k=>!allowed.includes(k));if(unknown.length)throw Error(`${name} contains unknown field: ${unknown[0]}`);};
const text=(value:unknown,name:string,max=100)=>{if(typeof value!=='string'||!value.length||value.length>max)throw Error(`${name} must be 1 to ${max} characters`);return value;};
const integer=(value:unknown,min:number,max:number,name:string)=>{if(!Number.isSafeInteger(value)||Number(value)<min||Number(value)>max)throw Error(`${name} must be an integer from ${min} to ${max}`);return Number(value);};
const optionalBoolean=(value:unknown,name:string)=>{if(value!==undefined&&typeof value!=='boolean')throw Error(`${name} must be a boolean`);return value===true;};
const sessionId=(value:unknown)=>{const id=text(value,'sessionId',80);if(!/^[a-zA-Z0-9-]+$/.test(id))throw Error('invalid sessionId');return id;};
const cardLabel=(card:{rank:number;suit:Suit;bonus:number})=>`${SUIT_NAMES[card.suit]}${card.rank}${card.bonus?`+${card.bonus}`:''}`;
const apply=(state:ForgeState,action:Omit<ForgeAction,'seq'>)=>{const result=forgeAction(state,{...action,seq:state.seq});if(result.error)throw Error(result.error);return result.state;};
const triggerSummary=(view:ForgeView['result'])=>{if(!view)return[];const ignored=new Set(['阵型','阵牌','额外计分牌']);const counts=new Map<string,number>();for(const step of view.steps)if(!ignored.has(step.source)&&!step.text.includes('未触发'))counts.set(step.source,(counts.get(step.source)??0)+1);return [...counts].map(([name,count])=>count>1?`${name}×${count}`:name);};
function combinations(view:ForgeView){const state:ForgeState={...view,hand:view.hand.map(card=>card.id),draw:[],discard:[],rng:randomState('ai-public-view')};const out:[number[],string,number,number,string[]][]=[];for(let i=0;i<view.hand.length;i++)for(let j=i+1;j<view.hand.length;j++)for(let k=j+1;k<view.hand.length;k++){const p=previewForge(state,[view.hand[i].id,view.hand[j].id,view.hand[k].id]);out.push([[i+1,j+1,k+1],HAND_NAMES[p.category],p.total,p.penalty,triggerSummary(p)]);}return out.sort((a,b)=>b[2]-a[2]||a[0].join('').localeCompare(b[0].join('')));}
function observation(session:Session,lastResult?:LastResult){const v=forgeView(session.state),stage=STAGES[v.stage],boss=bossEncounter(v);const base:any={schemaVersion:1,sessionId:session.id,turn:v.seq,phase:v.phase,stage:{number:v.stage+1,name:v.challenge?`极限挑战${v.challenge}`:stage.name,enemy:v.challenge?'无尽军势':stage.enemy,score:v.score,target:v.target},resources:{gold:v.gold,hands:v.hands,discards:v.discards},generals:v.companions.map((c,i)=>({n:i+1,id:c.id,name:COMPANIONS[c.id].name,growth:c.growth,ability:COMPANIONS[c.id].text}))};
 if(lastResult)base.lastResult=lastResult;
 if(boss)base.boss={phase:boss.phase+1,name:boss.current.name,rule:boss.current.text,transitionAt:boss.threshold};
 if(v.phase==='prepare')base.actions=[{type:'begin',pressure:false,target:stage.target},{type:'begin',pressure:true,target:Math.ceil(stage.target*FORGE_RULES.pressureFactor),reward:`+${FORGE_RULES.pressureReward}军资`}];
 if(v.phase==='battle'){base.hand=v.hand.map(cardLabel);base.combinationFields=['cards','formation','guaranteedAttack','penalty','triggers'];base.combinations=combinations(v);base.actions=['play: 3个手牌编号','discard: 1至3个手牌编号'];}
 if(v.phase==='shop'){const next=v.challenge?{name:`极限挑战${v.challenge+1}`,target:Math.ceil(1900*1.6**Math.min(v.challenge+1,40))}:v.stage<7?{name:STAGES[v.stage+1].name,target:STAGES[v.stage+1].target}:null;base.offers=v.offers.map((o,i)=>({n:i+1,id:o.id,name:COMPANIONS[o.id].name,price:COMPANIONS[o.id].price,sold:o.sold,ability:COMPANIONS[o.id].text}));base.editOffer=v.pendingEdit?{type:v.pendingEdit,price:FORGE_RULES.editCost}:null;base.nextStage=next;base.actions=['buy_general','buy_edit','sell_general','refresh',{type:'depart',pressure:'可选；直接开始下一关'}];}
 if(v.phase==='forge'){base.edit={type:v.pendingEdit};base.targetFields=['number','card'];if(v.pendingEdit==='level')base.targets=HAND_NAMES.map((name,i)=>[i+1,`${name} Lv.${v.levels[i]+1}`]);else base.targets=v.army.map((c,i)=>[i+1,cardLabel(c)]).filter(x=>v.pendingEdit!=='rank'||v.army[Number(x[0])-1].rank<9);base.actions=['apply_edit: target；研习用category；改编另加suit'];}
 if(v.phase==='victory')base.actions=[{type:'extend'}];
 if(v.phase==='defeat')base.actions=[];
 return base;
}

export class AiPlayService{
 constructor(private root=join(process.cwd(),'.ai-play','sessions')){}
 private path(id:string){return join(this.root,`${id}.json`);}
 private async load(id:string){let parsed:unknown;try{parsed=JSON.parse(await readFile(this.path(id),'utf8'));}catch{throw Error('session not found');}if(!record(parsed)||parsed.schemaVersion!==1||parsed.id!==id||!STARTERS.includes(parsed.starter as CompanionId)||!isForgeState(parsed.state)||!Array.isArray(parsed.history))throw Error('session is invalid');return parsed as unknown as Session;}
 private async save(session:Session){await mkdir(this.root,{recursive:true});const path=this.path(session.id),temp=`${path}.${process.pid}.tmp`;await writeFile(temp,JSON.stringify(session));await rename(temp,path);}
 async handle(input:unknown):Promise<unknown>{
  if(!record(input)||input.schemaVersion!==1)throw Error('schemaVersion must be 1');const operation=input.operation;if(!['start','observe','act','history','close'].includes(String(operation)))throw Error('operation must be start, observe, act, history, or close');
  if(operation==='start'){keys(input,['schemaVersion','operation','seed','starter','pressure'],'request');const seed=text(input.seed,'seed'),pressure=optionalBoolean(input.pressure,'pressure');if(!STARTERS.includes(input.starter as CompanionId))throw Error('starter must be guanyu, zhouyu, or liubei');let state=newForge(seed);state=apply(state,{type:'starter',id:input.starter as CompanionId});state=apply(state,{type:'begin',pressed:pressure});const session:Session={schemaVersion:1,id:randomUUID(),starter:input.starter as CompanionId,state,history:[]};await this.save(session);return observation(session);}
  const id=sessionId(input.sessionId);if(operation==='close'){keys(input,['schemaVersion','operation','sessionId'],'request');await rm(this.path(id),{force:true});return{schemaVersion:1,sessionId:id,closed:true};}
  const session=await this.load(id);if(operation==='observe'){keys(input,['schemaVersion','operation','sessionId'],'request');return observation(session);}
  if(operation==='history'){keys(input,['schemaVersion','operation','sessionId'],'request');return{schemaVersion:1,sessionId:id,turn:session.state.seq,history:session.history};}
  keys(input,['schemaVersion','operation','sessionId','turn','decision'],'request');if(integer(input.turn,0,1_000_000,'turn')!==session.state.seq)throw Error(`stale turn; current turn is ${session.state.seq}`);if(!record(input.decision)||typeof input.decision.type!=='string')throw Error('decision must be an object with a type');const d=input.decision as unknown as AiDecision,v=forgeView(session.state),beforeTurn=session.state.seq,beforeStage=session.state.stage+1;let action:Omit<ForgeAction,'seq'>;let detail:string=d.type;
  const indices=(values:unknown,min:number,max:number)=>{if(!Array.isArray(values)||values.length<min||values.length>max)throw Error(`cards must contain ${min} to ${max} hand numbers`);const ns=values.map((n,i)=>integer(n,1,v.hand.length,`cards.${i}`));if(new Set(ns).size!==ns.length)throw Error('cards must be unique');return ns.map(n=>v.hand[n-1].id);};
  const allowed:Record<string,string[]>={begin:['type','pressure'],play:['type','cards'],discard:['type','cards'],buy_general:['type','offer','replace'],buy_edit:['type'],apply_edit:['type','target','category','suit'],sell_general:['type','general'],refresh:['type'],depart:['type','pressure'],extend:['type']};if(!allowed[d.type])throw Error('unsupported decision type');keys(input.decision,allowed[d.type],'decision');
  switch(d.type){
   case'begin':action={type:'begin',pressed:optionalBoolean(d.pressure,'pressure')};break;
   case'play':action={type:'play',ids:indices(d.cards,3,3)};break;
   case'discard':action={type:'discard',ids:indices(d.cards,1,3)};break;
   case'buy_general':{const n=integer(d.offer,1,v.offers.length,'offer'),offer=v.offers[n-1];action={type:'buy',id:offer.id,...d.replace!==undefined?{replace:v.companions[integer(d.replace,1,v.companions.length,'replace')-1].id}:{}};detail=`招募${COMPANIONS[offer.id].name}`;break;}
   case'buy_edit':action={type:'buy-edit'};break;
   case'apply_edit':{const edit=v.pendingEdit as ForgeEdit;if(!edit)throw Error('no revealed edit');if(edit==='level')action={type:'edit',edit,category:integer(d.category,1,HAND_NAMES.length,'category')-1};else{const n=integer(d.target,1,v.army.length,'target'),card=v.army[n-1];action={type:'edit',edit,cardId:card.id,...edit==='suit'?{suit:(()=>{if(!SUITS.includes(d.suit as Suit))throw Error('suit must be spear, cavalry, bow, or scheme');return d.suit as Suit;})()}:{}};}break;}
   case'sell_general':action={type:'sell',id:v.companions[integer(d.general,1,v.companions.length,'general')-1].id};break;
   case'depart':action={type:'depart'};break;
   case'refresh':case'extend':action={type:d.type};break;
   default:throw Error('unsupported decision type');
  }
  let state=apply(session.state,action),lastResult:LastResult|undefined;
  if(d.type==='play'){const result=state.result!;lastResult={formation:HAND_NAMES[result.category],cards:result.cards.map(cardLabel).join(' '),guaranteed:result.floor,actual:result.total,penalty:result.penalty,triggers:triggerSummary(result)};state=apply(state,{type:'bank'});state=apply(state,{type:'next'});detail=`${lastResult.cards} · ${lastResult.formation} · ${lastResult.actual}攻势`;}
  if(d.type==='depart')state=apply(state,{type:'begin',pressed:optionalBoolean(d.pressure,'pressure')});
  session.state=state;session.history.push({turn:beforeTurn,stage:beforeStage,kind:d.type,detail});await this.save(session);return observation(session,lastResult);
 }
}
