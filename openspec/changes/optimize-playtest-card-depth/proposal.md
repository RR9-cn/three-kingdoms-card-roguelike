## Why

`apps/playtest` 的界面是纯 DOM + CSS：`trigger.css`（6028 字节，单行压缩）只有平面渐变、单一投影与 `translateY(-4px)` 悬浮，卡牌没有纵深、材质和统一光源；卡牌状态（可选中/已选中/已出牌/诡物/工具）主要靠色相区分。玩家在"选牌—排列—落槌"的核心循环中缺少手感与仪式感，整体观感停留在"可玩原型页"。

本机实测（Chromium 135 + 仓库基线 `f5ae6b8`）确认了三条决定实现路径的事实：`<button>` 上 `transform-style: preserve-3d` 生效，卡面与投影可以分层而不新增包裹层；页面 CSP `style-src 'self'` 拦截 HTML 内联 `style` 属性但放行 CSSOM `setProperty`；3D 变换计入滚动溢出区域，`scrollWidth ≤ innerWidth` 必须靠约束角度与投影边界达成，不能依赖布局。

## What Changes

- 在 `apps/playtest/public/trigger.css` 建立统一的暗色拍卖色阶、字重节奏与卡牌材质层（纸纹/磨砂/金属描边），所有新增颜色、渐变、阴影与纹理以 `:root` 自定义属性声明。
- 卡牌容器引入 CSS 3D：`perspective` / `preserve-3d` / `translateZ` / `rotateX` / `rotateY`，卡面、高光与投影分层。
- 在 `apps/playtest/src/main.ts` 以 `#app` 事件委托增加指针跟随钩子（`pointermove` / `pointerleave` → CSSOM `setProperty('--rx'/'--ry')`），仅在精细指针下启用。
- 悬停时卡牌按指针位置倾斜（`|rotateX|,|rotateY| ≤ 8°`，透视 900px），指针移出后 ≤200ms 回到静止态，且不引起相邻卡牌重排。
- 选中卡牌沿 Z 轴抬升并加强投影，保留既有"第 N 位"标注与槽位 01/02/03 的顺序关联。
- 结算提供落槌式 3D 过渡：只作用于当前已揭晓步（`result.steps[shown-1].id`）对应的卡牌，牌面全程正向可读；"跳过动画"立即到达终态，重复结算与连续两轮不残留动画状态。
- `prefers-reduced-motion: reduce` 下关闭倾斜与 3D 过渡（现有全局 `transition:none` 只关过渡、不关 transform，不构成完整降级）。

## Capabilities

### New Capabilities

- `playtest-visual-depth`: 卡牌材质与统一光源、卡牌 CSS 3D 纵深与指针跟随倾斜、选中 Z 轴抬升与槽位顺序关联、结算落槌过渡、动效降级、以及展示层必须保持的既有契约（规则内核/存档/CSP/可访问性/验证通道）。

### Modified Capabilities

无。本变更不修改任何既有 capability 的 Requirement 文本（包括 `occult-auction-presentation` 与 `settlement-causality`），仅新增展示层能力，以降低与并行变更的合并冲突。

## Impact

- `apps/playtest/public/trigger.css`：新增 `:root` 展示令牌、卡牌材质与 3D 分层、指针倾斜与落槌过渡、reduced-motion 降级；不改选择器结构、不改 `.card small` 字号、不改卡面渐变端点色与文本色。
- `apps/playtest/src/main.ts`：新增指针事件委托与一次性动画归属标记；不改渲染架构、不改动作路由、不改任何用户可见文案与 `aria-label`。
- 不改动：`packages/core/src/trigger.ts`、`packages/content/src/trigger.ts`（规则、数值、内容）、存档协议 `trigger-1` 与存档键 `midnight-hammer:trigger-1`、`apps/playtest/index.html` 的 CSP、`apps/desktop`、Vite/Electron 构建链、AI 评测协议 `schemaVersion 2`。
- 不新增运行时依赖、不新增外部网络资源、不新增 Playwright 像素基线。
- 验证：`npm ci`、`npm run build`、`npm test`（11/11）、`npm run test:browser`（3/3，本机需以临时配置指向系统 Chromium，见 design 的 R7 承接）与新增断言；证据落在 `docs/evidence/UI_DEPTH_V09.md` 与对比截图。
- 并行分支约束：远端 `optimize/product-ui-kkrx` 的 `optimize-playtest-ui-consistency` 对同一份 `trigger.css` 施加 token 层与可访问性不变量，本变更按 design 的兼容条款独立开发在 `main` 基线上。
