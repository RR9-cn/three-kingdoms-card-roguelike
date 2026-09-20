import {TRIGGER_CARDS as C,TRIGGER_KINDS,TRIGGER_START,TRIGGER_TARGETS,type TriggerKind} from '../../content/src/trigger';
export interface TriggerCard {id:string;kind:TriggerKind;bonus:number}
export interface TriggerStep {id:string;name:string;cause:string;points:number;heat:number;extra:boolean;text:string}
export interface TriggerScore {points:number;heat:number;total:number;extras:number;steps:TriggerStep[];ids:string[]}
export interface TriggerState {version:'trigger-1';seed:string;seq:number;rng:number;burst:number;phase:'battle'|'result'|'reward'|'upgrade'|'victory'|'defeat';stage:number;score:number;hands:number;swaps:number;deck:TriggerCard[];hand:string[];draw:string[];discard:string[];nextId:number;offers:TriggerKind[];result:TriggerScore|null;best:number;lastEdit:string}
export type TriggerAction = {seq:number;type:'play'|'swap';ids:string[]}|{seq:number;type:'next'}|{seq:number;type:'take';kind:TriggerKind}|{seq:number;type:'upgrade';id:string};
const clone=<T>(x:T):T=>structuredClone(x);
const check=(ok:unknown,msg:string)=>{if(!ok)throw Error(msg);};
export const cardPoints=(c:TriggerCard)=>C[c.kind].points+c.bonus;
function hash(s:string){let h=2166136261;for(const ch of s)h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
function random(s:TriggerState,field:'rng'|'burst'='rng'){s[field]=(Math.imul(s[field],1664525)+1013904223)>>>0;return s[field]/4294967296;}
function shuffle<T>(s:TriggerState,items:T[]){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function refill(s:TriggerState){while(s.hand.length<6){if(!s.draw.length){s.draw=shuffle(s,s.discard);s.discard=[];}const id=s.draw.pop();if(!id)break;s.hand.push(id);}}
function begin(s:TriggerState){s.phase='battle';s.score=0;s.hands=4;s.swaps=2;s.hand=[];s.discard=[];s.draw=shuffle(s,s.deck.map(c=>c.id));s.result=null;s.offers=[];refill(s);}
export function newTrigger(seed:string):TriggerState{check(typeof seed==='string'&&seed.length>0&&seed.length<=100,'种子长度应为1–100');const s:TriggerState={version:'trigger-1',seed,seq:0,rng:hash(seed),burst:hash(seed+':burst'),phase:'battle',stage:0,score:0,hands:4,swaps:2,deck:TRIGGER_START.map((kind,i)=>({id:`c${i}`,kind,bonus:0})),hand:[],draw:[],discard:[],nextId:10,offers:[],result:null,best:0,lastEdit:''};begin(s);return s;}
function selected(s:TriggerState,ids:string[],min=3){check(Array.isArray(ids)&&ids.length>=min&&ids.length<=3&&new Set(ids).size===ids.length&&ids.every(id=>s.hand.includes(id)),'请选择有效且不同的手牌');return ids.map(id=>s.deck.find(c=>c.id===id)!);}
function score(s:TriggerState,ids:string[],resolve:boolean):TriggerScore{
 const cards=selected(s,ids),out:TriggerScore={points:0,heat:1,total:0,extras:0,steps:[],ids:[...ids]};
 function trigger(i:number,cause:string,extra=false){if(i<0)return;check(out.steps.length<128,'连锁超过安全上限');const c=cards[i],def=C[c.kind];if(extra)out.extras++;out.points+=cardPoints(c);let heat=0,text=`+${cardPoints(c)}点`;let repeat=-1;
 switch(c.kind){case 'coin':if(i>0&&cardPoints(cards[i-1])<cardPoints(c))heat=2;break;
 case 'candle':heat=2;break;case 'mirror':repeat=i-1;break;
 case 'hammer':heat=out.extras;break;case 'bell':if(i>0&&C[cards[i-1].kind].tag===def.tag)repeat=i-1;break;
 case 'glove':if(i>0){if(resolve){const hit=random(s,'burst')<.5;text+=hit?'；再次举牌成功':'；再次举牌未触发';if(hit)repeat=i-1;}else text+='；50%再次举牌未计入保底';}break;
 case 'ledger':heat=cards.filter(c=>cardPoints(c)<=4).length;break;
 case 'mask':if(i>0&&C[cards[i-1].kind].tag!==def.tag)heat=3;break;
 case 'prism':if(new Set(cards.map(c=>C[c.kind].tag)).size===3)heat=4;break;
 case 'hourglass':if(i===2)repeat=0;break;
 case 'crown':if(cards.every(c=>cardPoints(c)>=5))heat=5;break;}
 out.heat+=heat;if(heat)text+=`，+${heat}热度`;
 if(repeat>=0)text+=`；重触发${C[cards[repeat].kind].name}`;
 out.steps.push({id:c.id,name:def.name,cause,points:out.points,heat:out.heat,extra,text});
 if(repeat>=0)trigger(repeat,def.name,true);
 }
 cards.forEach((_,i)=>trigger(i,`第${i+1}位`));out.total=out.points*out.heat;return out;
}
export function previewTrigger(s:TriggerState,ids:string[]){return score(clone(s),ids,false);}
export function actTrigger(original:TriggerState,a:TriggerAction):TriggerState{
 check(a&&typeof a==='object'&&a.seq===original.seq,'操作已过期，请刷新局面');const s=clone(original);
 switch(a.type){case 'play':check(s.phase==='battle'&&s.hands>0,'当前不能出牌');selected(s,a.ids);s.result=score(s,a.ids,true);s.score+=s.result.total;s.best=Math.max(s.best,s.result.total);s.hands--;s.hand=s.hand.filter(id=>!a.ids.includes(id));s.discard.push(...a.ids);s.phase='result';break;
 case 'swap':check(s.phase==='battle'&&s.swaps>0,'没有可用撤换');selected(s,a.ids,1);s.hand=s.hand.filter(id=>!a.ids.includes(id));s.discard.push(...a.ids);s.swaps--;refill(s);break;
 case 'next':check(s.phase==='result','当前不能继续');if(s.score>=TRIGGER_TARGETS[s.stage]){if(s.stage===2)s.phase='victory';else{s.phase='reward';s.offers=shuffle(s,TRIGGER_KINDS).slice(0,3);}}else if(s.hands===0)s.phase='defeat';else{s.phase='battle';refill(s);}break;
 case 'take':check(s.phase==='reward'&&s.offers.includes(a.kind),'奖励无效');s.deck.push({id:`c${s.nextId++}`,kind:a.kind,bonus:0});s.lastEdit=`收集：${C[a.kind].name}`;s.offers=[];s.phase='upgrade';break;
 case 'upgrade':{check(s.phase==='upgrade','当前不能升级');const c=s.deck.find(c=>c.id===a.id);check(c,'升级目标无效');const before=cardPoints(c!);c!.bonus+=2;s.lastEdit=`${C[c!.kind].name}：${before} → ${before+2}点`;s.stage++;begin(s);break;}
 default:throw Error('未知操作');}
 s.seq++;return s;
}
export function triggerView(s:TriggerState){return{version:s.version,seed:s.seed,seq:s.seq,phase:s.phase,stage:s.stage+1,target:TRIGGER_TARGETS[s.stage],score:s.score,hands:s.hands,swaps:s.swaps,best:s.best,lastEdit:s.lastEdit,hand:s.hand.map(id=>s.deck.find(c=>c.id===id)!).map(c=>({...c,...C[c.kind],points:cardPoints(c)})),collection:s.deck.map(c=>({...c,...C[c.kind],points:cardPoints(c)})),offers:s.offers.map(kind=>({kind,...C[kind]})),result:s.result,actions:s.phase==='battle'?['play','swap']:s.phase==='result'?['next']:s.phase==='reward'?['take']:s.phase==='upgrade'?['upgrade']:[]};}
export function isTriggerState(v:unknown):v is TriggerState{
 if(!v||typeof v!=='object')return false;const s=v as TriggerState;
 if(s.version!=='trigger-1'||typeof s.seed!=='string'||!['battle','result','reward','upgrade','victory','defeat'].includes(s.phase))return false;
 if(![s.seq,s.rng,s.burst,s.stage,s.score,s.hands,s.swaps,s.nextId,s.best].every(n=>Number.isSafeInteger(n)&&n>=0)||s.stage>2||s.hands>4||s.swaps>2)return false;
 if(!Array.isArray(s.deck)||s.deck.length<10||s.deck.length>12||!s.deck.every(c=>c&&typeof c.id==='string'&&TRIGGER_KINDS.includes(c.kind)&&Number.isSafeInteger(c.bonus)&&c.bonus>=0&&c.bonus<=4))return false;
 const all=s.deck.map(c=>c.id);if(new Set(all).size!==all.length||!Array.isArray(s.offers)||!s.offers.every(k=>TRIGGER_KINDS.includes(k))||typeof s.lastEdit!=='string')return false;
 if(![s.hand,s.draw,s.discard].every(a=>Array.isArray(a)&&a.every(id=>all.includes(id))))return false;
 const zones=[...s.hand,...s.draw,...s.discard];if(new Set(zones).size!==zones.length||s.hand.length>6)return false;
 if(s.result!==null&&(!s.result||!Number.isFinite(s.result.total)||!Array.isArray(s.result.steps)||!Array.isArray(s.result.ids)||!s.result.ids.every(id=>all.includes(id))))return false;
 if(s.phase==='result'&&!s.result)return false;return true;
}
export const TRIGGER_SAVE_KEY='midnight-hammer:trigger-1';
