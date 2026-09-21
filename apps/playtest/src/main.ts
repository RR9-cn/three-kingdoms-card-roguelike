import {TRIGGER_CARDS as C,type TriggerKind} from '../../../packages/content/src/trigger';
import {newTrigger,actTrigger,previewTrigger,triggerView,isTriggerState,TRIGGER_SAVE_KEY,cardPoints,type TriggerState,type TriggerAction,type TriggerCard} from '../../../packages/core/src/trigger';
const app=document.querySelector<HTMLDivElement>('#app')!;
let state:TriggerState|null=null,order:string[]=[],screen:'home'|'game'='home',rules=false,collection=false,error='',shown=0,timer:ReturnType<typeof setTimeout>|null=null,landing:string|null=null;
try{const saved=JSON.parse(localStorage.getItem(TRIGGER_SAVE_KEY)||'null');if(isTriggerState(saved))state=saved;else if(saved)error='存档无法识别，可以开始新夜拍。';}catch{error='存档读取失败，可以开始新夜拍。';}
const esc=(x:unknown)=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function save(){try{localStorage.setItem(TRIGGER_SAVE_KEY,JSON.stringify(state));}catch{error='无法保存：请检查浏览器存储空间。当前仍可继续游玩。';}}
function stop(){if(timer)clearTimeout(timer);timer=null;}
function animate(){stop();if(state?.phase!=='result')return;const count=state.result!.steps.length;if(shown<count){timer=setTimeout(()=>{shown++;landing=state!.result!.steps[shown-1]?.id??null;render();animate();},Math.max(140,440-shown*30));}}
function act(a:Omit<TriggerAction,'seq'>){if(!state)return;try{state=actTrigger(state,{...a,seq:state.seq} as TriggerAction);order=[];error='';shown=0;save();render();if(state.phase==='result'){if(matchMedia('(prefers-reduced-motion: reduce)').matches)shown=state.result!.steps.length;render();animate();}}catch(e){error=(e as Error).message;render();}}
function card(c:TriggerCard,action='pick',extra=''){const d=C[c.kind],idx=order.indexOf(c.id);return `<button class="card ${d.tag==='诡物'?'haunted':d.tag==='工具'?'tool':''} ${idx>=0?'selected':''}" data-action="${action}" data-id="${c.id}" data-kind="${c.kind}" data-bonus="${c.bonus}" ${extra}><span class="card-top"><b>${cardPoints(c)}</b><span>${d.tag}</span></span><span class="sigil">${d.mark}</span><strong>${d.name}</strong><span class="ability">${d.text}</span><small>${c.bonus?`原始${d.points} + 升级${c.bonus}`:'牌面点数'}${idx>=0?` · 第${idx+1}位`:''}</small></button>`;}
function render(){const v=state?triggerView(state):null;
 app.innerHTML=`<header><a href="#" data-action="home">午夜落槌 <span>藏品连锁</span></a><nav><span class="version">v0.9 · 三场验证版</span><button data-action="collection">收藏 ${v?.collection.length??0}</button><button data-action="rules">规则</button></nav></header>${error?`<p role="alert" class="error">${esc(error)}</p>`:''}${screen==='home'?home():game()}${rules?`<div class="overlay"><section class="modal"><button class="close" data-action="rules">关闭</button><p class="eyebrow">只需理解这一条公式</p><h2>点数累加 × 热度 = 成交价</h2><p>卡牌左上角是每次触发贡献的点数。热度每轮从 <b>1</b> 开始，只由卡牌能力增加。</p><ol><li>从六张手牌中依次点选三张，按选择顺序从左到右触发。</li><li>每张牌先贡献点数，再执行能力。镜子会重触发左侧牌的点数与完整能力。</li><li>未选牌保留，下一轮补至六张。每场四轮，另有两次撤换，每次最多三张。</li><li>前三场目标分别为150、260、420。每次战后收集一张新卡，再任选一张牌+2点。</li></ol><p>例：6点银币 → 2点镜子 → 4点木槌。银币触发两次，共18点；木槌见到一次额外触发，热度变2，最终 <b>18 × 2 = 36</b>。</p><p>红手套的50%追触发不计入保底预览。第一位没有左侧牌，相关能力不发动。没有对子、顺子或固定牌型倍率。</p></section></div>`:''}${collection?`<div class="overlay"><section class="modal wide"><button class="close" data-action="collection">关闭</button><h2>本局收藏</h2><p>相同名字可以有多张；每张卡单独升级。</p><div class="cards compact">${state?.deck.map(c=>card(c,'noop')).join('')||'开始夜拍后查看收藏'}</div></section></div>`:''}`;
 armLanding();landing=null;resetTilt();
}
// 落槌动画播完即摘掉标记：终态、重复结算与结算中的重渲染都不残留动画状态
function armLanding(){const el=app.querySelector<HTMLElement>('.played .card[data-landing]');if(!el)return;el.addEventListener('animationend',()=>el.removeAttribute('data-landing'),{once:true});setTimeout(()=>el.removeAttribute('data-landing'),1000);}
function home(){return `<main class="home"><p class="eyebrow">收集 · 排列 · 连锁</p><h1>每一件藏品<br>都能引发<span>下一次举牌。</span></h1><p class="intro">把银币放在镜子前，让木槌接住回声。<br>六张选三张，用你的顺序构建一次爆发。</p><div class="home-example"><span>◈ 银币 <b>6</b></span><i>→</i><span>◇ 镜子 <b>2</b></span><i>→</i><span>⊥ 木槌 <b>4</b></span></div><label>夜拍种子<input id="seed" maxlength="100" placeholder="留空随机；可输入相同种子重玩"></label><div class="actions"><button class="primary" data-action="start">开始新夜拍</button>${state?'<button data-action="resume">继续上次收藏</button>':''}</div><p class="muted">12种能力卡 · 3场夜拍 · 卡牌自带点数 · 战后收集与加点</p></main>`;}
function game(){if(!state)return home();const s=state,v=triggerView(s);const status=`<section class="status"><div><span class="eyebrow">第 ${s.stage+1} / 3 场</span><h2>${['开门试拍','回声藏室','午夜落槌'][s.stage]}</h2></div><div><small>本场成交</small><strong>${s.score.toLocaleString()} <em>/ ${v.target}</em></strong></div><div><small>剩余轮数</small><strong>${s.hands}</strong></div><div><small>可撤换</small><strong>${s.swaps}</strong></div><div><small>单轮纪录</small><strong>${s.best.toLocaleString()}</strong></div></section>`;
 if(s.phase==='victory'||s.phase==='defeat')return `<main>${status}<section class="ending"><p class="eyebrow">${s.phase==='victory'?'三场夜拍完成':'今夜未达成交目标'}</p><h1>${s.phase==='victory'?'收藏，已成连锁。':'下一次，换个顺序。'}</h1><p>最高单轮 <b>${s.best}</b> · 收藏 ${s.deck.length} 张 · 种子 ${esc(s.seed)}</p><button class="primary" data-action="start">随机开始新夜拍</button><button data-action="home">返回首页</button></section></main>`;
 if(s.phase==='reward')return `<main>${status}<section class="reward"><p class="eyebrow">战后收藏 · 选择1张</p><h1>下一次连锁，从这里开始。</h1><p>加入收藏后，任选一张牌增加2点。相同卡可以重复收集。</p><div class="cards rewards">${s.offers.map(kind=>card({id:kind,kind,bonus:0},'take')).join('')}</div></section></main>`;
 if(s.phase==='upgrade')return `<main>${status}<p class="eyebrow">${esc(s.lastEdit)}</p><h2>选择一张卡，牌面点数 +2</h2><p>升级会改变“低于4点”等能力的判定，请结合卡牌说明选择。</p><div class="cards compact">${s.deck.map(c=>card(c,'upgrade')).join('')}</div></main>`;
 if(s.phase==='result'){const r=s.result!,step=r.steps[Math.max(0,shown-1)],done=shown>=r.steps.length;return `<main>${status}<section class="settlement"><p class="eyebrow">${r.extras?'连锁发动':'普通结算'} · ${done?'已落槌':'正在举牌'}</p><div class="scoreboard"><b>${shown?step.points:0}</b><span>点 ×</span><b>${shown?step.heat:1}</b><span>热度</span><strong>${done?'= '+r.total.toLocaleString():''}</strong></div><div class="cards played">${r.ids.map(id=>card(s.deck.find(c=>c.id===id)!,'noop',`tabindex="-1"${id===landing?' data-landing':''}`)).join('')}</div><div class="log" aria-live="polite">${r.steps.slice(0,shown).map(e=>`<p class="${e.extra?'extra':''}"><span>${esc(e.cause)} → <b>${e.name}</b></span><span>${e.text}</span><small>${e.points}点 × ${e.heat}</small></p>`).join('')}</div><div class="actions">${done?`<button class="primary" data-action="next">${s.score>=v.target?(s.stage===2?'查看通关':'收集新卡'):s.hands?'下一轮':'查看结果'}</button><span>${r.extras}次额外触发 · 已入账 ${r.total}</span>`:'<button data-action="skip">跳过动画</button>'}</div></section></main>`;}
 const preview=order.length===3?previewTrigger(s,order):null;
 return `<main>${status}${s.lastEdit?`<p class="notice">${esc(s.lastEdit)}</p>`:''}<section class="battle"><div class="section-title"><div><p class="eyebrow">先选三张，再调整顺序</p><h2>你的顺序，就是你的构筑。</h2></div><button data-action="clear" ${order.length?'':'disabled'}>清空选择</button></div><div class="slots">${[0,1,2].map(i=>{const c=s.deck.find(c=>c.id===order[i]);return `<div class="slot"><small>0${i+1}</small>${c?`<b>${C[c.kind].name}</b><span>${cardPoints(c)}点 · ${C[c.kind].tag}</span><div><button aria-label="${C[c.kind].name}左移" data-action="left" data-id="${c.id}" ${i?'':'disabled'}>←</button><button aria-label="${C[c.kind].name}右移" data-action="right" data-id="${c.id}" ${i<order.length-1?'':'disabled'}>→</button><button data-action="remove" data-id="${c.id}">移除</button></div>`:'<span>点击下方手牌放入</span>'}</div>`;}).join('')}</div><div class="preview"><div><small>保底成交价</small><strong>${preview?`${preview.points} 点 × ${preview.heat} 热度 = ${preview.total}`:'选满三张后显示'}</strong><span>不含红手套的概率追加；剩余手牌保留。</span></div><div class="actions"><button data-action="swap" ${order.length&&s.swaps?'':'disabled'}>撤换所选（${s.swaps}）</button><button class="primary" data-action="play" ${preview?'':'disabled'}>上拍 · 按此顺序</button></div></div><div class="cards hand">${s.hand.map(id=>card(s.deck.find(c=>c.id===id)!)).join('')}</div>${preview?`<details><summary>查看保底计算过程</summary>${preview.steps.map(e=>`<p>${e.cause} → ${e.name}：${e.text}</p>`).join('')}</details>`:''}</section></main>`;
}
app.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-action]');if(!b||b.hasAttribute('disabled'))return;e.preventDefault();const a=b.dataset.action,id=b.dataset.id!;
 if(a==='rules'){rules=!rules;render();return;}if(a==='collection'){collection=!collection;render();return;}
 if(a==='home'){stop();screen='home';order=[];render();return;}
 if(a==='start'){const seed=(document.querySelector<HTMLInputElement>('#seed')?.value.trim())||`night-${crypto.randomUUID().slice(0,8)}`;stop();state=newTrigger(seed);screen='game';order=[];shown=0;error='';save();render();return;}
 if(a==='resume'){screen='game';shown=state?.result?.steps.length||0;render();return;}
 if(a==='skip'){stop();shown=state?.result?.steps.length||0;render();return;}
 if(a==='pick'){if(order.includes(id))order=order.filter(x=>x!==id);else if(order.length<3)order.push(id);render();return;}
 if(a==='clear'){order=[];render();return;}if(a==='remove'){order=order.filter(x=>x!==id);render();return;}
 if(a==='left'||a==='right'){const i=order.indexOf(id),j=i+(a==='left'?-1:1);if(j>=0&&j<order.length)[order[i],order[j]]=[order[j],order[i]];render();return;}
 if(a==='play'||a==='swap')act({type:a,ids:[...order]} as Omit<TriggerAction,'seq'>);
 if(a==='next')act({type:'next'});if(a==='take')act({type:'take',kind:id as TriggerKind} as Omit<TriggerAction,'seq'>);if(a==='upgrade')act({type:'upgrade',id} as Omit<TriggerAction,'seq'>);
});
const finePointer=()=>matchMedia('(hover: hover) and (pointer: fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
const tiltTarget=(t:EventTarget|null)=>t instanceof Element?t.closest<HTMLElement>('.hand .card,.rewards .card,.compact .card'):null;
let tiltCard:HTMLElement|null=null,tiltRect:DOMRect|null=null,tiltFrame=0,tiltPending:{el:HTMLElement;x:number;y:number}|null=null;
function clearTilt(el:HTMLElement|null){if(!el)return;el.classList.remove('tilting');for(const k of ['--rx','--ry','--mx','--my'])el.style.removeProperty(k);}
function resetTilt(){clearTilt(tiltCard);tiltCard=null;tiltRect=null;tiltPending=null;}
let tiltMax=0;
const tiltAngle=()=>tiltMax||(tiltMax=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--auction-tilt-max'))||8);
function applyTilt(){tiltFrame=0;const p=tiltPending;tiltPending=null;if(!p)return;
 if(!p.el.isConnected||!finePointer()){resetTilt();return;}
 if(!tiltRect)tiltRect=p.el.getBoundingClientRect();
 const max=tiltAngle();
 const nx=Math.min(1,Math.max(0,(p.x-tiltRect.left)/tiltRect.width))-.5,ny=Math.min(1,Math.max(0,(p.y-tiltRect.top)/tiltRect.height))-.5;
 p.el.style.setProperty('--ry',(nx*max*2).toFixed(2)+'deg');p.el.style.setProperty('--rx',(-ny*max*2).toFixed(2)+'deg');
 p.el.style.setProperty('--mx',((nx+.5)*100).toFixed(1)+'%');p.el.style.setProperty('--my',((ny+.5)*100).toFixed(1)+'%');}
const inTiltRect=(e:{clientX:number;clientY:number})=>!!tiltRect&&e.clientX>=tiltRect.left&&e.clientX<=tiltRect.right&&e.clientY>=tiltRect.top&&e.clientY<=tiltRect.bottom;
// 倾斜后卡牌的命中区域会随 3D 变换位移，故停留判定用静止矩形，避免指针停在卡角时反复进出
app.addEventListener('pointermove',e=>{if(!finePointer()){resetTilt();return;}const el=inTiltRect(e)?tiltCard:tiltTarget(e.target);if(!el){resetTilt();return;}
 if(el!==tiltCard){clearTilt(tiltCard);tiltCard=el;tiltRect=null;el.classList.add('tilting');}
 tiltPending={el,x:e.clientX,y:e.clientY};if(!tiltFrame)tiltFrame=requestAnimationFrame(applyTilt);});
app.addEventListener('pointerleave',e=>{if(tiltTarget(e.target)&&!inTiltRect(e))resetTilt();},true);
addEventListener('pointerout',e=>{if(!e.relatedTarget)resetTilt();});
addEventListener('scroll',()=>{tiltRect=null;},true);
addEventListener('resize',()=>{tiltRect=null;});
render();
