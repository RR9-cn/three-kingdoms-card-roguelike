import {bossEncounter,type ForgeView} from '@three-card/core';

export function bossPanel(v:ForgeView,prepare=false){
 const b=bossEncounter(v);if(!b)return '';
 const defeated=v.score>=v.target,transition=v.phase==='result'&&v.settlement!=='pending'&&!defeated&&v.score-v.result!.total<b.threshold&&v.score>=b.threshold;
 const isFinal=v.stage===7,hasResult=v.phase==='result',pending=hasResult&&v.settlement==='pending',penaltyHit=isFinal&&hasResult&&b.phase===1&&v.result!.penalty<1,sheltered=isFinal&&hasResult&&b.phase===1&&!penaltyHit;
 const motion=defeated?'defeat':transition||penaltyHit?'thunder':pending?'hit':'idle';
 const portrait=`<span class="buyer-portrait buyer-${v.stage} buyer-state-${motion}" aria-hidden="true"><i></i><b>${b.mark}</b></span>`;
 const motionClass=`buyer-state-${motion}${penaltyHit?' boss-punished':sheltered?' boss-sheltered':''}`;
 const status=defeated?'买家退场，成交达标':transition?'预算解封！下一轮偏好改变':penaltyHit?'禁品审查！本轮最终成交价 ×0.6':sheltered?'保留诡物，审查未能压价':`当前偏好 ${b.phase+1} · ${b.current.name}`;
 return `<section class="boss-encounter boss-${v.stage} ${motionClass} ${transition?'phase-shift':''}" aria-label="${b.name}签名买家"><div class="boss-identity">${portrait}<div><p class="eyebrow">${isFinal?'终局买家':'签名买家'} · ${b.title}</p><h2>${b.name}</h2><p class="boss-quote">“${defeated?b.defeated:penaltyHit?'没有诡物压场，这一槌我只出六成。':sheltered?'诡物还在？那就继续举牌。':b.current.quote}”</p></div></div>${prepare?`<p>${b.intro}</p>`:`<div class="boss-health"><label>剩余预算 <b>${b.remaining.toLocaleString()} / ${v.target.toLocaleString()}</b></label><progress max="${v.target}" value="${b.remaining}"></progress><small>${status}</small></div>`}<div class="boss-phases">${b.phases.map((p,i)=>`<div class="${!prepare&&i===b.phase?'current':''}"><b>${i+1} · ${p.name}</b><span>${p.text}</span></div>`).join('')}</div><p class="boss-threshold">累计成交 ${b.threshold.toLocaleString()} 后买家改变偏好；成交额全部保留，也可以一轮落槌。${prepare?'整场共用上拍与撤换次数。':''}</p></section>`;
}
