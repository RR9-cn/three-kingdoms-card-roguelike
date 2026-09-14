import {forgeAction,forgeView,newForge,type ForgeAction,type ForgeTuning,type ForgeView} from '@three-card/core';
import {COMPANIONS,FORGE_VERSION,HAND_NAMES,STARTERS,STAGES,type CompanionId} from '@three-card/content';
import {forgeStrategy} from './forge-strategy';
import {counterplayStrategy} from './forge-counterplay';

export type EvaluationPolicy='greedy'|'counterplay';
export interface RuleOverrides {liubeiMultiplier?:number;stageTargets?:Record<string,number>}
export interface SimulateBatchRequest {schemaVersion:1;operation:'simulate_batch';starters?:CompanionId[];runsPerStarter?:number;seedPrefix?:string;policy?:EvaluationPolicy;overrides?:RuleOverrides}
export interface InspectRunRequest {schemaVersion:1;operation:'inspect_run';seed:string;starter:CompanionId;policy?:EvaluationPolicy;overrides?:RuleOverrides}
export interface CompareRulesRequest {schemaVersion:1;operation:'compare_rules';starters?:CompanionId[];runsPerStarter?:number;seedPrefix?:string;policy?:EvaluationPolicy;baseline:string;variants:Record<string,RuleOverrides>}
export type AiEvaluationRequest=SimulateBatchRequest|InspectRunRequest|CompareRulesRequest;

type RunStatus='victory'|'defeat';
export interface StageTrace {stage:number;name:string;target:number;status:'win'|'loss';handsUsed:number;discardsUsed:number;bestAttack:number;peakRatio:number;bestFormation:string|null;generals:string[];triggers:Record<string,number>;purchases:string[]}
export interface RunTrace {seed:string;starter:CompanionId;status:RunStatus;failedStage:number|null;bestAttack:number;stages:StageTrace[]}

const generalNames=new Set<string>(Object.values(COMPANIONS).map(c=>c.name));
const round=(n:number)=>Math.round(n*1000)/1000;
const quantile=(values:number[],q:number)=>{if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b),index=(sorted.length-1)*q,lo=Math.floor(index),hi=Math.ceil(index);return round(sorted[lo]+(sorted[hi]-sorted[lo])*(index-lo));};
const isRecord=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const assertKeys=(value:Record<string,unknown>,allowed:string[],at:string)=>{const unknown=Object.keys(value).filter(key=>!allowed.includes(key));if(unknown.length)throw Error(`${at} contains unknown field: ${unknown[0]}`);};
const integer=(value:unknown,min:number,max:number,name:string)=>{if(!Number.isSafeInteger(value)||Number(value)<min||Number(value)>max)throw Error(`${name} must be an integer from ${min} to ${max}`);return Number(value);};
const policyOf=(value:unknown):EvaluationPolicy=>{const policy=value??'counterplay';if(policy!=='greedy'&&policy!=='counterplay')throw Error('policy must be greedy or counterplay');return policy;};
const startersOf=(value:unknown):CompanionId[]=>{if(value===undefined)return [...STARTERS];if(!Array.isArray(value)||!value.length||value.some(id=>!STARTERS.includes(id)))throw Error('starters must contain unique playable starter ids');if(new Set(value).size!==value.length)throw Error('starters must contain unique playable starter ids');return value as CompanionId[];};
const seedPrefixOf=(value:unknown)=>{const seed=value??'ai-eval';if(typeof seed!=='string'||!seed.length||seed.length>80)throw Error('seedPrefix must be 1 to 80 characters');return seed;};
function tuningOf(value:unknown):{overrides:RuleOverrides;tuning:ForgeTuning}{
 if(value===undefined)return{overrides:{},tuning:{}};
 if(!isRecord(value))throw Error('overrides must be an object');assertKeys(value,['liubeiMultiplier','stageTargets'],'overrides');
 const overrides:RuleOverrides={};
 if(value.liubeiMultiplier!==undefined)overrides.liubeiMultiplier=integer(value.liubeiMultiplier,0,50,'liubeiMultiplier');
 const stageTargets:number[]=STAGES.map(stage=>stage.target);
 if(value.stageTargets!==undefined){if(!isRecord(value.stageTargets))throw Error('stageTargets must be an object with 1-based stage keys');assertKeys(value.stageTargets,STAGES.map((_,i)=>String(i+1)),'stageTargets');const normalized:Record<string,number>={};for(const [key,target] of Object.entries(value.stageTargets)){normalized[key]=integer(target,1,1_000_000_000_000,`stageTargets.${key}`);stageTargets[Number(key)-1]=normalized[key];}overrides.stageTargets=normalized;}
 return{overrides,tuning:{...overrides.liubeiMultiplier!==undefined?{liubeiMultiplier:overrides.liubeiMultiplier}:{},...overrides.stageTargets?{stageTargets}:{}}};
}
function actionFor(v:ForgeView,starter:CompanionId,policy:EvaluationPolicy,tuning:ForgeTuning):Omit<ForgeAction,'seq'>{return policy==='counterplay'?counterplayStrategy(v,starter,tuning):forgeStrategy(v,starter,tuning);}
function triggerCounts(result:NonNullable<ForgeView['result']>){const counts:Record<string,number>={};for(const step of result.steps)if(generalNames.has(step.source)&&!step.text.includes('未触发'))counts[step.source]=(counts[step.source]??0)+1;return counts;}
export function runEvaluation(seed:string,starter:CompanionId,policy:EvaluationPolicy='counterplay',tuning:ForgeTuning={}):RunTrace{
 let state=newForge(seed),current:{generals:string[];initialDiscards:number;bestAttack:number;bestFormation:string|null;triggers:Record<string,number>}|null=null,lastStage:StageTrace|null=null;
 const stages:StageTrace[]=[];
 for(let step=0;step<300&&!['victory','defeat'].includes(state.phase);step++){
  const view=forgeView(state),action=actionFor(view,starter,policy,tuning),beforeStage=state.stage;
  const outcome=forgeAction(state,{...action,seq:state.seq},tuning);if(outcome.error)throw Error(`${seed} ${state.phase} ${action.type}: ${outcome.error}`);state=outcome.state;
  if(action.type==='begin')current={generals:state.companions.map(c=>COMPANIONS[c.id].name),initialDiscards:state.discards,bestAttack:0,bestFormation:null,triggers:{}};
  if(action.type==='play'&&state.result&&current&&state.result.total>current.bestAttack){current.bestAttack=state.result.total;current.bestFormation=HAND_NAMES[state.result.category];current.triggers=triggerCounts(state.result);}
  if(action.type==='next'&&current&&['shop','victory','defeat'].includes(state.phase)){
   const won=state.phase!=='defeat',trace:StageTrace={stage:beforeStage+1,name:STAGES[beforeStage].name,target:state.target,status:won?'win':'loss',handsUsed:state.played,discardsUsed:Math.max(0,current.initialDiscards-state.discards),bestAttack:current.bestAttack,peakRatio:round(current.bestAttack/state.target),bestFormation:current.bestFormation,generals:current.generals,triggers:current.triggers,purchases:[]};stages.push(trace);lastStage=trace;current=null;
  }
  if(lastStage&&action.type==='buy'&&action.id)lastStage.purchases.push(`武将：${COMPANIONS[action.id as CompanionId].name}${action.replace?`（替换${COMPANIONS[action.replace as CompanionId].name}）`:''}`);
  if(lastStage&&action.type==='edit'&&state.lastEdit)lastStage.purchases.push(`整编：${state.lastEdit}`);
 }
 if(state.phase!=='victory'&&state.phase!=='defeat')throw Error(`${seed} did not terminate within 300 actions`);
 return{seed,starter,status:state.phase,failedStage:state.phase==='defeat'?state.stage+1:null,bestAttack:state.stats.best,stages};
}
interface StageAggregate {stage:number;name:string;target:number;reached:number;wins:number;failRate:number;oneHandRate:number;medianHands:number;medianPeakRatio:number;p90PeakRatio:number;medianDiscards:number}
interface StarterAggregate {starter:CompanionId;runs:number;wins:number;winRate:number;stages:StageAggregate[];representativeSeeds:{median:string|null;highRoll:string|null;failure:string|null}}
function aggregateStarter(starter:CompanionId,traces:RunTrace[]):StarterAggregate{
 const stages=STAGES.map((stage,index)=>{const samples=traces.map(run=>run.stages[index]).filter((x):x is StageTrace=>!!x),wins=samples.filter(x=>x.status==='win');return{stage:index+1,name:stage.name,target:samples[0]?.target??stage.target,reached:samples.length,wins:wins.length,failRate:round(samples.filter(x=>x.status==='loss').length/Math.max(1,samples.length)),oneHandRate:round(wins.filter(x=>x.handsUsed===1).length/Math.max(1,wins.length)),medianHands:quantile(wins.map(x=>x.handsUsed),.5),medianPeakRatio:quantile(samples.map(x=>x.peakRatio),.5),p90PeakRatio:quantile(samples.map(x=>x.peakRatio),.9),medianDiscards:quantile(samples.map(x=>x.discardsUsed),.5)};});
 const scored=traces.map(run=>({run,mean:run.stages.reduce((sum,s)=>sum+s.peakRatio,0)/Math.max(1,run.stages.length)})).sort((a,b)=>a.mean-b.mean),wins=traces.filter(run=>run.status==='victory');return{starter,runs:traces.length,wins:wins.length,winRate:round(wins.length/traces.length),stages,representativeSeeds:{median:scored[Math.floor(scored.length/2)]?.run.seed??null,highRoll:[...traces].sort((a,b)=>b.bestAttack-a.bestAttack)[0]?.seed??null,failure:traces.find(run=>run.status==='defeat')?.seed??null}};
}
function alertsFor(results:StarterAggregate[]){const alerts:{type:string;starter:CompanionId;stage:number;value:number}[]=[];for(const result of results)for(const stage of result.stages){if(stage.oneHandRate>=.5)alerts.push({type:'high_one_hand_rate',starter:result.starter,stage:stage.stage,value:stage.oneHandRate});if(stage.p90PeakRatio>=stage.medianPeakRatio*2.5&&stage.p90PeakRatio>=2)alerts.push({type:'wide_peak_spread',starter:result.starter,stage:stage.stage,value:stage.p90PeakRatio});if(stage.failRate>=.2)alerts.push({type:'high_failure_rate',starter:result.starter,stage:stage.stage,value:stage.failRate});}return alerts.slice(0,12);}
function batch(starters:CompanionId[],runs:number,seedPrefix:string,policy:EvaluationPolicy,tuning:ForgeTuning){const results=starters.map(starter=>aggregateStarter(starter,Array.from({length:runs},(_,i)=>runEvaluation(`${seedPrefix}-${i}`,starter,policy,tuning))));return{results,alerts:alertsFor(results)};}
function meta(operation:AiEvaluationRequest['operation'],policy:EvaluationPolicy,localRuns:number){return{schemaVersion:1,operation,gameVersion:FORGE_VERSION,policy,localRuns,rawLogs:false,interpretation:'Automated policy regression evidence; not human win rate or enjoyment.'};}
export function evaluateAiRequest(input:unknown):unknown{
 if(!isRecord(input))throw Error('request must be a JSON object');if(input.schemaVersion!==1)throw Error('schemaVersion must be 1');if(!['simulate_batch','inspect_run','compare_rules'].includes(String(input.operation)))throw Error('operation must be simulate_batch, inspect_run, or compare_rules');
 const operation=input.operation as AiEvaluationRequest['operation'];
 if(operation==='simulate_batch'){assertKeys(input,['schemaVersion','operation','starters','runsPerStarter','seedPrefix','policy','overrides'],'request');const starters=startersOf(input.starters),runs=integer(input.runsPerStarter??200,1,5000,'runsPerStarter'),seedPrefix=seedPrefixOf(input.seedPrefix),policy=policyOf(input.policy),{overrides,tuning}=tuningOf(input.overrides),report=batch(starters,runs,seedPrefix,policy,tuning);return{meta:meta(operation,policy,starters.length*runs),request:{starters,runsPerStarter:runs,seedPrefix,overrides},...report};}
 if(operation==='inspect_run'){assertKeys(input,['schemaVersion','operation','seed','starter','policy','overrides'],'request');if(typeof input.seed!=='string'||!input.seed.length||input.seed.length>100)throw Error('seed must be 1 to 100 characters');if(!STARTERS.includes(input.starter as CompanionId))throw Error('starter must be guanyu, zhouyu, or liubei');const starter=input.starter as CompanionId,policy=policyOf(input.policy),{overrides,tuning}=tuningOf(input.overrides),run=runEvaluation(input.seed,starter,policy,tuning);return{meta:meta(operation,policy,1),request:{seed:input.seed,starter,overrides},run};}
 assertKeys(input,['schemaVersion','operation','starters','runsPerStarter','seedPrefix','policy','baseline','variants'],'request');const starters=startersOf(input.starters),runs=integer(input.runsPerStarter??200,1,2000,'runsPerStarter'),seedPrefix=seedPrefixOf(input.seedPrefix),policy=policyOf(input.policy);if(typeof input.baseline!=='string'||!input.baseline.length)throw Error('baseline must name one variant');if(!isRecord(input.variants))throw Error('variants must be an object');const names=Object.keys(input.variants);if(names.length<2||names.length>8||!names.includes(input.baseline))throw Error('variants must contain 2 to 8 entries including baseline');
 const reports=new Map<string,ReturnType<typeof batch>>(),normalized:Record<string,RuleOverrides>={};for(const name of names){if(!name.length||name.length>40)throw Error('variant names must be 1 to 40 characters');const parsed=tuningOf(input.variants[name]);normalized[name]=parsed.overrides;reports.set(name,batch(starters,runs,seedPrefix,policy,parsed.tuning));}const baseline=reports.get(input.baseline)!;
 const variants=names.filter(name=>name!==input.baseline).map(name=>{const candidate=reports.get(name)!,winRateDeltas=starters.map((starter,index)=>({starter,baseline:baseline.results[index].winRate,value:candidate.results[index].winRate,delta:round(candidate.results[index].winRate-baseline.results[index].winRate)})),changes:{starter:CompanionId;stage:number;metric:string;baseline:number;value:number;delta:number}[]=[];for(let i=0;i<starters.length;i++)for(let stage=0;stage<STAGES.length;stage++)for(const metric of ['failRate','oneHandRate','medianHands','medianPeakRatio','p90PeakRatio'] as const){const a=baseline.results[i].stages[stage][metric],b=candidate.results[i].stages[stage][metric];changes.push({starter:starters[i],stage:stage+1,metric,baseline:a,value:b,delta:round(b-a)});}changes.sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));return{name,overrides:normalized[name],winRateDeltas,largestStageChanges:changes.slice(0,12)};});
 return{meta:meta(operation,policy,starters.length*runs*names.length),request:{starters,runsPerStarter:runs,seedPrefix,baseline:input.baseline},baseline:{name:input.baseline,overrides:normalized[input.baseline]},variants};
}
