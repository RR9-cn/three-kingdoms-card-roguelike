import { CONTENT_VERSION, RULES, TACTICS, RELICS, ROUTE, EVENT_IDS, ENEMIES, type TacticId, type RelicId, type EnemyId, type EventId, type NodeKind } from '@three-card/content';
import { battleAction, newBattle, playerView, copy, requireRule, RuleError, type BattleState, type BattleAction } from './battle';
import { randomState, random, shuffle, type RandomState } from './random';
export type RunPhase = 'route' | 'battle' | 'reward' | 'camp' | 'event' | 'shop' | 'victory' | 'defeat';
export interface Offer { id: string; kind: 'tactic' | 'relic' | 'heal'; item: string; price: number; sold: boolean }
export interface RunState {
  schemaVersion: number; contentVersion: string; seed: string; seq: number; mode: 'campaign' | 'single'; rng: RandomState;
  phase: RunPhase; layer: number; path: NodeKind[]; hp: number; maxHp: number; gold: number;
  tactics: TacticId[]; relics: RelicId[]; battle: BattleState | null; tutorial: boolean; tutorialComplete: boolean;
  reward: { id: string; kind: 'tactic' | 'relic'; candidates: string[] } | null;
  event: EventId | null; offers: Offer[]; transactions: string[];
  stats: { battles: number; rounds: number; maxDamage: number; pressureWins: number; pressureLosses: number; yields: number; hands: number[] };
}
export interface RunAction {
  seq: number; type: 'enter' | 'battle' | 'finish-battle' | 'claim' | 'camp' | 'event' | 'buy' | 'leave';
  node?: NodeKind; action?: BattleAction; choice?: string; replace?: string; transactionId?: string;
}
export function newRun(seed: string, options: { mode?: 'campaign' | 'single'; tutorial?: boolean } = {}): RunState {
  const s: RunState = { schemaVersion:1, contentVersion:CONTENT_VERSION, seed, seq:0, mode:options.mode ?? 'campaign', rng:randomState(seed),
    phase:'route', layer:0, path:[], hp:RULES.campaign.initialHp, maxHp:RULES.campaign.initialHp, gold:RULES.campaign.initialGold,
    tactics:['advance'], relics:[], battle:null, tutorial:options.tutorial ?? false, tutorialComplete:false,
    reward:null, event:null, offers:[], transactions:[], stats:{ battles:0, rounds:0, maxDamage:0, pressureWins:0, pressureLosses:0, yields:0, hands:[0,0,0,0,0,0] } };
  enter(s,'battle');return s;
}
function candidates(s:RunState, kind:'tactic'|'relic', count:number): string[] {
  const owned=kind==='tactic'?s.tactics:s.relics;
  return shuffle(Object.keys(kind==='tactic'?TACTICS:RELICS).filter(id=>!owned.some(x=>x===id)),s.rng,'reward').slice(0,count);
}
function enter(s:RunState,node:NodeKind):void {
  requireRule(s.phase==='route' && ROUTE[s.layer]?.includes(node),'此路线不可进入');
  s.path.push(node);s.event=null;s.offers=[];s.reward=null;s.battle=null;
  if(node==='battle'||node==='elite'||node==='boss') {
    let enemyId:EnemyId='yellow-blade';
    if(node==='elite')enemyId='yellow-captain';else if(node==='boss')enemyId='zhang-jiao';else if(s.layer>0)enemyId=(['yellow-blade','yellow-scout','yellow-guard'] as const)[Math.floor(random(s.rng,'map')*3)];
    s.battle=newBattle(`${s.seed}:battle:${s.layer}`,{enemyId,hp:s.hp,maxHp:s.maxHp,tactics:s.tactics,relics:s.relics,tutorial:s.layer===0&&s.tutorial});s.phase='battle';
  } else if(node==='event') {s.event=EVENT_IDS[Math.floor(random(s.rng,'map')*EVENT_IDS.length)];s.phase='event';}
  else if(node==='shop') {
    s.phase='shop';
    for(const kind of ['tactic','relic'] as const)for(const item of candidates(s,kind,kind==='tactic'?2:1))s.offers.push({id:`${s.seed}:${s.layer}:${item}`,kind,item,price:kind==='tactic'?RULES.shop.tacticPrice:RULES.shop.relicPrice,sold:false});
    s.offers.push({id:`${s.seed}:${s.layer}:heal`,kind:'heal',item:'heal',price:RULES.shop.healPrice,sold:false});
  } else s.phase='camp';
}
function advance(s:RunState):void {s.layer++;s.phase=s.layer>=ROUTE.length?'victory':'route';s.reward=null;s.event=null;s.offers=[];s.battle=null;}
function grant(s:RunState,kind:'tactic'|'relic',id:string,replace?:string):void {
  const source=kind==='tactic'?TACTICS:RELICS;
  const owned:string[]=kind==='tactic'?s.tactics:s.relics;
  const cap=kind==='tactic'?RULES.campaign.tacticCapacity:RULES.campaign.relicCapacity;
  requireRule(Object.hasOwn(source,id)&&!owned.includes(id),'已持有或不存在此物品');
  if(owned.length>=cap) {requireRule(replace&&owned.includes(replace),'已满，请选择替换的物品');owned.splice(owned.indexOf(replace),1,id);}else owned.push(id);
}
function claimTransaction(s:RunState,id:string|undefined,expected:string):void {requireRule(id===expected&&!s.transactions.includes(expected),'该事项已经结算或已过期');s.transactions.push(expected);}
function apply(s:RunState,a:RunAction):void {
  requireRule(a.seq===s.seq,'行动已处理，请以当前进度为准');
  switch(a.type){
    case 'battle': {
      requireRule(s.phase==='battle'&&s.battle&&a.action,'当前没有战斗');const result=battleAction(s.battle,a.action);requireRule(!result.error,result.error??'非法战斗行动');s.battle=result.state;s.hp=s.battle.playerHp;return;
    }
    case 'finish-battle': {
      requireRule(s.phase==='battle'&&s.battle?.phase==='battleEnd','战斗尚未结束');const b=s.battle;s.hp=b.playerHp;
      s.stats.battles++;s.stats.rounds+=b.stats.rounds;s.stats.maxDamage=Math.max(s.stats.maxDamage,b.stats.maxDamage);
      s.stats.pressureWins+=b.stats.pressureWins;s.stats.pressureLosses+=b.stats.pressureLosses;s.stats.yields+=b.stats.yields;b.stats.hands.forEach((n,i)=>s.stats.hands[i]+=n);
      if(!b.victory){s.phase='defeat';return;}
      if(s.layer===0&&s.tutorial)s.tutorialComplete=true;
      if(s.mode==='single'||s.layer===7){s.phase='victory';return;}
      const elite=s.path.at(-1)==='elite';s.gold+=elite?RULES.campaign.eliteGold:RULES.campaign.normalGold;
      const kind=elite?'relic':'tactic';s.reward={id:`${s.seed}:${s.layer}:reward`,kind,candidates:candidates(s,kind,3)};s.phase='reward';return;
    }
    case 'enter': requireRule(a.node,'请选择路线');enter(s,a.node);return;
    case 'claim': {
      requireRule(s.phase==='reward'&&s.reward,'当前无战利品');const r=s.reward;claimTransaction(s,a.transactionId,r.id);
      if(a.choice==='skip')s.gold+=r.kind==='tactic'?RULES.campaign.skipTacticGold:RULES.campaign.skipRelicGold;
      else {requireRule(a.choice&&r.candidates.includes(a.choice),'请选择战利品');grant(s,r.kind,a.choice,a.replace);}
      advance(s);return;
    }
    case 'camp': {
      requireRule(s.phase==='camp','当前不在营地');claimTransaction(s,a.transactionId,`${s.seed}:${s.layer}:camp`);
      if(a.choice==='heal')s.hp=Math.min(s.maxHp,s.hp+RULES.camp.healAmount);
      else {requireRule(a.choice==='train','请选择营地行动');s.maxHp+=RULES.camp.maxHpAndCurrentGain;s.hp+=RULES.camp.maxHpAndCurrentGain;}
      advance(s);return;
    }
    case 'event': {
      requireRule(s.phase==='event'&&s.event,'当前没有事件');claimTransaction(s,a.transactionId,`${s.seed}:${s.layer}:event`);requireRule(a.choice==='0'||a.choice==='1','请选择事件选项');
      if(s.event==='empty-granary'&&a.choice==='0'){requireRule(s.gold>=8,'军资不足');s.gold-=8;s.hp=Math.min(s.maxHp,s.hp+8);}
      if(s.event==='abandoned-banner'&&a.choice==='0'){requireRule(s.hp>5,'兵力不足');s.hp-=5;if(s.tactics.includes('borrow-banner'))s.gold+=8;else grant(s,'tactic','borrow-banner',a.replace);}
      if(s.event==='physician'){if(a.choice==='0'){s.maxHp+=4;s.hp+=4;}else s.gold+=10;}
      advance(s);return;
    }
    case 'buy': {
      requireRule(s.phase==='shop','当前不在商店');const offer=s.offers.find(o=>o.id===a.choice);requireRule(offer&&!offer.sold,'该物品已售罄');requireRule(s.gold>=offer.price,'军资不足');
      claimTransaction(s,a.transactionId,offer.id);
      if(offer.kind==='heal'){requireRule(s.hp<s.maxHp,'兵力已满');s.hp=Math.min(s.maxHp,s.hp+RULES.shop.healAmount);}else grant(s,offer.kind,offer.item,a.replace);
      s.gold-=offer.price;offer.sold=true;return;
    }
    case 'leave':requireRule(s.phase==='shop','此处不能直接离开');advance(s);return;
  }
  throw new RuleError('未知行动');
}
export function runAction(state:RunState,a:RunAction):{state:RunState;error?:string}{const s=copy(state);try{apply(s,a);s.seq++;return{state:s};}catch(e){if(e instanceof RuleError)return{state,error:e.message};throw e;}}
export function runView(s:RunState){return copy({seq:s.seq,mode:s.mode,phase:s.phase,layer:s.layer,path:s.path,hp:s.hp,maxHp:s.maxHp,gold:s.gold,tactics:s.tactics,relics:s.relics,battle:s.battle?playerView(s.battle):null,reward:s.reward,event:s.event,offers:s.offers,stats:s.stats,tutorial:s.tutorial,tutorialComplete:s.tutorialComplete,transactionId:`${s.seed}:${s.layer}:${s.phase}`,routes:s.phase==='route'?ROUTE[s.layer]:[]});}
export type RunView=ReturnType<typeof runView>;

/** Reject malformed snapshots before presentation; version migration is explicit. */
export function isRunState(value:unknown):value is RunState {
  try {
    if(!value||typeof value!=='object')return false;const s=value as RunState;
    const integer=(n:unknown)=>Number.isInteger(n)&&Number(n)>=0;
    if(s.schemaVersion!==1||s.contentVersion!==CONTENT_VERSION||typeof s.seed!=='string'||!integer(s.seq)||!integer(s.layer)||s.layer>8)return false;
    if(!['campaign','single'].includes(s.mode)||!['route','battle','reward','camp','event','shop','victory','defeat'].includes(s.phase))return false;
    if(!integer(s.hp)||!integer(s.maxHp)||s.hp>s.maxHp||s.maxHp<1||!integer(s.gold))return false;
    if(!Array.isArray(s.tactics)||!Array.isArray(s.relics)||s.tactics.length>3||s.relics.length>4||new Set(s.tactics).size!==s.tactics.length||new Set(s.relics).size!==s.relics.length)return false;
    if(s.tactics.some(t=>!Object.hasOwn(TACTICS,t))||s.relics.some(r=>!Object.hasOwn(RELICS,r)))return false;
    if(!Array.isArray(s.path)||!s.path.every(p=>ROUTE.flat().includes(p))||!Array.isArray(s.transactions)||!Array.isArray(s.offers)||!s.stats||!Array.isArray(s.stats.hands))return false;
    if(!s.rng||Object.values(s.rng).length!==5||!Object.values(s.rng).every(n=>integer(n)&&n<=0xffffffff))return false;
    if(s.phase==='battle'&&!s.battle)return false;
    if(s.battle){const b=s.battle;if(!Object.hasOwn(ENEMIES,b.enemyId)||!['arrange','star','roundEnd','battleEnd'].includes(b.phase)||b.player.length!==3||b.enemy.length!==3||!Array.isArray(b.reserve)||!Array.isArray(b.seen)||!b.stats)return false;}
    if(s.phase==='reward'&&(!s.reward||!Array.isArray(s.reward.candidates)))return false;
    if(s.phase==='event'&&(!s.event||!EVENT_IDS.includes(s.event)))return false;
    return true;
  } catch {return false;}
}
