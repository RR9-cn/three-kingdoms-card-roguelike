import {forgeStage,companionRarity,SCORE_CAP,type Rarity,BOSSES,COMPANIONS,COMPANION_IDS,STARTERS,FORGE_RULES as R,FORGE_VERSION,STAGES,SUITS,SUIT_NAMES,HAND_NAMES,type CompanionId,type ForgeEdit,type Suit} from '@three-card/content';
import {deck,evaluate,type Card} from './cards';
import {random,randomState,shuffle,type RandomState} from './random';
import {copy,requireRule,RuleError} from './battle';
export interface ArmyCard extends Card {bonus:number}
export interface Companion {id:CompanionId;growth:number}
export interface ScoreStep {source:string;text:string;chips:number;mult:number;cardId?:string}
export interface Score {category:number;chips:number;mult:number;total:number;steps:ScoreStep[];cards:ArmyCard[];growth:Record<string,number>;penalty:number;floor:number;bursts:number}
export type ForgePhase='starter'|'prepare'|'battle'|'result'|'recruit'|'forge'|'shop'|'victory'|'defeat';
export interface ForgeState {
 schemaVersion:7;contentVersion:typeof FORGE_VERSION;seed:string;seq:number;rng:RandomState;phase:ForgePhase;stage:number;
 army:ArmyCard[];nextId:number;hand:string[];draw:string[];discard:string[];companions:Companion[];levels:number[];
 gold:number;score:number;target:number;pressed:boolean;hands:number;discards:number;played:number;lastCategory:number|null;scouted:boolean;lastSuit:Suit|null;
 challenge:number;stageBest:number;recordBefore:number;settlement:'pending'|'bank'|'win'|'loss';lastEdit:string|null;
 result:Score|null;recruits:CompanionId[];offers:{id:CompanionId;sold:boolean}[];refreshes:number;
 stats:{plays:number;best:number;cleared:number;edits:number;pressureWins:number;recruited:number};
}
export type ForgeAction={seq:number;type:'starter'|'begin'|'play'|'discard'|'next'|'recruit'|'edit'|'random-edit'|'buy'|'sell'|'refresh'|'depart'|'reorder'|'bank'|'gamble'|'extend';id?:string;ids?:string[];replace?:string;pressed?:boolean;edit?:ForgeEdit;cardId?:string;suit?:Suit;category?:number;direction?:number};
export function newForge(seed:string):ForgeState{return{schemaVersion:7,contentVersion:FORGE_VERSION,seed,seq:0,rng:randomState(seed),phase:'starter',stage:0,army:deck().map(c=>({...c,bonus:0})),nextId:0,hand:[],draw:[],discard:[],companions:[],levels:[0,0,0,0,0,0],gold:R.startGold,score:0,target:STAGES[0].target,pressed:false,hands:R.hands,discards:R.discards,played:0,lastCategory:null,scouted:false,lastSuit:null,challenge:0,stageBest:0,recordBefore:0,settlement:'bank',lastEdit:null,result:null,recruits:[...STARTERS],offers:[],refreshes:0,stats:{plays:0,best:0,cleared:0,edits:0,pressureWins:0,recruited:0}};}
export const owns=(s:Pick<ForgeState,'companions'>,id:CompanionId)=>s.companions.some(c=>c.id===id);
function selected(s:ForgeState,ids:string[],min:number,max:number):ArmyCard[]{requireRule(ids.length>=min&&ids.length<=max&&new Set(ids).size===ids.length&&ids.every(id=>s.hand.includes(id)),'请选择有效且不重复的手牌');return s.hand.filter(id=>ids.includes(id)).map(id=>s.army.find(c=>c.id===id)!);}
export function formation(s:Pick<ForgeState,'companions'>,cards:Card[]):number{const basic=evaluate(cards).category;const ranks=cards.map(c=>c.rank).sort((a,b)=>a-b);if(owns(s,'scroll')&&ranks[0]<ranks[1]&&ranks[1]<ranks[2]&&ranks[1]-ranks[0]<=2&&ranks[2]-ranks[1]<=2)return Math.max(basic,new Set(cards.map(c=>c.suit)).size===1?4:2);return basic;}
export function bossEncounter(s:Pick<ForgeState,'stage'|'score'|'target'> & {challenge?:number}){const boss=s.challenge?undefined:BOSSES[s.stage];if(!boss)return null;const threshold=Math.ceil(s.target*.4),phase=s.score>=threshold?1:0;return{...boss,phase,threshold,remaining:Math.max(0,s.target-s.score),current:boss.phases[phase]};}
export function forgeRule(s:Pick<ForgeState,'stage'|'score'|'target'> & {challenge?:number}){const boss=bossEncounter(s);if(boss?.phase===1)return s.stage===3?'variety':'thunder';return forgeStage(s).rule;}
function scoreForge(s:ForgeState,ids:string[],resolve:boolean):Score {
 const cards=selected(s,ids,3,3),category=formation(s,cards),level=s.levels[category];
 let chips=R.baseChips[category]+R.levelChips*level,mult=R.baseMult[category]+R.levelMult*level;
 let bursts=0;
 const steps:ScoreStep[]=[],growth:Record<string,number>={};
 const push=(source:string,text:string,cardId?:string)=>steps.push({source,text,chips,mult,...cardId?{cardId}:{}});
 push('阵型',`${HAND_NAMES[category]} Lv.${level+1} · ${chips}兵力 × ${mult}倍率`);
 const pair=cards.some(c=>cards.filter(x=>x.rank===c.rank).length>=2),firstPair=cards.find(c=>cards.filter(x=>x.rank===c.rank).length>=2)?.id;
 const suitCount=new Set(cards.map(c=>c.suit)).size;
 for(let i=0;i<cards.length;i++){
  const card=cards[i];let repeat=1;const repeatSources:string[]=[];
  if(owns(s,'zhangfei')&&card.id===firstPair){repeat++;repeatSources.push('张飞');}
  if(owns(s,'zhugeliang')&&i===cards.length-1){repeat++;repeatSources.push('诸葛亮');}
  for(let trigger=0;trigger<repeat;trigger++){
   if(trigger>0)push(repeatSources[trigger-1]??'追击令',`${card.rank}点牌 · 第${trigger+1}次计分`,card.id);
   const base=forgeStage(s).rule==='high-armor'&&card.rank>=7?0:card.rank;
   chips+=base+card.bonus;push(trigger?'重触发牌':'阵牌',`+${base+card.bonus}兵力${base===0?'（铁甲减免点数）':''}`,card.id);
   for(const c of s.companions){
    if(c.id==='liubei'&&card.rank<=4){chips+=10;mult++;push(COMPANIONS[c.id].name,'低点牌：+10兵力、+1倍率',card.id);}
    if(c.id==='huangzhong'&&card.rank>=7){chips+=18;push(COMPANIONS[c.id].name,'高点牌：+18兵力',card.id);}
    if(c.id==='blade'&&card.rank>=7){mult+=2;push(COMPANIONS[c.id].name,'高点牌：+2倍率',card.id);}
    if(c.id==='diaochan'&&card.suit==='scheme'){mult+=2;push(COMPANIONS[c.id].name,'谋牌：+2倍率',card.id);}
   }
   if(resolve&&trigger>0&&owns(s,'pursuit')&&bursts<3){if(random(s.rng,'enemy')<.35){bursts++;repeat++;push('追击令',`追击成功！追加第${bursts}/3次`,card.id);if(owns(s,'chain')){mult*=1.5;push('连营鼓','连营发动：倍率 ×1.5',card.id);}}else push('追击令','35%追击未触发，本次连锁结束',card.id);}
  }
 }
 for(const c of s.companions){const name=COMPANIONS[c.id].name;switch(c.id){
  case 'guanyu': {const value=c.growth+Number(pair);growth[c.id]=value;if(value){mult+=value;push(name,`${pair?'本次成长+1，':''}累计 +${value}倍率`);}break;}
  case 'zhaoyun': {const straight=[2,4].includes(category),value=c.growth+(straight?2:0);growth[c.id]=value;if(value){mult+=value;push(name,`${straight?'本次成长+2，':''}累计 +${value}倍率`);}break;}
  case 'zhouyu':if(suitCount<=2){mult+=3;push(name,'同兵种协作：+3倍率');}break;
  case 'sunquan':if(suitCount===3){mult+=4;push(name,'三兵种：+4倍率');}break;
  case 'lvbu':if(category===5){mult*=3;push(name,'三军同心：倍率 ×3');}break;
  case 'simayi':if(s.hands===1){mult*=2;push(name,'最后一手：倍率 ×2');}break;
  case 'drum':if(pair){chips+=30;push(name,'合击：+30兵力');}break;
  case 'seal':if(s.pressed){mult*=1.25;push(name,'加压：倍率 ×1.25');}break;
  case 'granary':{const value=Math.min(8,Math.floor(s.gold/5));if(value){mult+=value;push(name,`持有${s.gold}军资：+${value}倍率`);}break;}
  case 'abacus':{const value=Math.max(0,36-s.army.length)*6;if(value){chips+=value;push(name,`精简牌库：+${value}兵力`);}break;}
  case 'oath':if(suitCount===1){mult*=1.8;push(name,'同袍：倍率 ×1.8');}break;
 }}
 let penalty=1;
 if(forgeRule(s)==='variety'&&s.lastCategory===category){penalty=.5;push('疑阵','连续相同阵型：最终攻势 ×0.5');}
 if(forgeRule(s)==='ambush'&&!s.scouted){penalty=.65;push('水寨伏击','本手未换牌：最终攻势 ×0.65');}
 if(forgeStage(s).rule==='flank'&&s.lastSuit===cards[0].suit){penalty=.5;push('渠帅识阵','首牌兵种与上手相同：最终攻势 ×0.5');}
 if(forgeRule(s)==='thunder'){const sheltered=s.hand.some(id=>!ids.includes(id)&&s.army.find(c=>c.id===id)?.suit==='scheme');if(!sheltered){penalty=.6;push('九天雷劫','未留下谋牌：最终攻势 ×0.6');}else push('以谋避雷','手中留有谋牌：雷劫已化解');}
 return{category,chips,mult,total:Math.min(SCORE_CAP,Math.floor(chips*mult*penalty)),floor:Math.min(SCORE_CAP,Math.floor(chips*mult*penalty)),bursts,steps,cards:copy(cards),growth,penalty};
}
export function previewForge(s:ForgeState,ids:string[]):Score{return scoreForge(s,ids,false);}
export function rarityRates(best:number,target:number,pool:CompanionId[]=COMPANION_IDS):Record<Rarity,number>{const base=best>=target?[50,40,10]:best>=target*.5?[65,30,5]:[75,22,3];const tiers:Rarity[]=['common','rare','legendary'];const weights=tiers.map((tier,i)=>pool.some(id=>companionRarity(id)===tier)?base[i]:0);const total=weights.reduce((a,b)=>a+b,0);return Object.fromEntries(tiers.map((tier,i)=>[tier,total?weights[i]/total:0])) as Record<Rarity,number>;}
function sample(s:ForgeState,n:number):CompanionId[]{let pool=COMPANION_IDS.filter(id=>!owns(s,id));const out:CompanionId[]=[];while(out.length<n&&pool.length){const rates=rarityRates(s.stageBest,forgeStage(s).target,pool);let roll=random(s.rng,'reward'),tier:Rarity='legendary';for(const r of ['common','rare','legendary'] as const){roll-=rates[r];if(roll<0){tier=r;break;}}const choices=pool.filter(id=>companionRarity(id)===tier);const id=choices[Math.floor(random(s.rng,'reward')*choices.length)];out.push(id);pool=pool.filter(x=>x!==id);}return out;}
export function wagerValues(total:number){const stake=Math.floor(total*.2);return{stake,win:Math.min(SCORE_CAP,total+stake),loss:total-stake};}
function settle(s:ForgeState,gamble:boolean){requireRule(s.result&&s.settlement==='pending','本手已结算');const r=s.result;s.settlement=gamble?(random(s.rng,'ai')<.5?'win':'loss'):'bank';if(gamble){const v=wagerValues(r.total);r.total=s.settlement==='win'?v.win:v.loss;r.steps.push({source:'乘胜追击',text:s.settlement==='win'?`押注成功：+${v.stake}攻势`:`押注失利：−${v.stake}攻势`,chips:r.chips,mult:r.mult});}s.score=Math.min(SCORE_CAP,s.score+r.total);s.stats.best=Math.max(s.stats.best,r.total);s.stageBest=Math.max(s.stageBest,r.total);}
function refill(s:ForgeState){while(s.hand.length<R.handSize){if(!s.draw.length){if(!s.discard.length)break;s.draw=shuffle(s.discard,s.rng,'player');s.discard=[];}s.hand.push(s.draw.shift()!);}}
function gain(s:ForgeState,id:string|undefined,replace?:string){requireRule(id&&Object.hasOwn(COMPANIONS,id)&&!owns(s,id as CompanionId),'组件无效或已持有');if(s.companions.length>=R.slots){const index=s.companions.findIndex(c=>c.id===replace);requireRule(index>=0,'五个位置已满，请选择替换对象');s.companions.splice(index,1,{id:id as CompanionId,growth:0});}else s.companions.push({id:id as CompanionId,growth:0});s.stats.recruited++;}
function phase(s:ForgeState,...allowed:ForgePhase[]){requireRule(allowed.includes(s.phase),'当前阶段不能执行此行动');}
function randomEdit(s:ForgeState){
 const available:(() => void)[]=[];
 if(s.army.length<R.maxDeck)available.push(()=>{const card=s.army[Math.floor(random(s.rng,'reward')*s.army.length)];s.army.push({...card,id:`copy-${s.nextId++}`});s.lastEdit=`军师募兵：复制了${SUIT_NAMES[card.suit]}${card.rank}`;});
 const trainable=s.army.filter(card=>card.rank<9);if(trainable.length)available.push(()=>{const card=trainable[Math.floor(random(s.rng,'reward')*trainable.length)];card.rank=Math.min(9,card.rank+2);s.lastEdit=`军师练兵：${SUIT_NAMES[card.suit]}升至${card.rank}点`;});
 available.push(()=>{const card=s.army[Math.floor(random(s.rng,'reward')*s.army.length)];card.bonus+=12;s.lastEdit=`军师精锐：${SUIT_NAMES[card.suit]}${card.rank}获得+12兵力`;});
 available.push(()=>{const category=Math.floor(random(s.rng,'reward')*HAND_NAMES.length);s.levels[category]++;s.lastEdit=`军师研习：${HAND_NAMES[category]}升至Lv.${s.levels[category]+1}`;});
 available[Math.floor(random(s.rng,'reward')*available.length)]();
 s.stats.edits++;
}
function applyForge(s:ForgeState,a:ForgeAction){requireRule(a.seq===s.seq,'行动已处理，请以当前局面为准');switch(a.type){
 case 'starter':phase(s,'starter');requireRule(a.id&&STARTERS.includes(a.id as CompanionId),'请选择一个开局核心');gain(s,a.id);s.recruits=[];s.phase='prepare';return;
 case 'begin':{phase(s,'prepare');requireRule(a.pressed===undefined||typeof a.pressed==='boolean','加压选项无效');s.pressed=a.pressed??false;s.target=Math.ceil(forgeStage(s).target*(s.pressed?R.pressureFactor:1));s.score=0;s.stageBest=0;s.settlement='bank';s.hands=forgeStage(s).rule==='last-stand'?3:R.hands;s.discards=R.discards+Number(owns(s,'horse'));s.played=0;s.lastCategory=null;s.lastSuit=null;s.scouted=false;s.result=null;s.hand=[];s.discard=[];s.draw=shuffle(s.army.map(c=>c.id),s.rng,'player');refill(s);s.phase='battle';return;}
 case 'play':{phase(s,'battle');requireRule(s.hands>0,'出牌次数不足');const floor=previewForge(s,a.ids??[]).total;const result=scoreForge(s,a.ids??[],true);result.floor=floor;s.recordBefore=s.stats.best;s.settlement='pending';s.hands--;s.played++;s.stats.plays++;s.result=result;s.lastCategory=result.category;s.lastSuit=result.cards[0].suit;for(const c of s.companions)if(result.growth[c.id]!==undefined)c.growth=result.growth[c.id];const played=result.cards.map(c=>c.id);s.hand=s.hand.filter(id=>!played.includes(id));s.discard.push(...played);s.phase='result';return;}
 case 'discard':{phase(s,'battle');requireRule(s.discards>0,'换牌次数已用完');const cards=selected(s,a.ids??[],1,3);s.hand=s.hand.filter(id=>!cards.some(c=>c.id===id));s.discard.push(...cards.map(c=>c.id));s.discards--;s.scouted=true;if(owns(s,'caocao'))s.gold+=2;refill(s);return;}
 case 'bank':phase(s,'result');settle(s,false);return;
 case 'gamble':phase(s,'result');requireRule(s.result&&wagerValues(s.result.total).stake>0&&wagerValues(s.result.total).win>s.result.total,'分数不足或已达上限，无法押注');settle(s,true);return;
 case 'extend':phase(s,'victory');requireRule(s.stage===7,'尚未通关');s.gold+=10+s.hands+Math.min(5,Math.floor(s.gold/5))+(s.pressed?R.pressureReward:0);s.recruits=sample(s,3);s.phase='recruit';return;
 case 'next':{phase(s,'result');if(s.settlement==='pending')settle(s,false);if(s.score>=s.target){s.stats.cleared++;if(s.pressed)s.stats.pressureWins++;if(s.stage===STAGES.length-1){s.phase='victory';return;}const interest=Math.min(5,Math.floor(s.gold/5));s.gold+=10+s.hands+interest+(s.pressed?R.pressureReward:0);s.recruits=sample(s,3);s.phase='recruit';}else if(s.hands===0)s.phase='defeat';else{refill(s);s.result=null;s.scouted=false;s.phase='battle';}return;}
 case 'recruit':phase(s,'recruit');if(a.id==='skip')s.gold+=4;else{requireRule(a.id&&s.recruits.includes(a.id as CompanionId),'不在本次征募名单中');gain(s,a.id,a.replace);}s.recruits=[];s.phase='forge';return;
 case 'random-edit':{phase(s,'forge');randomEdit(s);s.hand=[];s.draw=[];s.discard=[];s.offers=sample(s,3).map(id=>({id,sold:false}));s.refreshes=0;s.phase='shop';return;}
 case 'edit':{phase(s,'forge');if(a.id==='skip')s.gold+=3;else{
  requireRule(a.edit&&['remove','copy','rank','enhance','suit','level'].includes(a.edit),'请选择整编方式');
  if(a.edit==='level'){requireRule(Number.isInteger(a.category)&&a.category!>=0&&a.category!<6,'请选择牌型');s.levels[a.category!]++;}
  else{const index=s.army.findIndex(c=>c.id===a.cardId);requireRule(index>=0,'请选择牌库中的牌');const card=s.army[index];switch(a.edit){
   case 'remove':requireRule(s.army.length>R.minDeck,'牌库不能少于12张');s.army.splice(index,1);break;
   case 'copy':requireRule(s.army.length<R.maxDeck,'牌库最多60张');s.army.push({...card,id:`copy-${s.nextId++}`});break;
   case 'rank':requireRule(card.rank<9,'点数已满');card.rank=Math.min(9,card.rank+2);break;
   case 'enhance':card.bonus+=12;break;
   case 'suit':requireRule(a.suit&&SUITS.includes(a.suit)&&a.suit!==card.suit,'请选择不同兵种');card.suit=a.suit;break;
  }}s.stats.edits++;
 }s.hand=[];s.draw=[];s.discard=[];s.offers=sample(s,3).map(id=>({id,sold:false}));s.refreshes=0;s.phase='shop';return;}
 case 'buy':{phase(s,'shop');const offer=s.offers.find(o=>o.id===a.id&&!o.sold);requireRule(offer,'商品不存在或已售罄');const price=COMPANIONS[offer.id].price;requireRule(s.gold>=price,'军资不足');gain(s,offer.id,a.replace);s.gold-=price;offer.sold=true;return;}
 case 'sell':{phase(s,'shop');const index=s.companions.findIndex(c=>c.id===a.id);requireRule(index>=0,'没有持有此组件');s.gold+=Math.floor(COMPANIONS[s.companions[index].id].price/2);s.companions.splice(index,1);return;}
 case 'refresh':phase(s,'shop');requireRule(s.gold>=R.refreshBase+s.refreshes,'刷新所需军资不足');s.gold-=R.refreshBase+s.refreshes;s.refreshes++;s.offers=sample(s,3).map(id=>({id,sold:false}));return;
 case 'depart':phase(s,'shop');if(s.stage===7)s.challenge++;else s.stage++;s.phase='prepare';s.target=forgeStage(s).target;s.score=0;s.result=null;s.pressed=false;s.offers=[];s.lastEdit=null;return;
 case 'reorder':{phase(s,'shop','prepare','battle');requireRule(a.direction===-1||a.direction===1,'排列方向无效');const i=s.companions.findIndex(c=>c.id===a.id),j=i+a.direction;requireRule(i>=0&&j>=0&&j<s.companions.length,'组件已在边界');[s.companions[i],s.companions[j]]=[s.companions[j],s.companions[i]];return;}
 }throw new RuleError('未知行动');}
export function forgeAction(state:ForgeState,a:ForgeAction):{state:ForgeState;error?:string}{const s=copy(state);try{applyForge(s,a);s.seq++;return{state:s};}catch(e){if(e instanceof RuleError)return{state,error:e.message};throw e;}}
export function forgeView(s:ForgeState){const{rng,draw,discard,...visible}=s;return copy({...visible,hand:s.hand.map(id=>s.army.find(c=>c.id===id)!),drawCount:draw.length,discardCount:discard.length});}
export type ForgeView=ReturnType<typeof forgeView>;
export function isForgeState(value:unknown):value is ForgeState{try{
 if(!value||typeof value!=='object')return false;const s=value as ForgeState;const int=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0;
 if(s.schemaVersion!==7||s.contentVersion!==FORGE_VERSION||typeof s.seed!=='string'||!int(s.seq)||!int(s.stage)||s.stage>=STAGES.length)return false;
 if(!['starter','prepare','battle','result','recruit','forge','shop','victory','defeat'].includes(s.phase)||!Array.isArray(s.army)||s.army.length<R.minDeck||s.army.length>R.maxDeck)return false;
 if(s.army.some(c=>!c||typeof c.id!=='string'||!SUITS.includes(c.suit)||!int(c.rank)||c.rank<1||c.rank>9||!int(c.bonus)))return false;
 const armyIds=s.army.map(c=>c.id);if(new Set(armyIds).size!==armyIds.length)return false;
 if(!Array.isArray(s.hand)||!Array.isArray(s.draw)||!Array.isArray(s.discard))return false;
 const partition=[...s.hand,...s.draw,...s.discard];if(new Set(partition).size!==partition.length||partition.some(id=>!armyIds.includes(id))||s.hand.length>R.handSize)return false;
 if(['battle','result','recruit'].includes(s.phase)&&partition.length!==s.army.length)return false;
 if(s.phase==='battle'&&(s.hand.length<3||s.hands<1))return false;
 if(!Array.isArray(s.companions)||s.companions.length>5||s.companions.some(c=>!c||!Object.hasOwn(COMPANIONS,c.id)||!int(c.growth))||new Set(s.companions.map(c=>c.id)).size!==s.companions.length)return false;
 if(!Array.isArray(s.levels)||s.levels.length!==6||!s.levels.every(int)||!int(s.gold)||!int(s.score)||!int(s.target)||!s.target||!int(s.hands)||s.hands>4||!int(s.discards)||s.discards>3||!int(s.nextId)||!int(s.played)||!int(s.refreshes)||typeof s.pressed!=='boolean')return false;
 if(!int(s.challenge)||!int(s.stageBest)||!int(s.recordBefore)||!['pending','bank','win','loss'].includes(s.settlement)||(s.challenge>0&&s.stage!==7)||(s.settlement==='pending'&&s.phase!=='result')||(s.lastEdit!==null&&typeof s.lastEdit!=='string'))return false;
 if(typeof s.scouted!=='boolean'||(s.lastSuit!==null&&!SUITS.includes(s.lastSuit)))return false;
 if(s.lastCategory!==null&&(!int(s.lastCategory)||s.lastCategory>=6))return false;
 if(!s.rng||['player','enemy','ai','map','reward'].some(k=>!int(s.rng[k as keyof RandomState])||s.rng[k as keyof RandomState]>0xffffffff))return false;
 if(!s.stats||['plays','best','cleared','edits','pressureWins','recruited'].some(k=>!int(s.stats[k as keyof typeof s.stats])))return false;
 if(!Array.isArray(s.recruits)||s.recruits.some(id=>!Object.hasOwn(COMPANIONS,id))||new Set(s.recruits).size!==s.recruits.length)return false;
 if(!Array.isArray(s.offers)||s.offers.some(o=>!o||!Object.hasOwn(COMPANIONS,o.id)||typeof o.sold!=='boolean')||new Set(s.offers.map(o=>o.id)).size!==s.offers.length)return false;
 if(s.result){const r=s.result;if(!int(r.category)||r.category>=6||!int(r.total)||!int(r.floor)||!int(r.bursts)||r.bursts>3||!Number.isFinite(r.chips)||!Number.isFinite(r.mult)||!Array.isArray(r.steps)||r.steps.some(t=>typeof t.source!=='string'||typeof t.text!=='string'||!Number.isFinite(t.chips)||!Number.isFinite(t.mult))||!Array.isArray(r.cards)||r.cards.length!==3||r.cards.some(c=>!c||!int(c.rank)||!SUITS.includes(c.suit)))return false;}
 if(s.phase==='result'&&!s.result)return false;return true;
}catch{return false;}}
