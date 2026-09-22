import {readFileSync} from 'node:fs';
import {test,expect,type Locator,type Page} from '@playwright/test';
import {newTrigger,previewTrigger,type TriggerCard,TRIGGER_SAVE_KEY} from '../../packages/core/src/trigger';
import {orderedChoices} from '../../tools/ai-play-lib';
async function bestVisible(page:Page){const cards=await page.locator('.hand .card').evaluateAll(nodes=>nodes.map(n=>({id:(n as HTMLElement).dataset.id!,kind:(n as HTMLElement).dataset.kind!,bonus:Number((n as HTMLElement).dataset.bonus)})));const s=newTrigger('public-ui');s.deck=cards as TriggerCard[];s.hand=cards.map(c=>c.id);return orderedChoices(s)[0];}
test('normal UI completes all three stages with collection, upgrade and reload',async({page})=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#seed').fill('smoke-0');await page.getByRole('button',{name:'开始新夜拍',exact:true}).click();await expect(page.locator('.hand .card')).toHaveCount(6);await expect(page.locator('.hand')).toHaveCSS('display','grid');await page.screenshot({path:'docs/evidence/trigger-battle.png',fullPage:true});let rewards=0,upgrades=0,reloaded=false;for(let n=0;n<40;n++){if(await page.locator('.ending').count())break;if(await page.locator('.hand').count()){const choice=await bestVisible(page);for(const id of choice.ids)await page.locator(`.hand [data-id="${id}"]`).click();await expect(page.locator('.preview strong')).toContainText(String(choice.total));await page.getByRole('button',{name:'上拍 · 按此顺序'}).click();if(!reloaded){await page.reload();await page.getByRole('button',{name:'继续上次收藏'}).click();reloaded=true;}if(await page.getByRole('button',{name:'跳过动画'}).count())await page.getByRole('button',{name:'跳过动画'}).click();await expect(page.locator('.scoreboard strong')).toContainText('=');await page.locator('[data-action="next"]').click();}else if(await page.locator('.reward').count()){rewards++;await page.screenshot({path:'docs/evidence/trigger-reward.png',fullPage:true});await page.locator('[data-action="take"]').first().click();}else if(await page.locator('[data-action="upgrade"]').count()){upgrades++;await page.locator('[data-action="upgrade"][data-kind="coin"]').first().click();await expect(page.locator('.notice')).toContainText('→');}}
 await expect(page.locator('.ending')).toContainText('收藏，已成连锁。');expect(rewards).toBe(2);expect(upgrades).toBe(2);expect(errors).toEqual([]);await page.screenshot({path:'docs/evidence/trigger-victory.png',fullPage:true});});
test('ordering, clear and swap work; rules explain source; narrow desktop fits',async({page})=>{await page.setViewportSize({width:1000,height:700});await page.goto('/');await page.locator('#seed').fill('order-ui');await page.getByRole('button',{name:'开始新夜拍',exact:true}).click();const cards=page.locator('.hand .card');await cards.nth(0).click();await cards.nth(1).click();await cards.nth(2).click();const first=await page.locator('.slot b').first().textContent();await page.locator('[data-action="right"]').first().click();expect(await page.locator('.slot b').nth(1).textContent()).toBe(first);await page.getByRole('button',{name:'清空选择'}).click();await cards.nth(0).click();await page.getByRole('button',{name:'撤换所选（2）'}).click();await expect(page.getByRole('button',{name:'撤换所选（1）'})).toBeDisabled();await page.getByRole('button',{name:'规则',exact:true}).click();await expect(page.locator('.modal')).toContainText('18 × 2 = 36');await page.getByRole('button',{name:'关闭',exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);});
test('malformed save falls back to home without crash',async({page})=>{await page.addInitScript(key=>localStorage.setItem(key,'{"version":"trigger-1"}'),TRIGGER_SAVE_KEY);await page.goto('/');await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByRole('button',{name:'开始新夜拍',exact:true})).toBeVisible();});

// —— 以下为「UI 质感与卡牌 3D 纵深」新增断言（playtest-visual-depth）——
const CARD_CSS='apps/playtest/public/trigger.css';
const REST_PLATES=['linear-gradient(150deg,#ede1b8,#c6b789)','linear-gradient(150deg,#d6bdb8,#aa8f91)','linear-gradient(150deg,#bed0c9,#92aaa3)'];
const COLOR_LITERAL=/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;
function cardCss(){return readFileSync(CARD_CSS,'utf8');}
function rootBlock(css:string){const start=css.indexOf(':root{');const end=css.indexOf('}',start);return {root:css.slice(start,end+1),outside:css.slice(0,start)+css.slice(end+1)};}
function matrixZ(transform:string){const m=transform.match(/matrix3d\(([^)]+)\)/);return m?Number(m[1].split(',')[14]):0;}
function matrixM34(transform:string){const m=transform.match(/matrix3d\(([^)]+)\)/);return m?Number(m[1].split(',')[11]):0;}
function shadowLayers(css:string){return css.split(/,(?![^(]*\))/).map(x=>x.trim()).filter(Boolean);}
function layerY(layer:string){const m=layer.match(/(-?[\d.]+)px\s+(-?[\d.]+)px/);return m?Number(m[2]):0;}
async function relBox(locator:Locator,container:string){return locator.evaluate((el,sel)=>{const r=el.getBoundingClientRect(),c=el.closest(sel)!.getBoundingClientRect();return {dx:Math.round((r.left-c.left)*100)/100,dy:Math.round((r.top-c.top)*100)/100,w:Math.round(r.width*100)/100,h:Math.round(r.height*100)/100};},container);}
async function docBox(locator:Locator){return locator.evaluate(el=>{const r=el.getBoundingClientRect();return {x:Math.round((r.left+scrollX)*100)/100,y:Math.round((r.top+scrollY)*100)/100,w:Math.round(r.width*100)/100,h:Math.round(r.height*100)/100};});}
async function cardStyle(page:Page,selector:string,pseudo?:string){return page.locator(selector).first().evaluate((el,p)=>{const s=getComputedStyle(el,p||undefined);return {transform:s.transform,transformStyle:s.transformStyle,perspective:s.perspective,boxShadow:s.boxShadow,backgroundImage:s.backgroundImage,backgroundPosition:s.backgroundPosition,borderWidth:s.borderWidth,borderColor:s.borderColor,fontSize:s.fontSize,color:s.color,outline:s.outlineStyle};},pseudo as string);}
async function startRun(page:Page,seed:string){await page.goto('/');await page.locator('#seed').fill(seed);await page.getByRole('button',{name:'开始新夜拍',exact:true}).click();await expect(page.locator('.hand .card')).toHaveCount(6);}

test('cards render layered material with CSS-3D depth and pointer-following tilt',async({page})=>{
  const css=cardCss();const {root,outside}=rootBlock(css);
  expect(outside.match(COLOR_LITERAL)).toEqual(null);                                  // :root 之外不得出现颜色字面量
  for(const plate of REST_PLATES)expect(root).toContain(plate);                        // 卡面渐变端点色与改动前一致
  const textures=[...css.matchAll(/--auction-texture-[\w-]+:url\("(data:image\/svg\+xml,[^"]+)"\)/g)];
  expect(textures.length).toBeGreaterThanOrEqual(3);                                   // 纹理为令牌内 inline data: URI
  for(const t of textures)expect(t[1]).not.toMatch(/\brgba?\(|\bhsla?\(/);             // 纹理不引入 rgb()/hsl() 文本形式
  expect(css).not.toMatch(/url\(["']?(?!data:)[^)]*\.(png|jpg|jpeg|gif|webp|woff2?|ttf|svg)/); // 不新增外部素材文件
  expect(root).toContain('--auction-tilt-max:8deg');
  expect(root).toContain('--auction-perspective:900px');

  await page.setViewportSize({width:1280,height:800});
  await startRun(page,'smoke-0');
  const card=await cardStyle(page,'.hand .card');
  expect(card.transformStyle).toBe('preserve-3d');
  expect(card.perspective).toBe('900px');
  expect(matrixM34(card.transform)).not.toBe(0);                                       // 卡牌自带透视
  expect(card.backgroundImage).toBe('none');                                            // 材质层不画在卡牌自身背景上
  const face=await cardStyle(page,'.hand .card','::before');
  const shadowPlane=await cardStyle(page,'.hand .card','::after');
  expect(face.backgroundImage).toContain('data:image/svg+xml');                         // 卡面材质为令牌内的 inline data: URI
  expect(matrixZ(face.transform)).toBeLessThan(0);                                     // 卡面层非零 translateZ
  expect(matrixZ(shadowPlane.transform)).toBeLessThan(matrixZ(face.transform));         // 投影板与卡面分离
  const layers=shadowLayers(card.boxShadow);
  expect(layers.filter(l=>layerY(l)>0).length).toBeGreaterThanOrEqual(2);               // 至少两层同向投影
  expect(await page.locator('.hand .card small').first().evaluate(el=>getComputedStyle(el).fontSize)).toBe('10px');

  // 三变体的非色相材质差异（边宽/纹理/投影几何）
  await page.getByRole('button',{name:/^收藏/}).click();
  const variants=await page.evaluate(()=>{
    const pick=(sel:string)=>document.querySelector(sel);
    const dump=(el:Element|null)=>el?{border:getComputedStyle(el).borderWidth,texture:getComputedStyle(el,'::before').backgroundImage.split(',')[0],shadow:getComputedStyle(el).boxShadow.replace(/rgba?\([^)]*\)/g,'').trim()}:null;
    return {haunted:dump(pick('.compact .card.haunted')),tool:dump(pick('.compact .card.tool')),plain:dump(pick('.compact .card:not(.haunted):not(.tool)'))};
  });
  expect(variants.haunted&&variants.tool&&variants.plain).toBeTruthy();
  const sig=(v:{border:string;texture:string;shadow:string}|null)=>[v!.border,v!.texture,v!.shadow].join('|');
  expect(new Set([sig(variants.haunted),sig(variants.tool),sig(variants.plain)]).size).toBe(3);
  await page.getByRole('button',{name:'关闭',exact:true}).click();

  // 指针跟随倾斜、角度有界、相邻卡牌不重排、移出 ≤200ms 复原
  const target=page.locator('.hand .card').nth(1),neighbour=page.locator('.hand .card').nth(4);
  const before=await docBox(neighbour);
  const box=(await target.boundingBox())!;
  await page.mouse.move(box.x+6,box.y+6);
  await page.waitForTimeout(120);
  const first=await target.evaluate(el=>el.getAttribute('style')||'');
  await page.mouse.move(box.x+box.width-6,box.y+20);
  await page.waitForTimeout(120);
  const second=await target.evaluate(el=>el.getAttribute('style')||'');
  expect(first).toContain('--rx');expect(second).toContain('--rx');
  expect(first).not.toBe(second);
  for(const v of [...first.matchAll(/(-?[\d.]+)deg/g),...second.matchAll(/(-?[\d.]+)deg/g)])expect(Math.abs(Number(v[1]))).toBeLessThanOrEqual(8);
  expect(await docBox(neighbour)).toEqual(before);
  await page.screenshot({path:'docs/evidence/ui-depth-hover-1280.png',fullPage:true});
  await page.mouse.move(5,5);
  await page.waitForTimeout(200);
  expect(await target.evaluate(el=>el.getAttribute('style')||'')).not.toContain('--rx');
  expect(await target.evaluate(el=>getComputedStyle(el).transform)).toBe(await neighbour.evaluate(el=>getComputedStyle(el).transform));

  // 三个视口：倾斜 + 选中后仍无横向溢出
  await page.locator('.hand .card').nth(0).click();await page.locator('.hand .card').nth(1).click();await page.locator('.hand .card').nth(2).click();
  for(const vp of [{width:700,height:800},{width:1000,height:700},{width:1280,height:800},{width:1440,height:900}]){
    await page.setViewportSize(vp);
    // 逐张倾斜可视卡牌（右列卡牌决定横向溢出），每张都不得撑出横向滚动
    const boxes=await page.evaluate(()=>[...document.querySelectorAll('.hand .card')].map(n=>{const r=n.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};}).filter(b=>b.y+4<innerHeight-8));
    expect(boxes.length).toBeGreaterThan(0);
    for(const b of boxes){
      await page.mouse.move(b.x+b.w-4,b.y+4);
      await page.waitForTimeout(150);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    // 点数/标签/名称/能力/标注仍完整落在卡牌盒内，未被材质层或 3D 变换挤出或裁切
    expect(await page.locator('.hand .card').evaluateAll(nodes=>nodes.every(n=>{
      const c=n.getBoundingClientRect();
      return [...n.querySelectorAll('.card-top b,.card-top span,strong,.ability,small')].every(p=>{
        const r=p.getBoundingClientRect();
        return r.width>0&&r.height>0&&r.left>=c.left-1&&r.right<=c.right+1&&r.top>=c.top-1&&r.bottom<=c.bottom+1;
      });
    }))).toBe(true);
    if(vp.width===1440){
      const edge=(await page.locator('.hand .card').last().boundingBox())!;
      await page.mouse.move(edge.x+edge.width-4,edge.y+4);await page.waitForTimeout(150);
      await page.screenshot({path:'docs/evidence/ui-depth-hover-1440.png',fullPage:true});
    }
  }
});

test('selection lifts a card, keeps three orders legible and restores the resting state',async({page})=>{
  await page.setViewportSize({width:1280,height:800});
  await startRun(page,'smoke-0');
  const cards=page.locator('.hand .card');
  await page.mouse.move(4,4);await page.waitForTimeout(250);
  const picked:string[]=[];
  for(let i=0;i<3;i++)picked.push((await cards.nth(i).evaluate(el=>(el as HTMLElement).dataset.id))!);
  const rest:Record<string,{z:number;shadow:string}>={};
  for(const id of picked){const s=await cardStyle(page,`.hand [data-id="${id}"]`);rest[id]={z:matrixZ(s.transform),shadow:s.boxShadow};}
  const untouchedBefore=await relBox(cards.nth(4),'.hand');
  for(let i=0;i<3;i++)await cards.nth(i).click();
  await page.mouse.move(5,5);await page.waitForTimeout(250);
  for(let i=0;i<3;i++){
    const s=await cardStyle(page,`.hand [data-id="${picked[i]}"]`);
    expect(matrixZ(s.transform)).toBeGreaterThan(rest[picked[i]].z+10);                  // Z 轴抬升
    expect(s.boxShadow).not.toBe(rest[picked[i]].shadow);                                // 投影更强
    expect(s.boxShadow).toContain('190, 145, 76');                                       // 选中描边环
    const annotation=await page.locator(`.hand [data-id="${picked[i]}"] small`).textContent();
    expect(annotation).toContain(`第${i+1}位`);                                          // 顺序标注仍可辨认
    expect(await page.locator('.slot b').nth(i).textContent()).toBe(await page.locator(`.hand [data-id="${picked[i]}"] strong`).textContent());
  }
  expect(await relBox(cards.nth(4),'.hand')).toEqual(untouchedBefore);                   // 选中不引起手牌区重排
  await page.screenshot({path:'docs/evidence/ui-depth-selected-1280.png',fullPage:true});
  await page.getByRole('button',{name:'清空选择'}).click();
  await page.mouse.move(5,5);await page.waitForTimeout(250);
  for(let i=0;i<3;i++){
    const s=await cardStyle(page,`.hand [data-id="${picked[i]}"]`);
    expect(matrixZ(s.transform)).toBe(rest[picked[i]].z);                                // 取消选择完全复原
    expect(s.boxShadow).toBe(rest[picked[i]].shadow);
  }
});

test('settlement marks only the revealed step and skip is immediately terminal',async({page})=>{
  await page.setViewportSize({width:1280,height:800});
  await startRun(page,'smoke-0');
  await page.evaluate(()=>{(window as unknown as {landings:{id:string;count:number;log:string}[]}).landings=[];
    new MutationObserver(()=>{const nodes=[...document.querySelectorAll('.played .card[data-landing]')];
      if(nodes.length)(window as unknown as {landings:{id:string;count:number;log:string}[]}).landings.push({id:(nodes[0] as HTMLElement).dataset.id!,count:nodes.length,log:document.querySelector('.log p:last-child b')?.textContent||''});})
      .observe(document.body,{childList:true,subtree:true});});
  const cards=page.locator('.hand .card');
  await cards.nth(0).click();await cards.nth(1).click();await cards.nth(2).click();
  await page.getByRole('button',{name:'上拍 · 按此顺序'}).click();
  await page.locator('.played .card[data-landing]').first().waitFor({state:'attached',timeout:5000});
  await page.screenshot({path:'docs/evidence/ui-depth-settlement-1280.png',fullPage:true});
  await page.locator('[data-action="next"]').waitFor({state:'visible',timeout:10000});
  await expect(page.locator('[data-landing]')).toHaveCount(0);                           // 终态不残留动画标记
  expect(await page.locator('.scoreboard strong').textContent()).toContain('=');
  const landings=await page.evaluate(()=>(window as unknown as {landings:{id:string;count:number;log:string}[]}).landings);
  expect(landings.length).toBeGreaterThan(0);
  for(const l of landings){
    expect(l.count).toBe(1);                                                            // 同一时刻只有当前步的卡牌在过渡
    const name=await page.locator(`.played [data-id="${l.id}"] strong`).first().textContent();
    expect(name).toBe(l.log);                                                           // 标记指向当前揭晓步
  }
  const banked=Number((await page.locator('.status strong').first().textContent())!.match(/[\d,]+/)![0].replace(/,/g,''));
  await page.locator('[data-action="next"]').click();
  await cards.nth(0).click();await cards.nth(1).click();await cards.nth(2).click();
  await page.getByRole('button',{name:'上拍 · 按此顺序'}).click();
  await expect(page.locator('[data-landing]')).toHaveCount(0);                           // 新一次结算起始无残留
  const total=await page.evaluate(()=>{const s=document.querySelector('.scoreboard strong')?.textContent||'';return s;});
  await page.getByRole('button',{name:'跳过动画'}).click();
  await page.locator('[data-action="next"]').waitFor({state:'visible',timeout:2000});     // 跳过立即终态
  await expect(page.locator('[data-landing]')).toHaveCount(0);
  expect(await page.locator('.scoreboard strong').textContent()).toContain('=');
  expect(total).toBe('');
  expect(Number((await page.locator('.status strong').first().textContent())!.match(/[\d,]+/)![0].replace(/,/g,''))).toBeGreaterThan(banked);
});

test('reduced motion disables tilt and settlement transition without losing information',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:1280,height:800});
  await startRun(page,'smoke-0');
  const card=page.locator('.hand .card').first();
  const rest=await card.evaluate(el=>getComputedStyle(el).transform);
  const box=(await card.boundingBox())!;
  await page.mouse.move(box.x+box.width-6,box.y+6);
  await page.waitForTimeout(200);
  expect(await card.evaluate(el=>el.getAttribute('style')||'')).not.toContain('--rx');   // 不产生指针倾斜
  expect(await card.evaluate(el=>getComputedStyle(el).transform)).toBe(rest);
  await page.screenshot({path:'docs/evidence/ui-depth-reduced-1280.png',fullPage:true});
  for(const i of [0,1,2])await page.locator('.hand .card').nth(i).click();
  await page.getByRole('button',{name:'上拍 · 按此顺序'}).click();
  await page.locator('[data-action="next"]').waitFor({state:'visible',timeout:2000});     // 直接呈现终态
  await expect(page.locator('[data-landing]')).toHaveCount(0);
  expect(await page.locator('.played .card').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  expect(await page.locator('.played .card').first().evaluate(el=>{const c=el as HTMLElement;return [c.querySelector('.card-top b')?.textContent,c.querySelector('strong')?.textContent,c.querySelector('.ability')?.textContent];})).toEqual([expect.any(String),expect.any(String),expect.any(String)]);
});

test('the depth presentation keeps DOM, keyboard, CSP and resource contracts',async({page})=>{
  const requests:string[]=[];const errors:string[]=[];
  page.on('request',r=>requests.push(r.url()));
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text());});
  await page.setViewportSize({width:1280,height:800});
  await page.goto('/');
  expect(await page.locator('#app [style]').count()).toBe(0);                            // 不使用 HTML 内联 style 属性
  await page.locator('#seed').fill('smoke-0');
  await page.getByRole('button',{name:'开始新夜拍',exact:true}).click();
  await expect(page.locator('.hand .card')).toHaveCount(6);
  await expect(page.locator('.hand')).toHaveCSS('display','grid');
  expect(await page.locator('.hand .card').evaluateAll(nodes=>nodes.every(n=>{const el=n as HTMLElement;return el.tagName==='BUTTON'&&!!el.dataset.action&&!!el.dataset.id&&!!el.dataset.kind&&el.dataset.bonus!==undefined;}))).toBe(true);
  const first=page.locator('.hand .card').first();
  await first.click();
  const name=(await first.locator('strong').textContent())!;
  await expect(page.getByRole('button',{name:`${name}左移`})).toBeVisible();
  await expect(page.getByRole('button',{name:`${name}右移`})).toBeVisible();
  await expect(page.locator('.slot button',{hasText:'移除'})).toBeVisible();
  const hit=await first.evaluate(el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return el===hit||el.contains(hit);});
  expect(hit).toBe(true);                                                               // 变换后点击热区仍与可见卡牌一致
  const hoverBox=(await first.boundingBox())!;
  await page.mouse.move(hoverBox.x+8,hoverBox.y+8);await page.waitForTimeout(120);
  await page.mouse.move(hoverBox.x+hoverBox.width-8,hoverBox.y+8);await page.waitForTimeout(120);
  expect(await first.evaluate(el=>el.getAttribute('style')||'')).toContain('--rx');      // 倾斜经 CSSOM 写入，在当前 CSP 下生效
  expect(errors).toEqual([]);                                                           // 且未产生 CSP 违规或脚本错误
  const tabbed=new Set<string>();
  for(let i=0;i<24;i++){
    await page.keyboard.press('Tab');
    const focused=await page.evaluate(()=>{const a=document.activeElement as HTMLElement|null;if(!a)return null;return {id:a.closest('.hand .card')?.getAttribute('data-id')??null,fv:a.matches(':focus-visible'),outline:getComputedStyle(a).outlineStyle};});
    if(focused?.id){tabbed.add(focused.id);expect(focused.fv).toBe(true);expect(focused.outline).toBe('solid');}
  }
  expect(tabbed.size).toBe(6);                                                          // Tab 可达全部手牌且 focus-visible 可见
  await page.getByRole('button',{name:'清空选择'}).click();
  await page.locator('.hand .card').nth(0).click();await page.locator('.hand .card').nth(1).click();await page.locator('.hand .card').nth(2).click();
  await page.getByRole('button',{name:'上拍 · 按此顺序'}).click();
  await page.getByRole('button',{name:'跳过动画'}).click();
  expect(await page.locator('.played .card').evaluateAll(nodes=>nodes.every(n=>n.getAttribute('tabindex')==='-1'))).toBe(true);
  expect(errors).toEqual([]);
  expect(requests.every(u=>u.startsWith('http://127.0.0.1:4173/'))).toBe(true);           // 无外部网络资源
});

test('coarse pointer without hover keeps the game operable and untilted',async({browser})=>{
  const context=await browser.newContext({hasTouch:true,viewport:{width:1280,height:800}});
  const page=await context.newPage();
  await page.goto('/');
  expect(await page.evaluate(()=>matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(false);
  await page.locator('#seed').fill('smoke-0');
  await page.getByRole('button',{name:'开始新夜拍',exact:true}).click();
  await expect(page.locator('.hand .card')).toHaveCount(6);
  const card=page.locator('.hand .card').first();
  const box=(await card.boundingBox())!;
  await page.mouse.move(box.x+6,box.y+6);await page.waitForTimeout(160);
  const corner=await card.evaluate(el=>getComputedStyle(el).transform);
  await page.mouse.move(box.x+box.width-6,box.y+20);await page.waitForTimeout(160);
  expect(await card.evaluate(el=>el.getAttribute('style')||'')).not.toContain('--rx');  // 无指针倾斜
  expect(await card.evaluate(el=>getComputedStyle(el).transform)).toBe(corner);
  expect(await card.evaluate(el=>getComputedStyle(el,'::before').backgroundImage)).toContain('data:image/svg+xml'); // 静态材质分层仍在
  for(const i of [0,1,2])await page.locator('.hand .card').nth(i).click();
  await expect(page.locator('.slot b')).toHaveCount(3);                                 // 选择可用
  await page.locator('[data-action="right"]').first().click();
  await expect(page.locator('.slot small').first()).toHaveText('01');                    // 排序可用
  await page.getByRole('button',{name:'上拍 · 按此顺序'}).click();
  await page.getByRole('button',{name:'跳过动画'}).click();                              // 跳过可用
  await page.locator('[data-action="next"]').waitFor({state:'visible',timeout:2000});
  await expect(page.locator('[data-landing]')).toHaveCount(0);
  expect(await page.locator('.scoreboard strong').textContent()).toContain('=');
  await context.close();
});

test('collection overlay keeps layered depth readable and hit-testable inside its scroll container',async({page})=>{
  await page.setViewportSize({width:1280,height:800});
  await startRun(page,'smoke-0');
  await page.getByRole('button',{name:/^收藏/}).click();
  const modal=page.locator('.modal');
  await expect(modal).toBeVisible();
  const cards=modal.locator('.compact .card');
  expect(await cards.count()).toBeGreaterThan(3);
  const card=await cardStyle(page,'.modal .compact .card');
  expect(card.transformStyle).toBe('preserve-3d');                                      // 弹层内卡牌保留 3D 分层
  expect(matrixM34(card.transform)).not.toBe(0);
  const face=await cardStyle(page,'.modal .compact .card','::before');
  expect(matrixZ(face.transform)).toBeLessThan(0);
  expect(face.backgroundImage).toContain('data:image/svg+xml');                          // 弹层内卡牌保留材质层
  // 相邻卡牌之间的网格间隙不属于任何卡牌：取样点在投影板纵向覆盖范围内（卡高中部），
  // 若投影板横向越界且参与命中测试，该点会返回卡牌本身（伪元素命中测试返回宿主元素）
  expect(await cards.first().evaluate(el=>{const a=el.getBoundingClientRect(),n=el.nextElementSibling!.getBoundingClientRect();const y=a.top+a.height*.6;const hit=document.elementFromPoint((a.right+n.left)/2,y);return hit===el||hit===el.nextElementSibling||el.contains(hit)||el.nextElementSibling!.contains(hit);})).toBe(false);
  // 相邻卡牌自身中心仍命中该卡牌（投影板未夺取他人热区）
  expect(await cards.nth(1).evaluate(el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height*.6);return el===hit||el.contains(hit);})).toBe(true);
  // 投影板几何：横向完全落在卡牌盒内（不侵入网格间隙，故不会遮挡相邻卡牌热区）；
  // 纵向按设计外扩，量级必须小于弹层内边距，否则会被 overflow:auto 裁切
  const geom=await modal.evaluate(m=>{
    const mp=m.getBoundingClientRect(),ms=getComputedStyle(m);
    const border=parseFloat(ms.borderBottomWidth),pad=parseFloat(ms.paddingTop);
    return {clipBottom:mp.bottom-border,pad,
      rows:[...m.querySelectorAll('.compact .card')].map(el=>{
        const r=el.getBoundingClientRect(),a=getComputedStyle(el,'::after');
        const v=a.inset.split(/\s+/).map(parseFloat);const [t,rl,b]=v.length===3?v:[v[0],v[1],v[2]];
        return {left:r.left,right:r.right,bottom:r.bottom,top:r.top,pe:a.pointerEvents,insetTop:t,insetX:rl,insetBottom:b};})};
  });
  expect(geom.pad).toBeGreaterThan(0);
  for(const r of geom.rows){
    expect(r.pe).toBe('none');                                                          // 投影板不参与命中测试
    expect(r.insetX).toBeGreaterThan(0);                                                // 左右沿都在卡牌盒内
    expect(r.insetTop).toBeGreaterThan(0);                                              // 上沿在卡牌盒内
    expect(r.insetBottom).toBeLessThan(0);                                              // 下沿按设计外扩（可见的地面投影）
    expect(-r.insetBottom).toBeLessThan(geom.pad);                                      // 外扩量小于弹层内边距 → 不被滚动容器裁切
  }
  // 外扩后的投影板下沿仍高于弹层裁切边（取所有卡牌中最靠下的一张）
  const lowest=geom.rows.reduce((a,b)=>a.bottom>b.bottom?a:b);
  expect(lowest.bottom-lowest.insetBottom).toBeLessThan(geom.clipBottom);
  // 命中区与可见卡牌一致
  expect(await cards.first().evaluate(el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return el===hit||el.contains(hit);})).toBe(true);
  // 弹层容器 overflow:auto 不裁切卡面文本：每张卡的文本完整落在卡牌盒内
  const contained=async()=>cards.evaluateAll(nodes=>nodes.every(n=>{
    const c=n.getBoundingClientRect();
    return [...n.querySelectorAll('.card-top b,.card-top span,strong,.ability,small')].every(p=>{
      const r=p.getBoundingClientRect();
      return r.width>0&&r.height>0&&r.left>=c.left-1&&r.right<=c.right+1&&r.top>=c.top-1&&r.bottom<=c.bottom+1;
    });
  }));
  expect(await contained()).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'docs/evidence/ui-depth-collection-1280.png'});
  // 缩短视口使弹层真正产生滚动，滚动到底后回归文本可读与命中
  await page.setViewportSize({width:1280,height:560});
  const scroll=await modal.evaluate(m=>({scrollH:m.scrollHeight,clientH:m.clientHeight,scrollW:m.scrollWidth,clientW:m.clientWidth}));
  expect(scroll.scrollH).toBeGreaterThan(scroll.clientH);                               // 弹层确实可滚动
  expect(scroll.scrollW).toBeLessThanOrEqual(scroll.clientW);                           // 弹层无横向溢出
  await modal.evaluate(m=>{m.scrollTop=m.scrollHeight;});
  await page.waitForTimeout(80);
  expect(await contained()).toBe(true);                                                 // 滚动到底后文本仍完整
  const last=cards.last();
  expect(await last.evaluate(el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return el===hit||el.contains(hit);})).toBe(true);
  const lastGeom=await last.evaluate(el=>{const r=el.getBoundingClientRect(),a=getComputedStyle(el,'::after');const v=a.inset.split(/\s+/).map(parseFloat);const b=v[2];const m=el.closest('.modal')!.getBoundingClientRect();const border=parseFloat(getComputedStyle(el.closest('.modal')!).borderBottomWidth);return {cardBottom:r.bottom,shadowBottom:r.bottom-b,clipBottom:m.bottom-border};});
  expect(lastGeom.cardBottom).toBeLessThanOrEqual(lastGeom.clipBottom);                 // 滚动到底后末张卡牌完整落在弹层可视区内
  expect(lastGeom.shadowBottom).toBeLessThan(lastGeom.clipBottom);                      // 且投影板下沿未被裁切（与几何循环同源的交叉校验）
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  await expect(modal).toBeHidden();
});
