// 独立验证用例（AI-自动化测试节点）：UI 质感提升与卡牌 3D 纵深
// 对应测试方案：openspec/changes/optimize-playtest-card-depth/test/卡牌3D纵深与界面质感-test-plan.md
// 运行：npx playwright test openspec/changes/optimize-playtest-card-depth/test/browser --config=openspec/changes/optimize-playtest-card-depth/test/browser/playwright.depth.config.ts
import {readFileSync} from 'node:fs';
import {test, expect, type Page, type Locator} from '@playwright/test';
import {newTrigger, TRIGGER_SAVE_KEY, type TriggerCard} from '../../../../../packages/core/src/trigger';
import {orderedChoices} from '../../../../../tools/ai-play-lib';

const CSS_PATH = 'apps/playtest/public/trigger.css';
const SHOTS = 'openspec/changes/optimize-playtest-card-depth/test/reports/shots';
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;

/* ---------- 静态样式工具（TC-013 / TC-014） ---------- */
const cssText = () => readFileSync(CSS_PATH, 'utf8');
function rootSplit(text: string) {
  const start = text.indexOf(':root{');
  const end = text.indexOf('}', start);
  return {root: text.slice(start, end + 1), outside: text.slice(0, start) + text.slice(end + 1)};
}
/* ---------- 计算样式工具 ---------- */
function matrixOf(transform: string): number[] | null {
  const m = transform.match(/matrix3d\(([^)]+)\)/);
  return m ? m[1].split(',').map(Number) : null;
}
const zOf = (transform: string) => {const v = matrixOf(transform); return v ? v[14] : 0;};          // m43：Z 轴平移
const perspOf = (transform: string) => {const v = matrixOf(transform); return v ? v[11] : 0;};      // m34：透视
const shadowLayers = (value: string) => value.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);
function layerDy(layer: string) {const m = layer.match(/(-?[\d.]+)px\s+(-?[\d.]+)px/); return m ? Number(m[2]) : 0;}
const styleAttr = (loc: Locator) => loc.evaluate((el) => el.getAttribute('style') || '');
const angles = (text: string) => [...text.matchAll(/(-?[\d.]+)deg/g)].map((m) => Number(m[1]));
function tiltVar(style: string, name: string) {
  const m = style.match(new RegExp(name + ':\\s*(-?[\\d.]+)deg'));
  return m ? Number(m[1]) : NaN;
}
async function rectOf(loc: Locator) {
  return loc.evaluate((el) => {const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height];});
}
/** 相对容器的矩形：用于“相邻卡牌不重排”断言，排除页面滚动带来的绝对位移 */
async function relRect(loc: Locator, container: string) {
  return loc.evaluate((el, sel) => {
    const r = el.getBoundingClientRect(), c = (el.closest(sel) as HTMLElement).getBoundingClientRect();
    return [Math.round((r.left - c.left) * 100) / 100, Math.round((r.top - c.top) * 100) / 100, Math.round(r.width * 100) / 100, Math.round(r.height * 100) / 100];
  }, container);
}
async function computedPseudo(loc: Locator, pseudo: '::before' | '::after') {
  return loc.evaluate((el, p) => {
    const s = getComputedStyle(el, p);
    return {transform: s.transform, backgroundImage: s.backgroundImage, pointerEvents: s.pointerEvents, inset: s.inset};
  }, pseudo);
}
const TEXT_PARTS = '.card-top b,.card-top span,strong,.ability,small';
async function textsContained(loc: Locator) {
  return loc.evaluateAll((nodes, parts) => nodes.every((n) => {
    const c = n.getBoundingClientRect();
    return [...n.querySelectorAll(parts)].every((p) => {
      const r = p.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 1 && r.bottom <= c.bottom + 1;
    });
  }), TEXT_PARTS);
}

/* ---------- 游戏流程工具 ---------- */
async function startRun(page: Page, seed: string) {
  await page.goto('/');
  await page.locator('#seed').fill(seed);
  await page.getByRole('button', {name: '开始新夜拍', exact: true}).click();
  await expect(page.locator('.hand .card')).toHaveCount(6);
}
async function restPointer(page: Page) {await page.mouse.move(3, 3); await page.waitForTimeout(260);}
async function hoverCard(page: Page, loc: Locator, dx = 0.5, dy = 0.5) {
  await loc.evaluate((el) => el.scrollIntoView({block: 'center'}));
  await page.waitForTimeout(80);
  const box = (await loc.boundingBox())!;
  await page.mouse.move(box.x + box.width * dx, box.y + box.height * dy);
}
async function handCards(page: Page) {
  return page.locator('.hand .card').evaluateAll((nodes) => nodes.map((n) => {
    const el = n as HTMLElement;
    return {id: el.dataset.id!, kind: el.dataset.kind!, bonus: Number(el.dataset.bonus)};
  }));
}
async function bestIds(page: Page) {
  const cards = await handCards(page);
  const s = newTrigger('depth-verify');
  s.deck = cards as TriggerCard[];
  s.hand = cards.map((c) => c.id);
  s.draw = [];
  s.discard = [];
  return orderedChoices(s)[0].ids;
}
async function playRound(page: Page) {
  const ids = await bestIds(page);
  for (const id of ids) await page.locator(`.hand [data-id="${id}"]`).click();
  await page.getByRole('button', {name: '上拍 · 按此顺序'}).click();
  const skip = page.getByRole('button', {name: '跳过动画'});
  if (await skip.count()) await skip.click();
  await page.locator('[data-action="next"]').waitFor({state: 'visible', timeout: 20000});
  await page.locator('[data-action="next"]').click();
}
async function advanceTo(page: Page, target: string, maxSteps = 14) {
  for (let i = 0; i < maxSteps; i++) {
    if (await page.locator(target).count()) return;
    if (await page.locator('.ending').count()) throw new Error(`run ended before reaching ${target}`);
    if (await page.locator('.hand .card').count()) {await playRound(page); continue;}
    if (await page.locator('[data-action="take"]').count()) {await page.locator('[data-action="take"]').first().click(); continue;}
    if (await page.locator('[data-action="upgrade"]').count()) {await page.locator('[data-action="upgrade"]').first().click(); continue;}
    throw new Error(`unknown phase while waiting for ${target}`);
  }
  throw new Error(`did not reach ${target}`);
}
async function bankedScore(page: Page) {
  const text = (await page.locator('.status strong').first().textContent()) || '';
  const m = text.match(/[\d,]+/);
  return m ? Number(m[0].replace(/,/g, '')) : NaN;
}
async function hammerTotal(page: Page) {
  const text = (await page.locator('.scoreboard strong').textContent()) || '';
  const m = text.match(/[\d,]+/);
  return m ? Number(m[0].replace(/,/g, '')) : NaN;
}

/* ==================== TC-001 / TC-002 ==================== */
test('TC-001 卡牌材质分层与 CSS 3D 纵深声明（1280x800）', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  await startRun(page, 'smoke-0');
  const card = page.locator('.hand .card').first();
  const cs = await card.evaluate((el) => {
    const s = getComputedStyle(el);
    return {transformStyle: s.transformStyle, perspective: s.perspective, transform: s.transform, backgroundImage: s.backgroundImage, boxShadow: s.boxShadow};
  });
  expect(cs.transformStyle).toBe('preserve-3d');                                  // NNA-001
  expect(cs.perspective).toBe('900px');
  expect(perspOf(cs.transform)).not.toBe(0);
  expect(cs.backgroundImage).toBe('none');
  const face = await computedPseudo(card, '::before');
  const plane = await computedPseudo(card, '::after');
  expect(face.backgroundImage).toContain('data:image/svg+xml');
  expect(zOf(plane.transform)).toBeLessThan(zOf(face.transform));                  // 投影板与卡面分离
  expect(zOf(face.transform)).toBeLessThan(0);                                     // 材质层在文本之后
  expect(plane.pointerEvents).toBe('none');
  expect(shadowLayers(cs.boxShadow).filter((l) => layerDy(l) > 0).length).toBeGreaterThanOrEqual(2); // 统一光源分层投影
  expect(await card.locator('small').evaluate((el) => getComputedStyle(el).fontSize)).toBe('10px');
  await page.screenshot({path: `${SHOTS}/tc001-card-1280.png`, fullPage: true});
});

test('TC-002 三变体在非色相维度可区分', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  await startRun(page, 'smoke-0');
  await page.getByRole('button', {name: /^收藏/}).click();
  await expect(page.locator('.modal')).toBeVisible();
  const v = await page.evaluate(() => {
    const dump = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      const f = getComputedStyle(el, '::before');
      return {border: s.borderWidth, texture: f.backgroundImage.split(',')[0], shadow: s.boxShadow.replace(/rgba?\([^)]*\)/g, '').trim()};
    };
    return {haunted: dump('.modal .compact .card.haunted'), tool: dump('.modal .compact .card.tool'), plain: dump('.modal .compact .card:not(.haunted):not(.tool)')};
  });
  expect(v.haunted && v.tool && v.plain).toBeTruthy();
  const sig = (x: any) => [x.border, x.texture, x.shadow].join('|');
  expect(new Set([sig(v.haunted), sig(v.tool), sig(v.plain)]).size).toBe(3);
  await page.getByRole('button', {name: '关闭', exact: true}).click();
  await expect(page.locator('.modal')).toBeHidden();
});

/* ==================== TC-003 / TC-004 ==================== */
test('TC-003/TC-004 悬停倾斜跟随指针、角度有界、移出≤200ms复原且不重排相邻卡牌', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  await startRun(page, 'smoke-0');
  await restPointer(page);
  const target = page.locator('.hand .card').nth(1);
  const neighbour = page.locator('.hand .card').nth(4);
  const restTransform = await target.evaluate((el) => getComputedStyle(el).transform);
  const neighbourBefore = await relRect(neighbour, '.hand');
  await hoverCard(page, target, 0.03, 0.03);
  await page.waitForTimeout(150);
  const topLeft = await styleAttr(target);
  await hoverCard(page, target, 0.97, 0.1);
  await page.waitForTimeout(150);
  const topRight = await styleAttr(target);
  expect(topLeft).toContain('--rx');                                              // NNA-002
  expect(topRight).toContain('--rx');
  expect(topLeft).not.toBe(topRight);
  for (const a of [...angles(topLeft), ...angles(topRight)]) expect(Math.abs(a)).toBeLessThanOrEqual(8);
  expect(tiltVar(topLeft, '--ry')).toBeLessThan(0);                               // 指针偏左 → --ry 为负
  expect(tiltVar(topLeft, '--rx')).toBeGreaterThan(0);                            // 指针偏上 → --rx 为正
  expect(tiltVar(topRight, '--ry')).toBeGreaterThan(0);
  // 倾斜必须真实影响渲染：两个指针位置的计算 transform 必须不同，且都不等于静止态
  const renderedLeft = await target.evaluate((el) => getComputedStyle(el).transform);
  await hoverCard(page, target, 0.97, 0.1);
  await page.waitForTimeout(150);
  const renderedRight = await target.evaluate((el) => getComputedStyle(el).transform);
  expect(renderedLeft).not.toBe(renderedRight);
  expect(renderedLeft).not.toBe(restTransform);
  expect(await relRect(neighbour, '.hand')).toEqual(neighbourBefore);              // 倾斜不重排相邻卡牌
  await page.screenshot({path: `${SHOTS}/tc003-hover-1280.png`, fullPage: true});
  await restPointer(page);                                                        // 260ms > 200ms 上界
  expect(await styleAttr(target)).not.toContain('--rx');
  expect(await target.evaluate((el) => getComputedStyle(el).transform)).toBe(restTransform);   // NNA-003
  expect(await relRect(neighbour, '.hand')).toEqual(neighbourBefore);
});

/* ==================== TC-005 ==================== */
test('TC-005 视口矩阵下倾斜无横向溢出且卡牌文本不被遮挡', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  await startRun(page, 'smoke-0');
  for (const i of [0, 1, 2]) await page.locator('.hand .card').nth(i).click();
  for (const vp of [{width: 1000, height: 700}, {width: 1280, height: 800}, {width: 1440, height: 900}]) {
    await page.setViewportSize(vp);
    await page.locator('.hand').evaluate((el) => el.scrollIntoView({block: 'center'}));
    await page.waitForTimeout(120);
    const boxes = await page.evaluate(() => [...document.querySelectorAll('.hand .card')]
      .map((n) => {const r = n.getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height};})
      .filter((b) => b.y + 6 < innerHeight && b.x + b.w > 0));
    expect(boxes.length).toBeGreaterThan(0);
    for (const b of boxes) {
      await page.mouse.move(b.x + b.w - 5, b.y + 6);                              // 右列卡牌决定横向溢出
      await page.waitForTimeout(160);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await textsContained(page.locator('.hand .card'))).toBe(true);
    }
    if (vp.width === 1280 || vp.width === 1440) {
      const last = boxes[boxes.length - 1];
      await page.mouse.move(last.x + last.w - 5, last.y + 6);
      await page.waitForTimeout(160);
      await page.screenshot({path: `${SHOTS}/tc005-hover-${vp.width}.png`, fullPage: true});
    }
    await restPointer(page);
  }
});

/* ==================== TC-006 ==================== */
test('TC-006 选中 Z 轴抬升、三张顺序可辨、取消后完全复原', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  await startRun(page, 'smoke-0');
  const cards = page.locator('.hand .card');
  await restPointer(page);
  const picked: string[] = [];
  for (let i = 0; i < 3; i++) picked.push(await cards.nth(i).evaluate((el) => (el as HTMLElement).dataset.id!));
  const rest: Record<string, {z: number; shadow: string}> = {};
  for (const id of picked) {
    const s = await page.locator(`.hand [data-id="${id}"]`).evaluate((el) => {const c = getComputedStyle(el); return {z: 0, shadow: c.boxShadow, transform: c.transform};});
    rest[id] = {z: zOf(s.transform), shadow: s.shadow};
  }
  const untouchedBefore = await relRect(cards.nth(4), '.hand');
  for (let i = 0; i < 3; i++) await cards.nth(i).click();
  await restPointer(page);
  for (let i = 0; i < 3; i++) {
    const loc = page.locator(`.hand [data-id="${picked[i]}"]`);
    const s = await loc.evaluate((el) => {const c = getComputedStyle(el); return {transform: c.transform, shadow: c.boxShadow};});
    expect(zOf(s.transform)).toBeGreaterThan(rest[picked[i]].z + 10);              // NNA-004
    expect(s.shadow).not.toBe(rest[picked[i]].shadow);
    expect(s.shadow).toContain('190, 145, 76');                                    // 选中描边环（--auction-select-ring）
    expect(await loc.locator('small').textContent()).toContain(`第${i + 1}位`);
    expect(await page.locator('.slot b').nth(i).textContent()).toBe(await loc.locator('strong').textContent());
  }
  expect(await relRect(cards.nth(4), '.hand')).toEqual(untouchedBefore);
  // 悬停已选卡牌不得降低抬升高度
  const lifted = await page.locator(`.hand [data-id="${picked[0]}"]`).evaluate((el) => {
    const m = getComputedStyle(el).transform.match(/matrix3d\(([^)]+)\)/);
    return m ? Number(m[1].split(',')[14]) : 0;
  });
  await hoverCard(page, page.locator(`.hand [data-id="${picked[0]}"]`));
  await page.waitForTimeout(150);
  expect(await page.locator(`.hand [data-id="${picked[0]}"]`).evaluate((el) => {
    const m = getComputedStyle(el).transform.match(/matrix3d\(([^)]+)\)/);
    return m ? Number(m[1].split(',')[14]) : 0;
  })).toBe(lifted);
  await page.screenshot({path: `${SHOTS}/tc006-selected-1280.png`, fullPage: true});
  await restPointer(page);
  await page.getByRole('button', {name: '清空选择'}).click();
  await restPointer(page);
  for (let i = 0; i < 3; i++) {
    const s = await page.locator(`.hand [data-id="${picked[i]}"]`).evaluate((el) => {const c = getComputedStyle(el); return {transform: c.transform, shadow: c.boxShadow};});
    expect(zOf(s.transform)).toBe(rest[picked[i]].z);
    expect(s.shadow).toBe(rest[picked[i]].shadow);
  }
});

/* ==================== TC-007 / TC-008 ==================== */
test('TC-007/TC-008 落槌过渡只作用于当前揭晓步、跳过立即终态、重复与连续两轮无残留', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  await startRun(page, 'smoke-0');
  await page.evaluate(() => {
    const w = window as any;
    w.__landings = [];
    new MutationObserver(() => {
      const nodes = [...document.querySelectorAll('.played .card[data-landing]')] as HTMLElement[];
      if (nodes.length) w.__landings.push({
        id: nodes[0].dataset.id, count: nodes.length,
        log: document.querySelector('.log p:last-child b')?.textContent || '',
        cls: nodes[0].className, inline: nodes[0].getAttribute('style') || '',
      });
    }).observe(document.body, {childList: true, subtree: true});
  });
  const cards = page.locator('.hand .card');
  for (const i of [0, 1, 2]) await cards.nth(i).click();
  await page.getByRole('button', {name: '上拍 · 按此顺序'}).click();
  await page.locator('.played .card[data-landing]').first().waitFor({state: 'attached', timeout: 10000});
  await page.screenshot({path: `${SHOTS}/tc007-settlement-1280.png`, fullPage: true});
  await page.locator('[data-action="next"]').waitFor({state: 'visible', timeout: 20000});
  await expect(page.locator('[data-landing]')).toHaveCount(0);                     // 终态无残留
  expect(await page.locator('.scoreboard strong').textContent()).toContain('=');
  const landings = await page.evaluate(() => (window as any).__landings);
  expect(landings.length).toBeGreaterThan(0);
  for (const l of landings) {
    expect(l.count).toBe(1);                                                      // NNA-005：同一时刻只有当前步
    expect(await page.locator(`.played [data-id="${l.id}"] strong`).first().textContent()).toBe(l.log);
    expect(l.cls).not.toContain('tilting');
    expect(l.inline).not.toContain('--rx');
  }
  const banked1 = await bankedScore(page);
  const total1 = await hammerTotal(page);
  await page.locator('[data-action="next"]').click();
  // 连续两轮：新一次结算起始无残留标记
  await expect(cards.first()).toBeVisible();
  for (const i of [0, 1, 2]) await cards.nth(i).click();
  await page.getByRole('button', {name: '上拍 · 按此顺序'}).click();
  expect(await page.locator('[data-landing]').count()).toBe(0);
  await page.getByRole('button', {name: '跳过动画'}).click();
  await page.locator('[data-action="next"]').waitFor({state: 'visible', timeout: 3000});   // NNA-006：跳过立即终态
  await expect(page.locator('[data-landing]')).toHaveCount(0);
  expect(await page.locator('.scoreboard strong').textContent()).toContain('=');
  const banked2 = await bankedScore(page);
  const total2 = await hammerTotal(page);
  expect(banked2).toBeGreaterThan(banked1);
  expect(banked2 - banked1).toBe(total2);                                         // 入账与结算结果一致（不重复入账）
  // 重复触发“跳过动画”：对已卸载按钮再次触发不得重复入账
  await page.locator('[data-action="next"]').click();
  for (const i of [0, 1, 2]) await cards.nth(i).click();
  await page.getByRole('button', {name: '上拍 · 按此顺序'}).click();
  await page.evaluate(() => {
    const b = document.querySelector('[data-action="skip"]') as HTMLElement | null;
    if (b) {b.click(); b.click();}
  });
  await page.locator('[data-action="next"]').waitFor({state: 'visible', timeout: 3000});
  await expect(page.locator('[data-landing]')).toHaveCount(0);
  const banked3 = await bankedScore(page);
  const total3 = await hammerTotal(page);
  expect(banked3 - banked2).toBe(total3);
  // 状态恢复：结算终态刷新 → 继续上次收藏 → 直接终态、无动画残留、入账不变
  await page.reload();
  await page.getByRole('button', {name: '继续上次收藏'}).click();
  await expect(page.locator('[data-landing]')).toHaveCount(0);
  expect(await page.locator('.scoreboard strong').textContent()).toContain('=');
  expect(await bankedScore(page)).toBe(banked3);
  expect(await hammerTotal(page)).toBe(total3);
});

/* ==================== TC-009 ==================== */
test('TC-009 prefers-reduced-motion 降级：无倾斜、无过渡、信息完整', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await startRun(page, 'smoke-0');
  const card = page.locator('.hand .card').first();
  const rest = await card.evaluate((el) => getComputedStyle(el).transform);
  await hoverCard(page, card, 0.97, 0.05);
  await page.waitForTimeout(220);
  expect(await styleAttr(card)).not.toContain('--rx');                            // NNA-007
  expect(await card.evaluate((el) => getComputedStyle(el).transform)).toBe(rest);
  for (const i of [0, 1, 2]) await page.locator('.hand .card').nth(i).click();
  await page.getByRole('button', {name: '上拍 · 按此顺序'}).click();
  await page.locator('[data-action="next"]').waitFor({state: 'visible', timeout: 3000});   // 直接终态
  await expect(page.locator('[data-landing]')).toHaveCount(0);
  expect(await page.locator('.played .card').first().evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  const texts = await page.locator('.played .card').first().evaluate((el) => [
    el.querySelector('.card-top b')?.textContent, el.querySelector('strong')?.textContent, el.querySelector('.ability')?.textContent,
  ]);
  expect(texts[0]).toBeTruthy();
  expect(texts[1]).toBeTruthy();
  expect(texts[2]).toBeTruthy();
  await page.screenshot({path: `${SHOTS}/tc009-reduced-1280.png`, fullPage: true});
});

/* ==================== TC-010 ==================== */
test('TC-010 键盘可达、aria-label 不变、倾斜下命中与点击不误触', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  await startRun(page, 'smoke-0');
  const tabbed = new Set<string>();
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const a = document.activeElement as HTMLElement | null;
      if (!a) return null;
      const c = a.closest?.('.hand .card') as HTMLElement | null;
      return {id: c ? c.dataset.id : null, fv: a.matches(':focus-visible'), outline: getComputedStyle(a).outlineStyle};
    });
    if (f && f.id) {tabbed.add(f.id); expect(f.fv).toBe(true); expect(f.outline).toBe('solid');}
  }
  expect(tabbed.size).toBe(6);                                                    // NNA-008
  await page.locator('.hand .card').first().click();
  const name = await page.locator('.hand .card').first().locator('strong').textContent();
  await expect(page.getByRole('button', {name: `${name}左移`})).toBeVisible();
  await expect(page.getByRole('button', {name: `${name}右移`})).toBeVisible();
  await expect(page.locator('.slot button', {hasText: '移除'}).first()).toBeVisible();
  await page.getByRole('button', {name: '清空选择'}).click();
  const target = page.locator('.hand .card').nth(1);
  const targetId = await target.evaluate((el) => (el as HTMLElement).dataset.id!);
  await hoverCard(page, target);
  await page.waitForTimeout(150);
  expect(await styleAttr(target)).toContain('--rx');                              // 倾斜已生效
  const probe = await target.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width * 0.8, y = r.top + r.height * 0.5;
    const hit = document.elementFromPoint(x, y);
    return {x, y, hitSelf: !!hit && (hit === el || el.contains(hit))};
  });
  expect(probe.hitSelf).toBe(true);                                              // 变换后热区与可见卡牌一致
  await page.mouse.click(probe.x, probe.y);
  expect(await page.locator(`.hand [data-id="${targetId}"] small`).textContent()).toContain('第1位');
  expect(await page.locator('.slot b').first().textContent()).toBe(await page.locator(`.hand [data-id="${targetId}"] strong`).textContent());
});

/* ==================== TC-011 ==================== */
test('TC-011 粗指针/无 hover 降级仍可完整操作', async ({browser}) => {
  const context = await browser.newContext({hasTouch: true, viewport: {width: 1280, height: 800}});
  const page = await context.newPage();
  await page.goto('/');
  expect(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(false);
  await page.locator('#seed').fill('smoke-0');
  await page.getByRole('button', {name: '开始新夜拍', exact: true}).click();
  await expect(page.locator('.hand .card')).toHaveCount(6);
  const card = page.locator('.hand .card').first();
  await card.evaluate((el) => el.scrollIntoView({block: 'center'}));
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + 6, box.y + 6);
  await page.waitForTimeout(160);
  const a = await card.evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.move(box.x + box.width - 6, box.y + 20);
  await page.waitForTimeout(160);
  expect(await styleAttr(card)).not.toContain('--rx');
  expect(await card.evaluate((el) => getComputedStyle(el).transform)).toBe(a);
  expect((await computedPseudo(card, '::before')).backgroundImage).toContain('data:image/svg+xml');
  for (const i of [0, 1, 2]) await page.locator('.hand .card').nth(i).click();
  await expect(page.locator('.slot b')).toHaveCount(3);
  await page.locator('[data-action="right"]').first().click();
  await expect(page.locator('.slot small').first()).toHaveText('01');
  await page.getByRole('button', {name: '上拍 · 按此顺序'}).click();
  await page.getByRole('button', {name: '跳过动画'}).click();
  await page.locator('[data-action="next"]').waitFor({state: 'visible', timeout: 3000});
  await expect(page.locator('[data-landing]')).toHaveCount(0);
  expect(await page.locator('.scoreboard strong').textContent()).toContain('=');
  await context.close();
});

/* ==================== TC-012 ==================== */
test('TC-012 收藏弹层/战后选牌/升级选牌的材质、3D 与命中（含滚动容器）', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  await startRun(page, 'smoke-0');
  await page.getByRole('button', {name: /^收藏/}).click();
  const modal = page.locator('.modal');
  await expect(modal).toBeVisible();
  const cards = modal.locator('.compact .card');
  expect(await cards.count()).toBeGreaterThan(3);
  const first = cards.first();
  const cs = await first.evaluate((el) => {const s = getComputedStyle(el); return {transformStyle: s.transformStyle, transform: s.transform};});
  expect(cs.transformStyle).toBe('preserve-3d');
  expect(perspOf(cs.transform)).not.toBe(0);
  const face = await computedPseudo(first, '::before');
  const plane = await computedPseudo(first, '::after');
  expect(zOf(face.transform)).toBeLessThan(0);
  expect(zOf(plane.transform)).toBeLessThan(zOf(face.transform));
  expect(face.backgroundImage).toContain('data:image/svg+xml');
  expect(plane.pointerEvents).toBe('none');
  // 网格间隙不属于任何卡牌；相邻卡牌中心仍命中自身
  expect(await first.evaluate((el) => {
    const sibling = el.nextElementSibling as HTMLElement;
    const a = el.getBoundingClientRect(), n = sibling.getBoundingClientRect();
    const hit = document.elementFromPoint((a.right + n.left) / 2, a.top + a.height * 0.6);
    return hit === el || el.contains(hit) || n === hit || sibling.contains(hit);
  })).toBe(false);
  expect(await cards.nth(1).evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height * 0.6);
    return el === hit || el.contains(hit);
  })).toBe(true);
  // 投影板几何：横向在卡牌盒内、纵向外扩小于弹层内边距
  const geom = await modal.evaluate((m) => {
    const mp = m.getBoundingClientRect(), ms = getComputedStyle(m);
    const border = parseFloat(ms.borderBottomWidth), pad = parseFloat(ms.paddingTop);
    return {clipBottom: mp.bottom - border, pad, rows: [...m.querySelectorAll('.compact .card')].map((el) => {
      const r = el.getBoundingClientRect(), a = getComputedStyle(el, '::after');
      const v = a.inset.split(/\s+/).map(parseFloat);
      return {bottom: r.bottom, insetTop: v[0], insetX: v[1], insetBottom: v[2]};
    })};
  });
  expect(geom.pad).toBeGreaterThan(0);
  for (const r of geom.rows) {
    expect(r.insetX).toBeGreaterThan(0);
    expect(r.insetTop).toBeGreaterThan(0);
    expect(r.insetBottom).toBeLessThan(0);
    expect(-r.insetBottom).toBeLessThan(geom.pad);
  }
  const lowest = geom.rows.reduce((a, b) => (a.bottom > b.bottom ? a : b));
  expect(lowest.bottom - lowest.insetBottom).toBeLessThan(geom.clipBottom);
  expect(await textsContained(cards)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path: `${SHOTS}/tc012-collection-1280.png`});
  // 缩短视口使弹层真正滚动
  await page.setViewportSize({width: 1280, height: 560});
  const sc = await modal.evaluate((m) => ({h: m.scrollHeight, ch: m.clientHeight, w: m.scrollWidth, cw: m.clientWidth}));
  expect(sc.h).toBeGreaterThan(sc.ch);
  expect(sc.w).toBeLessThanOrEqual(sc.cw);
  await modal.evaluate((m) => {m.scrollTop = m.scrollHeight;});
  await page.waitForTimeout(80);
  expect(await textsContained(cards)).toBe(true);
  const lastGeom = await cards.last().evaluate((el) => {
    const r = el.getBoundingClientRect(), a = getComputedStyle(el, '::after');
    const b = parseFloat(a.inset.split(/\s+/)[2]);
    const m = (el.closest('.modal') as HTMLElement).getBoundingClientRect();
    const border = parseFloat(getComputedStyle(el.closest('.modal') as HTMLElement).borderBottomWidth);
    return {cardBottom: r.bottom, shadowBottom: r.bottom - b, clipBottom: m.bottom - border};
  });
  expect(lastGeom.cardBottom).toBeLessThanOrEqual(lastGeom.clipBottom);
  expect(lastGeom.shadowBottom).toBeLessThan(lastGeom.clipBottom);
  await page.setViewportSize({width: 1280, height: 800});
  await page.getByRole('button', {name: '关闭', exact: true}).click();
  // 战后选牌
  await advanceTo(page, '.rewards');
  const rewards = page.locator('.rewards .card');
  await expect(rewards).toHaveCount(3);
  const r0 = await rewards.first().evaluate((el) => {const s = getComputedStyle(el); return {transformStyle: s.transformStyle, transform: s.transform};});
  expect(r0.transformStyle).toBe('preserve-3d');
  expect(perspOf(r0.transform)).not.toBe(0);
  expect(zOf((await computedPseudo(rewards.first(), '::before')).transform)).toBeLessThan(0);
  await hoverCard(page, rewards.first(), 0.97, 0.05);
  await page.waitForTimeout(160);
  expect(await styleAttr(rewards.first())).toContain('--rx');                     // 战后选牌可倾斜
  await page.screenshot({path: `${SHOTS}/tc012-rewards-1280.png`, fullPage: true});
  await rewards.first().click();
  // 升级选牌（.cards.compact）
  const upgrade = page.locator('[data-action="upgrade"]').first();
  await expect(upgrade).toBeVisible();
  const u0 = await upgrade.evaluate((el) => {const s = getComputedStyle(el); return {transformStyle: s.transformStyle, transform: s.transform};});
  expect(u0.transformStyle).toBe('preserve-3d');
  expect(perspOf(u0.transform)).not.toBe(0);
  expect((await computedPseudo(upgrade, '::before')).backgroundImage).toContain('data:image/svg+xml');
  await page.screenshot({path: `${SHOTS}/tc012-upgrade-1280.png`, fullPage: true});
});

/* ==================== TC-013 ==================== */
test('TC-013 首页示例牌与结算牌区静态分层、状态/日志区令牌化、:root 外零颜色字面量', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  const text = cssText();
  const {outside} = rootSplit(text);
  expect(outside.match(COLOR_LITERAL)).toEqual(null);                             // 令牌层是唯一来源
  await page.goto('/');
  const home = page.locator('.home-example span').first();
  const hs = await home.evaluate((el) => {const s = getComputedStyle(el); return {transform: s.transform, boxShadow: s.boxShadow, backgroundImage: s.backgroundImage};});
  expect(perspOf(hs.transform)).not.toBe(0);
  expect(zOf(hs.transform)).toBeGreaterThan(0);                                   // 静态厚度
  expect(hs.backgroundImage).toContain('data:image/svg+xml');
  expect(shadowLayers(hs.boxShadow).filter((l) => layerDy(l) > 0).length).toBeGreaterThanOrEqual(2);
  const homeRest = hs.transform;
  await hoverCard(page, home, 0.9, 0.2);
  await page.waitForTimeout(160);
  expect(await home.evaluate((el) => getComputedStyle(el).transform)).toBe(homeRest);   // 首页示例牌不参与倾斜
  await startRun(page, 'smoke-0');
  for (const i of [0, 1, 2]) await page.locator('.hand .card').nth(i).click();
  await page.getByRole('button', {name: '上拍 · 按此顺序'}).click();
  await page.getByRole('button', {name: '跳过动画'}).click();
  await page.locator('[data-action="next"]').waitFor({state: 'visible', timeout: 3000});
  const played = page.locator('.played .card').first();
  const ps = await played.evaluate((el) => {const s = getComputedStyle(el); return {transformStyle: s.transformStyle};});
  expect(ps.transformStyle).toBe('preserve-3d');
  const pf = await computedPseudo(played, '::before');
  const pp = await computedPseudo(played, '::after');
  expect(pf.backgroundImage).toContain('data:image/svg+xml');
  expect(zOf(pp.transform)).toBeLessThan(zOf(pf.transform));
  const status = await page.locator('.status strong').first().evaluate((el) => {const s = getComputedStyle(el); return {numeric: s.fontVariantNumeric, weight: s.fontWeight};});
  expect(status.numeric).toContain('tabular-nums');
  const log = await page.locator('.log p').first().evaluate((el) => {const s = getComputedStyle(el); return {w: s.borderLeftWidth, style: s.borderLeftStyle, color: s.borderLeftColor};});
  expect(log.style).toBe('solid');
  expect(parseFloat(log.w)).toBeGreaterThan(0);
  const tokenColor = await page.evaluate(() => {
    const p = document.createElement('span');
    p.style.setProperty('color', 'var(--auction-log-rule)');
    document.documentElement.appendChild(p);
    const v = getComputedStyle(p).color;
    p.remove();
    return v;
  });
  expect(log.color).toBe(tokenColor);                                             // 日志色阶来自 :root 令牌
  await expect(page.locator('.log')).toHaveAttribute('aria-live', 'polite');
});

/* ==================== TC-014 ==================== */
test('TC-014 CSP 与资源契约：无内联 style、无外部请求、纹理为 inline data:', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('pageerror', (e) => errors.push(String(e.message)));
  page.on('console', (m) => {if (m.type() === 'error' && !m.text().includes('404')) errors.push(m.text());});
  await page.goto('/');
  expect(await page.locator('#app [style]').count()).toBe(0);                     // 模板不产生内联 style 属性
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("style-src 'self'");
  expect(csp).toContain("img-src 'self' data:");
  await startRun(page, 'smoke-0');
  const card = page.locator('.hand .card').first();
  await hoverCard(page, card, 0.9, 0.1);
  await page.waitForTimeout(160);
  expect(await styleAttr(card)).toContain('--rx');                                // CSSOM 写入在现有 CSP 下生效
  expect(await page.locator('#app [style]').count()).toBe(1);                     // 仅被悬停的卡牌带 CSSOM 变量
  expect(errors).toEqual([]);                                                     // 无 CSP 违规/脚本错误
  expect(requests.every((u) => u.startsWith('http://127.0.0.1:4173/'))).toBe(true);   // NNA-009：无外部网络资源
  const text = cssText();
  const textures = [...text.matchAll(/--auction-texture-[\w-]+:url\("(data:image\/svg\+xml,[^"]+)"\)/g)];
  expect(textures.length).toBeGreaterThanOrEqual(3);
  for (const t of textures) expect(t[1]).not.toMatch(/\brgba?\(|\bhsla?\(/);
  expect(text).not.toMatch(/url\(["']?(?!data:)[^)]*\.(png|jpg|jpeg|gif|webp|woff2?|ttf|svg)/);
});

/* ==================== TC-015 ==================== */
test('TC-015 结算动画时序近似（无长时间停顿）与结算期间文本可读', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  await startRun(page, 'smoke-0');
  await page.evaluate(() => {
    const w = window as any;
    w.__frames = [];
    w.__on = true;
    let last = performance.now();
    const tick = () => {
      const n = performance.now();
      w.__frames.push(n - last);
      last = n;
      if (w.__on) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  for (const i of [0, 1, 2]) await page.locator('.hand .card').nth(i).click();
  const t0 = Date.now();
  await page.getByRole('button', {name: '上拍 · 按此顺序'}).click();
  let samples = 0;
  let unreadable = 0;
  for (let i = 0; i < 80; i++) {
    samples++;
    if (!(await textsContained(page.locator('.played .card')))) unreadable++;
    if (await page.locator('[data-action="next"]').count()) break;
    await page.waitForTimeout(60);
  }
  const elapsed = Date.now() - t0;
  await page.evaluate(() => {(window as any).__on = false;});
  const frames: number[] = await page.evaluate(() => (window as any).__frames);
  expect(unreadable).toBe(0);                                                     // 结算全程文本完整可读
  expect(samples).toBeGreaterThan(3);                                             // 逐步流水真实发生
  expect(elapsed).toBeLessThan(5000);
  expect(frames.length).toBeGreaterThan(5);
  expect(Math.max(...frames)).toBeLessThan(400);                                  // 近似阈值：无 >400ms 主线程停顿
  await page.screenshot({path: `${SHOTS}/tc015-settlement-terminal-1280.png`, fullPage: true});
});

/* ==================== TC-017 ==================== */
test('TC-017 文案/aria-live/存档键/畸形存档降级回归', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 800});
  await page.goto('/');
  await page.getByRole('button', {name: '规则', exact: true}).click();
  await expect(page.locator('.modal')).toContainText('18 × 2 = 36');
  await page.getByRole('button', {name: '关闭', exact: true}).click();
  await startRun(page, 'smoke-0');
  await expect(page.locator('.status strong').first()).toContainText('/ 150');
  for (const i of [0, 1, 2]) await page.locator('.hand .card').nth(i).click();
  await page.getByRole('button', {name: '上拍 · 按此顺序'}).click();
  await page.getByRole('button', {name: '跳过动画'}).click();
  await page.locator('[data-action="next"]').waitFor({state: 'visible', timeout: 3000});
  await expect(page.locator('.log')).toHaveAttribute('aria-live', 'polite');
  expect(await page.locator('.scoreboard strong').textContent()).toContain('=');
  const saved = await page.evaluate((k) => localStorage.getItem(k), TRIGGER_SAVE_KEY);
  expect(saved).toBeTruthy();
  expect(JSON.parse(saved as string).version).toBe('trigger-1');
  const page2 = await page.context().newPage();
  await page2.addInitScript((k) => localStorage.setItem(k, '{"version":"trigger-1"}'), TRIGGER_SAVE_KEY);
  await page2.goto('/');
  await expect(page2.getByRole('alert')).toBeVisible();
  await expect(page2.getByRole('button', {name: '开始新夜拍', exact: true})).toBeVisible();
  await page2.close();
});
