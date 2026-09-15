import type {Score,ScoreStep} from '@three-card/core';

export type SettlementBeat='lots'|'set'|'bidding'|'hammer';

export interface SettlementPresentation {
 beat:SettlementBeat;
 visibleCount:number;
 complete:boolean;
 ordinary:boolean;
 activeStep:ScoreStep|null;
 activeCardId:string|null;
 displayTotal:number;
}

const penaltySources=new Set(['重复估价','冷场试探','买家看穿','禁品审查','诡物压场']);

export function settlementPresentation(score:Score,visibleCount:number):SettlementPresentation{
 const visible=Math.min(score.steps.length,Math.max(0,visibleCount));
 const complete=visible>=score.steps.length;
 const activeStep=visible?score.steps[visible-1]:null;
 const ordinary=!score.steps.some(step=>step.source==='额外计分牌');
 let beat:SettlementBeat='lots';
 if(complete)beat='hammer';
 else if(visible===1)beat='set';
 else if(visible>1)beat='bidding';
 let displayTotal=0;
 if(activeStep){
  const penalty=score.steps.slice(0,visible).some(step=>penaltySources.has(step.source))?score.penalty:1;
  displayTotal=Math.floor(activeStep.chips*activeStep.mult*penalty);
 }
 if(complete)displayTotal=score.total;
 return{beat,visibleCount:visible,complete,ordinary,activeStep,activeCardId:activeStep?.cardId??null,displayTotal};
}
