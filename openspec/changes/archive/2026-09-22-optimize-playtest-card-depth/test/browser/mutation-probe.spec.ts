// 变异探针（有效性证据，随测试节点提交）：用 CSSOM 注入规则破坏被测行为，
// 证明本方案的几何/计算样式断言不是恒真断言——每个变异都必须被对应断言捕获。
// 运行：npx playwright test openspec/changes/archive/2026-09-22-optimize-playtest-card-depth/test/browser/mutation-probe.spec.ts --config=<本目录>/playwright.depth.config.ts
import {test, expect} from '@playwright/test';

const SHOTS = 'openspec/changes/archive/2026-09-22-optimize-playtest-card-depth/test/reports/shots';

async function startRun(page: any) {
  await page.goto('/');
  await page.locator('#seed').fill('smoke-0');
  await page.getByRole('button', {name: '开始新夜拍', exact: true}).click();
  await expect(page.locator('.hand .card')).toHaveCount(6);
}
async function addRule(page: any, rule: string) {
  await page.evaluate((r: string) => {
    const sheet = document.styleSheets[0] as CSSStyleSheet;
    sheet.insertRule(r, sheet.cssRules.length);
  }, rule);
}
const zOf = (t: string) => {const m = t.match(/matrix3d\(([^)]+)\)/); return m ? Number(m[1].split(',')[14]) : 0;};

test('M1 材质层 Z 变正时，“材质在文本之后”断言必须失败', async ({page}) => {
  await startRun(page);
  const card = page.locator('.hand .card').first();
  expect(zOf(await card.evaluate((el) => getComputedStyle(el, '::before').transform))).toBeLessThan(0);
  await addRule(page, '.card{--auction-face-z:6px !important}');
  expect(zOf(await card.evaluate((el) => getComputedStyle(el, '::before').transform))).toBeGreaterThan(0); // 变异生效
});

test('M2 投影板夺取热区时，网格间隙命中断言必须失败', async ({page}) => {
  await startRun(page);
  await page.getByRole('button', {name: /^收藏/}).click();
  const cards = page.locator('.modal .compact .card');
  const gapFree = () => cards.first().evaluate((el) => {
    const sibling = el.nextElementSibling as HTMLElement;
    const a = el.getBoundingClientRect(), n = sibling.getBoundingClientRect();
    const hit = document.elementFromPoint((a.right + n.left) / 2, a.top + a.height * 0.6);
    return !(hit === el || el.contains(hit) || n === hit || sibling.contains(hit));
  });
  expect(await gapFree()).toBe(true);
  await addRule(page, '.card::after{pointer-events:auto !important}');
  await addRule(page, '.card{--auction-shadow-plane-inset:4% -30% -9% !important}');
  expect(await gapFree()).toBe(false);                                            // 变异被捕获
  await page.screenshot({path: `${SHOTS}/mutation-m2-shadow-overreach.png`});
});

test('M3 transform 被置为 none 时，倾斜影响渲染的断言必须失败', async ({page}) => {
  await startRun(page);
  const target = page.locator('.hand .card').nth(1);
  await target.evaluate((el) => el.scrollIntoView({block: 'center'}));
  const box = (await target.boundingBox())!;
  const renderedAt = async (dx: number, dy: number) => {
    await page.mouse.move(box.x + box.width * dx, box.y + box.height * dy);
    await page.waitForTimeout(150);
    return target.evaluate((el) => getComputedStyle(el).transform);
  };
  const a = await renderedAt(0.03, 0.03);
  const b = await renderedAt(0.97, 0.1);
  expect(a).not.toBe(b);
  await addRule(page, '.hand .card{transform:none !important}');
  const c = await renderedAt(0.03, 0.03);
  const d = await renderedAt(0.97, 0.1);
  expect(c).toBe(d);                                                              // 变异被捕获（倾斜不再影响渲染）
});
