import {writeFileSync} from 'node:fs';
import {analyzeChoiceDivergence,choiceDivergenceMarkdown} from './choice-divergence';

const seed='choice-divergence-v07';
const sampleCount=400;
const report=analyzeChoiceDivergence({seed,sampleCount});
writeFileSync('docs/evidence/choice-divergence-v07.json',JSON.stringify(report,null,2)+'\n');
writeFileSync('docs/evidence/CHOICE_DIVERGENCE_V07.md',choiceDivergenceMarkdown(report));
console.table(report.generals.map(({name,scope,choiceChangeRate,meanScoreUpliftPct})=>({name,scope,choiceChange:`${(choiceChangeRate*100).toFixed(1)}%`,scoreUplift:`${meanScoreUpliftPct.toFixed(1)}%`})));
console.log(`Manual review: ${report.manualReviewCandidates.map(item=>item.name).join('、')||'none'}`);
