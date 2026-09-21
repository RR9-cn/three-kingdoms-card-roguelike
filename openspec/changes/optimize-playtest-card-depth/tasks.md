## 1. 令牌与材质基线（REQ 材质分层 / 令牌层）

- [x] 1.1 在 `trigger.css` 的 `:root` 中新增展示令牌：光源方向与投影栈、卡牌面/边/纹理/高光、卡牌状态（静止/悬停/选中/出牌）、页面色阶与字重节奏；命名沿用 `--auction-*`。
- [x] 1.2 用 `:root` 令牌给卡牌加材质层：纸纹（inline `data:` SVG，`%23` 编码，无 `rgb()` 文本形式）、磨砂叠层、金属描边；材质与高光层位于文本之后。
- [x] 1.3 三个卡牌变体各设置不同的非色相材质参数（边宽/边型、纹理强度、内阴影深度），保证不依赖色相也能区分。
- [x] 1.4 统一 `.status`、`.log`、`.scoreboard`、`h1`/`h2`/`.eyebrow`、`.slot` 的色阶与字重节奏，全部引用令牌，不新增 `:root` 外的颜色字面量。
- [x] 1.5 确认未改动卡面渐变端点色、文本色与 `.card small` 字号（与并行变更的对比度修正保持兼容）。

## 2. 卡牌 3D 与指针倾斜（REQ 3D 纵深与倾斜）

- [x] 2.1 卡牌容器声明 `perspective`、`transform-style: preserve-3d`，以伪元素实现卡面与投影分层（不新增包裹层）。
- [x] 2.2 把静止/悬停/选中的位移统一为 `transform: perspective(...) translateZ(var(--tz)) rotateX(var(--rx)) rotateY(var(--ry))`，替换现有 `translateY(-4px)` / `translateY(-5px)`。
- [x] 2.3 投影板使用 `pointer-events: none` 且不超出卡牌盒，避免遮挡相邻卡牌的点击热区。
- [x] 2.4 在 `main.ts` 的 `#app` 上增加 `pointermove` / `pointerleave` 事件委托，用 CSSOM `setProperty('--rx'/'--ry'/'--mx'/'--my')` 写入角度与高光位置；禁用 HTML 内联 `style`。
- [x] 2.5 倾斜范围限定 `|rotateX|,|rotateY| ≤ 8°`、透视 900px；用 `requestAnimationFrame` 合帧，每帧每卡最多一次 `getBoundingClientRect()`，并在 `pointerenter` / 滚动 / 缩放后失效缓存。
- [x] 2.6 仅在 `(hover: hover) and (pointer: fine)` 且非 reduced-motion 时挂载；`pointerleave` 清除变量并 ≤200ms 回静止。
- [x] 2.7 覆盖范围：`.hand .card`、`.rewards .card`、`.compact .card`（含升级与收藏弹层）；`.played .card` 与 `.home-example` 只做静态分层。
- [x] 2.8 每次 `render()` 后清理指向已卸载节点的倾斜引用，避免对脱离 DOM 的元素继续写入。

## 3. 选中抬升与顺序关联（REQ 选中抬升）

- [x] 3.1 选中态设置正 `translateZ` 抬升与更强投影，取消选择/移除/移动后完全复原。
- [x] 3.2 强化"第 N 位"标注与槽位 `01`/`02`/`03` 的视觉关联（角标/描边层级），不新增文案与结构。
- [x] 3.3 确认同时选中三张时顺序仍可辨认，且抬升不遮挡点数、标签、名称、能力与升级态信息。

## 4. 结算落槌过渡（REQ 落槌过渡）

- [x] 4.1 在结算渲染中为 `result.steps[shown-1].id` 对应的已出牌卡打上一次性动画标记（如 `data-landing`），仅在该步进渲染中存在。
- [x] 4.2 实现落槌式 `@keyframes`：沿 Z 轴压落 + 投影收紧再扩散，牌面全程正向可读，不使用翻牌与牌背。
- [x] 4.3 保证"跳过动画"、恢复存档、reduced-motion 三条路径直接呈现终态，不携带动画标记。
- [x] 4.4 在每次渲染后消费并清除该标记，保证重复结算、连续两轮与结算中的其它重渲染都不重放、不残留。

## 5. 降级与可访问性（REQ 降级 / REQ 既有契约）

- [x] 5.1 在 `prefers-reduced-motion: reduce` 分支显式关闭倾斜与 3D 过渡（现有 `*{transition:none!important}` 不足以关闭 transform）。
- [x] 5.2 校验粗指针、无 hover、指针钩子未运行三种情况下功能与信息不丢失。
- [x] 5.3 键盘回归：Tab 可达、`:focus-visible` 可见、`aria-label`（左移/右移/移除）不变、3D 变换后点击与焦点热区仍与可见卡牌一致。
- [x] 5.4 确认无新增依赖、无外部网络资源、无 HTML 内联 `style`，CSP 与 `index.html` 不变。

## 6. 验证与证据

- [x] 6.1 新增浏览器断言：悬停倾斜随指针变化、移出 ≤200ms 复原、相邻卡牌位置不变、选中抬升与复原、结算仅当前步卡牌带过渡、跳过立即终态、终态无动画标记。
- [x] 6.2 新增视口断言：1000×700、1280×800、1440×900 下 `scrollWidth ≤ innerWidth`，且卡牌文本未被遮挡。
- [x] 6.3 新增 reduced-motion 断言：无倾斜、无过渡、结算直接终态、信息完整。
- [x] 6.4 新增契约断言：`:root` 外无新增颜色字面量、材质为 inline `data:` URI、卡面渐变端点色与 `.card small` 字号未变、无内联 `style` 属性、无新增控制台错误。
- [x] 6.5 运行 `npm ci`、`npm run build`、`npm test`、`npm run test:browser`（本机需临时配置指向系统 Chromium）；如既有断言或截图受影响，同步更新并说明原因。
- [x] 6.6 产出 `docs/evidence/UI_DEPTH_V09.md` 的改动后章节与对比截图：1280/1440 的悬停、选中、结算、reduced-motion 状态；更新被自动覆盖的既有截图并说明差异。

## 7. 集成与文档

- [x] 7.1 核对与 `optimize-playtest-ui-consistency` 的兼容条款：`:root` 令牌层、`.card` 仍为语义化 `<button>`、弹层结构与焦点行为、`.card small` ≥12px 与对比度、≤1050px/700px 无横向溢出。
- [x] 7.2 确认未改动规则文档与规则类规格（`docs/GAME_DESIGN.md`、`simple-scoring`、`general-combo-chain` 等）；展示层规格仅落在本变更的 `playtest-visual-depth`。
- [ ] 7.3 提交并推送工作分支 `feat/ui-3d-card-effect-oysk`，确认远端可见。
