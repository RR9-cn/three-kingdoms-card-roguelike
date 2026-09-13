import {COMPANIONS,COMPANION_IDS,FORGE_VERSION,HAND_NAMES,type CompanionId} from '@three-card/content';
import {deck,newForge,previewForge,randomState,shuffle,type ArmyCard,type ForgeState} from '@three-card/core';

export interface ChoiceEvaluation {
  key:string;
  ids:string[];
  score:number;
  category:number;
  triggerSources:string[];
}

export interface BestChoices {
  score:number;
  secondScore:number;
  choices:ChoiceEvaluation[];
}

export interface GeneralChoiceMetric {
  id:CompanionId;
  name:string;
  role:string;
  scope:'guaranteed-battle'|'random-after-play'|'discard-economy'|'deck-state';
  comparisons:number;
  choiceChangeRate:number;
  meanScoreUpliftPct:number;
  byContextSize:{size:number;comparisons:number;choiceChangeRate:number;meanScoreUpliftPct:number}[];
}

export interface ChoiceDivergenceReport {
  schemaVersion:1;
  contentVersion:string;
  seed:string;
  sampleCount:number;
  boundaries:{deck:string;state:string;preview:string;interpretation:string};
  summary:{buildCount:number;marginalComparisons:number;singleGeneralAgreementRate:number;meanBestSecondMarginPct:number;meanDistinctSingleGeneralOptima:number};
  generals:GeneralChoiceMetric[];
  formations:{category:number;name:string;share:number}[];
  triggerSources:{name:string;share:number}[];
  closestSingleGeneralPairs:{left:string;right:string;agreementRate:number}[];
  mostDivergentSingleGeneralPairs:{left:string;right:string;agreementRate:number}[];
  manualReviewCandidates:{id:CompanionId;name:string;reason:string}[];
}

const SOURCE_NAMES=new Set(['张飞','周瑜','赵云','诸葛亮']);
const scope=(id:CompanionId):GeneralChoiceMetric['scope']=>id==='pursuit'?'random-after-play':id==='caocao'?'discard-economy':id==='abacus'?'deck-state':'guaranteed-battle';
const round=(n:number,digits=4)=>Number(n.toFixed(digits));
const mean=(values:number[])=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;
const overlap=(left:BestChoices,right:BestChoices)=>{const keys=new Set(left.choices.map(choice=>choice.key));return right.choices.some(choice=>keys.has(choice.key));};

function combinations<T>(items:readonly T[],size:number):T[][]{
  const out:T[][]=[];
  const visit=(start:number,current:T[])=>{
    if(current.length===size){out.push([...current]);return;}
    for(let i=start;i<=items.length-(size-current.length);i++){current.push(items[i]);visit(i+1,current);current.pop();}
  };
  visit(0,[]);
  return out;
}

export function enumerateBestChoices(state:ForgeState):BestChoices{
  const scores:ChoiceEvaluation[]=[];
  for(const ids of combinations(state.hand,3)){
    const result=previewForge(state,ids);
    scores.push({
      key:[...ids].sort().join('|'),
      ids:[...ids],
      score:result.total,
      category:result.category,
      triggerSources:[...new Set(result.steps.filter(step=>SOURCE_NAMES.has(step.source)&&step.text.includes('发起')).map(step=>step.source))],
    });
  }
  const ordered=[...new Set(scores.map(choice=>choice.score))].sort((a,b)=>b-a);
  const best=ordered[0]??0;
  return{score:best,secondScore:ordered[1]??best,choices:scores.filter(choice=>choice.score===best).sort((a,b)=>a.key.localeCompare(b.key))};
}

export function seededHands(seed:string,count:number):ArmyCard[][]{
  const rng=randomState(seed),cards=deck().map(card=>({...card,bonus:0}));
  return Array.from({length:count},()=>shuffle(cards,rng,'player').slice(0,6).map(card=>({...card})));
}

function stateFor(hand:ArmyCard[],build:CompanionId[]):ForgeState{
  const state=newForge('choice-divergence-preview');
  state.phase='battle';
  state.army=deck().map(card=>({...card,bonus:0}));
  state.hand=hand.map(card=>card.id);
  state.draw=state.army.map(card=>card.id).filter(id=>!state.hand.includes(id));
  state.discard=[];
  state.companions=build.map(id=>({id,growth:0}));
  state.gold=0;
  state.score=0;
  state.stage=0;
  state.target=100;
  state.hands=4;
  state.discards=2;
  return state;
}

function buildKey(build:CompanionId[]){return build.join(',');}

export function analyzeChoiceDivergence(options:{seed:string;sampleCount:number;hands?:ArmyCard[][]}):ChoiceDivergenceReport{
  const hands=options.hands??seededHands(options.seed,options.sampleCount);
  const builds=[...Array.from({length:4},(_,size)=>combinations(COMPANION_IDS,size)).flat()];
  const cache=new Map<string,BestChoices>();
  const evaluate=(sample:number,build:CompanionId[])=>{
    const key=`${sample}:${buildKey(build)}`;
    let value=cache.get(key);
    if(!value){value=enumerateBestChoices(stateFor(hands[sample],build));cache.set(key,value);}
    return value;
  };

  for(let sample=0;sample<hands.length;sample++)for(const build of builds)evaluate(sample,build);

  let marginalComparisons=0;
  const generals=COMPANION_IDS.map(id=>{
    const contexts=[...Array.from({length:3},(_,size)=>combinations(COMPANION_IDS.filter(other=>other!==id),size)).flat()];
    const sizes=[0,1,2].map(size=>{
      let changed=0;
      const uplift:number[]=[];
      const selected=contexts.filter(context=>context.length===size);
      for(let sample=0;sample<hands.length;sample++)for(const context of selected){
        const before=evaluate(sample,context);
        const after=evaluate(sample,[...context,id].sort((a,b)=>COMPANION_IDS.indexOf(a)-COMPANION_IDS.indexOf(b)));
        if(!overlap(before,after))changed++;
        uplift.push(before.score?(after.score-before.score)/before.score:0);
      }
      marginalComparisons+=selected.length*hands.length;
      return{size,comparisons:selected.length*hands.length,choiceChangeRate:round(changed/(selected.length*hands.length)),meanScoreUpliftPct:round(mean(uplift)*100,2)};
    });
    const comparisons=sizes.reduce((sum,item)=>sum+item.comparisons,0);
    return{
      id,name:COMPANIONS[id].name,role:COMPANIONS[id].role,scope:scope(id),comparisons,
      choiceChangeRate:round(sizes.reduce((sum,item)=>sum+item.choiceChangeRate*item.comparisons,0)/comparisons),
      meanScoreUpliftPct:round(sizes.reduce((sum,item)=>sum+item.meanScoreUpliftPct*item.comparisons,0)/comparisons,2),
      byContextSize:sizes,
    } satisfies GeneralChoiceMetric;
  });

  const singlePairs:{left:string;right:string;agreementRate:number}[]=[];
  for(let i=0;i<COMPANION_IDS.length;i++)for(let j=i+1;j<COMPANION_IDS.length;j++){
    let agreements=0;
    for(let sample=0;sample<hands.length;sample++)if(overlap(evaluate(sample,[COMPANION_IDS[i]]),evaluate(sample,[COMPANION_IDS[j]])))agreements++;
    singlePairs.push({left:COMPANIONS[COMPANION_IDS[i]].name,right:COMPANIONS[COMPANION_IDS[j]].name,agreementRate:round(agreements/hands.length)});
  }

  const formationCounts=Array(HAND_NAMES.length).fill(0) as number[];
  const sourceCounts=new Map<string,number>();
  const margins:number[]=[];
  let weightedChoices=0;
  for(let sample=0;sample<hands.length;sample++)for(const build of builds.filter(item=>item.length>0)){
    const result=evaluate(sample,build);
    margins.push(result.score?(result.score-result.secondScore)/result.score:0);
    const weight=1/result.choices.length;
    for(const choice of result.choices){
      formationCounts[choice.category]+=weight;
      for(const source of choice.triggerSources)sourceCounts.set(source,(sourceCounts.get(source)??0)+weight);
      weightedChoices+=weight;
    }
  }

  const distinct=hands.map((_,sample)=>new Set(COMPANION_IDS.flatMap(id=>evaluate(sample,[id]).choices.map(choice=>choice.key))).size);
  const guaranteed=generals.filter(metric=>metric.scope==='guaranteed-battle');
  const median=(values:number[])=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)]??0;
  const medianChange=median(guaranteed.map(metric=>metric.choiceChangeRate));
  const medianUplift=median(guaranteed.map(metric=>metric.meanScoreUpliftPct));
  const manualReviewCandidates=guaranteed
    .filter(metric=>metric.choiceChangeRate<=medianChange&&metric.meanScoreUpliftPct>=medianUplift)
    .sort((a,b)=>b.meanScoreUpliftPct-a.meanScoreUpliftPct||a.choiceChangeRate-b.choiceChangeRate)
    .slice(0,3)
    .map(metric=>({id:metric.id,name:metric.name,reason:`确定得分平均提升 ${metric.meanScoreUpliftPct}%，但最优三张改变率为 ${round(metric.choiceChangeRate*100,1)}%；仅列为人工检查候选。`}));
  const totalFormations=formationCounts.reduce((sum,value)=>sum+value,0);
  const sortedPairs=[...singlePairs].sort((a,b)=>b.agreementRate-a.agreementRate||a.left.localeCompare(b.left));

  return{
    schemaVersion:1,contentVersion:FORGE_VERSION,seed:options.seed,sampleCount:hands.length,
    boundaries:{
      deck:'未整编的36张基础牌库；每个样本抽取六张公开手牌。',
      state:'第1关中性战斗状态、零成长、零阵型升级、零军资，不包含Boss与换牌。',
      preview:'只使用正式确定性预览；不抽取马超追击等出牌后隐藏随机结果。',
      interpretation:'报告用于定位人工审核候选，不代表强弱平衡结论或真人选择预测。',
    },
    summary:{
      buildCount:builds.length,marginalComparisons,
      singleGeneralAgreementRate:round(mean(singlePairs.map(pair=>pair.agreementRate))),
      meanBestSecondMarginPct:round(mean(margins)*100,2),
      meanDistinctSingleGeneralOptima:round(mean(distinct),2),
    },
    generals,
    formations:formationCounts.map((value,category)=>({category,name:HAND_NAMES[category],share:round(value/totalFormations)})),
    triggerSources:[...sourceCounts].map(([name,value])=>({name,share:round(value/weightedChoices)})).sort((a,b)=>b.share-a.share),
    closestSingleGeneralPairs:sortedPairs.slice(0,5),
    mostDivergentSingleGeneralPairs:sortedPairs.slice(-5).reverse(),
    manualReviewCandidates,
  };
}

const percent=(value:number)=>`${round(value*100,1)}%`;
export function choiceDivergenceMarkdown(report:ChoiceDivergenceReport):string{
  const lines=[
    '# v0.7 选牌分歧诊断',
    '',
    `- 内容版本：${report.contentVersion}`,
    `- 固定种子：\`${report.seed}\``,
    `- 六张手牌样本：${report.sampleCount}`,
    `- 比较构筑：${report.summary.buildCount}（零至三名将星）`,
    '',
    '## 边界',
    '',
    ...Object.values(report.boundaries).map(value=>`- ${value}`),
    '',
    '## 总览',
    '',
    `- 单将构筑两两共享最优选择：${percent(report.summary.singleGeneralAgreementRate)}`,
    `- 同一手牌在12种单将构筑中的平均最优三张数量：${report.summary.meanDistinctSingleGeneralOptima}`,
    `- 最优选择领先次优选择的平均幅度：${report.summary.meanBestSecondMarginPct}%`,
    '',
    '## 单名将星的边际影响',
    '',
    '| 将星 | 范围 | 改变最优三张 | 确定得分平均提升 |',
    '|---|---|---:|---:|',
    ...report.generals.map(metric=>`| ${metric.name} | ${metric.scope} | ${percent(metric.choiceChangeRate)} | ${metric.meanScoreUpliftPct}% |`),
    '',
    '“改变最优三张”只有在加入将星前后的全部并列最优选择完全不相交时才计数。得分提升与决策改变分开统计。',
    '',
    '## 最优阵型集中度',
    '',
    ...report.formations.map(item=>`- ${item.name}：${percent(item.share)}`),
    '',
    '## 额外计分发起者覆盖',
    '',
    ...(report.triggerSources.length?report.triggerSources.map(item=>`- ${item.name}：${percent(item.share)}`):['- 无']),
    '',
    '## 人工检查候选',
    '',
    ...(report.manualReviewCandidates.length?report.manualReviewCandidates.map(item=>`- **${item.name}**：${item.reason}`):['- 当前阈值下没有候选。']),
    '',
    '候选只表示“增幅相对明显、但较少改变当前最优选择”，不能据此直接削弱或移除。经济、牌库状态和隐藏随机效果超出本次即时选牌指标的解释范围。',
    '',
    '## 单将构筑对比',
    '',
    '最接近：',
    ...report.closestSingleGeneralPairs.map(pair=>`- ${pair.left} / ${pair.right}：${percent(pair.agreementRate)}`),
    '',
    '分歧最大：',
    ...report.mostDivergentSingleGeneralPairs.map(pair=>`- ${pair.left} / ${pair.right}：${percent(pair.agreementRate)}`),
    '',
  ];
  return lines.join('\n');
}
