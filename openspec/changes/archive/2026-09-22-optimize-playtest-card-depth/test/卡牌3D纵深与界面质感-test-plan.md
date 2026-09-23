# 测试方案

> 基于：任务《【UI 优化】提升界面质感并为卡牌加入 3D 效果》需求共识、Spec 产物 `workflow-node-artifact-yevkotznr4b39mae7i3t`（`openspec/changes/archive/2026-09-22-optimize-playtest-card-depth/specs/playtest-visual-depth/spec.md`）、`design.md`、`tasks.md`、独立 Review 报告 `docs/reviews/20260921_ui-depth-card-3d/report.md`、实现提交 `e47c8e4`（工作分支 `feat/ui-3d-card-effect-oysk`）
> 生成日期：2026-09-22

**迭代目录（featureRoot）**：`openspec/changes/archive/2026-09-22-optimize-playtest-card-depth`（本仓库无 `harness/` 目录、无 `fshows` CLI，故以 OpenSpec 变更目录作为迭代目录；本方案所有一次性测试资产均落在 `<featureRoot>/test/` 下）

**执行环境矩阵（本机实测确定）**：

| 面 | 环境 | 说明 |
|---|---|---|
| 依赖服务 / DB Shell | 不适用 | 本变更无后端、无数据库、无 MQ；本机无 Docker |
| 应用 | Linux 本机 Node.js（`npm run dev`，Vite，`127.0.0.1:4173`） | 由 Playwright `webServer` 拉起，非 harness profile 概念 |
| 测试 | Linux 本机 Node.js 22.21.0 + 系统 Chromium | 仓库 `playwright.config.ts` 写死 `channel:'chrome'`，本机无 `/opt/google/chrome/chrome` |
| 构建 / 工程校验 | Linux 本机 npm（`npm ci` / `npm run build` / `npm test`） | 无 WSL、无 Gradle/Maven |

---

## 功能边界

### 验证范围

- 卡牌材质分层（REQ-1）：`.card::before` 卡面材质层（纸纹/磨砂/拉丝 + 随指针位移的高光 + 内描边）与 `.card::after` 投影板分层；三变体（普通 / 诡物 / 工具）在**非色相**维度（边宽、纹理、内描边、投影几何）可区分；材质层不得盖住点数/标签/名称/能力/升级标注。
- 卡牌 CSS 3D 纵深与指针倾斜（REQ-2）：`perspective` / `transform-style:preserve-3d` / `translateZ` / `rotateX` / `rotateY` 声明与计算值；精细指针下倾斜跟随指针、角度有界（≤8°）、移出 ≤200ms 复原、相邻卡牌不重排、不引入横向溢出。
- 选中抬升与顺序关联：`translateZ` 抬升 + 投影加强 + 金色描边环；三张同时选中时“第 N 位”标注与槽位 `01/02/03` 同索引；清空/移除后完全复原。
- 结算落槌 3D 过渡：仅当前揭晓步卡牌带 `data-landing`；牌面全程正向可读；点击“跳过动画”立即终态；重复结算、连续两轮、结算中重渲染不残留动画状态。
- 覆盖区域（信息架构不变）：手牌 `.cards.hand`、槽位 `.slots`、结算牌区 `.cards.played`、战后选牌 `.cards.rewards`、收藏弹层 `.cards.compact`、升级选牌 `.cards.compact`、首页示例 `.home-example`、顶部状态 `.status` 与日志 `.log`。
- 降级与既有契约：`prefers-reduced-motion: reduce`、粗指针/无 hover、指针钩子未运行三种降级；键盘可达性、`:focus-visible`、`aria-label`、点击热区一致性；CSP 与资源契约（无内联 `style` 属性、无外部网络资源、纹理为 inline `data:` URI）；规则内核与存档协议未被改动。
- 端到端链路：首页输入种子 → 开始新夜拍 → 手牌选三张并排序 → 上拍 → 逐步结算（含落槌过渡 / 跳过动画）→ 下一轮 → 战后收集 → 升级 → 第二场；全程在 1280×800 与 1440×900 视口下检查渲染与交互。

### 不验证范围

- 规则与数值正确性（`packages/core`、`packages/content` 的连锁/热度/三场目标 150/260/420）——本次改动不改内核，已有 11 项单元测试覆盖，本方案仅做回归确认（原因：不在本次变更范围，且内核未被修改）。
- 视觉美观度的主观评分（材质是否“值钱”）——无 Figma 基线，属人工观感判断，仅做“分层/可区分/不遮挡”的可判定断言。
- Windows 原生与 Steam 发布链路（`npm run package:win`、`test:desktop`）——本机无 Windows、无 Electron 图形栈（原因：AGENTS.md 明确不得把单元测试或浏览器演示表述为 Windows 原生验证）。
- 真实设备 / 触屏硬件的倾斜行为——以 `hasTouch` 浏览器上下文模拟粗指针（原因：本机无真实触屏设备）。
- 像素级截图基线比较——Spec 明确“不新增 Playwright 像素基线”，截图仅作人工核对证据（原因：无基线来源，且 Spec 已排除）。

### 代码定位

| 层次 | 路径 | 说明 |
|---|---|---|
| 展示层渲染 | `apps/playtest/src/main.ts` | `render()` 模板拼装、`card()` 卡牌 DOM、指针事件委托与 CSSOM 变量写入、`armLanding()` 落槌标记消费 |
| 样式/动效 | `apps/playtest/public/trigger.css` | `:root` 令牌层、卡牌材质与 3D 变换、`@keyframes auction-hammer-fall/-shadow`、`prefers-reduced-motion` 分支 |
| 页面入口 | `apps/playtest/index.html` | CSP（`style-src 'self'`、`img-src 'self' data:`）与脚本入口 |
| 规则内核 | `packages/core/src/trigger.ts` | `newTrigger` / `actTrigger` / `triggerView` / `isTriggerState` / `TRIGGER_SAVE_KEY`（本次**不改**，仅回归断言） |
| 内容 | `packages/content/src/trigger.ts` | 12 种卡牌定义（本次**不改**） |
| 既有自动化 | `tests/trigger.test.ts`（11 项单元）、`tests/browser/trigger.spec.ts`（3 既有 + 7 新增） | 回归基线，不修改其断言 |
| 本方案新增测试 | `openspec/changes/archive/2026-09-22-optimize-playtest-card-depth/test/browser/depth-ui.spec.ts` | 独立验证用例（Node.js + Playwright 黑盒） |
| 临时运行配置 | `openspec/changes/archive/2026-09-22-optimize-playtest-card-depth/test/browser/playwright.depth.config.ts` | 指向系统 Chromium 的等价配置（不改仓库 `playwright.config.ts`） |
| Mock/Stub | `openspec/changes/archive/2026-09-22-optimize-playtest-card-depth/test/browser/depth-ui.spec.ts` 内 | 浏览器上下文级模拟（reduced-motion / 粗指针 / 畸形存档注入），无外部服务 Mock |

---

## 触发入口

| 入口类型 | 是否已实现 | 入口路径 | 备注 |
|---|---|---|---|
| HTTP API | 否 | — | 无 JSON API；页面本身经 HTTP 提供 |
| 页面加载（静态资源） | 是 | `GET http://127.0.0.1:4173/`、`/trigger.css`、`/src/main.ts` | Vite dev server；`npm run dev`，由 Playwright `webServer` 自动拉起 |
| 前端操作（指针） | 是 | `#app` 委托的 `pointermove` / `pointerleave` | 驱动 `--rx/--ry/--mx/--my`（CSSOM `setProperty`） |
| 前端操作（点击） | 是 | `[data-action]`：`start` / `pick` / `left` / `right` / `remove` / `clear` / `swap` / `play` / `skip` / `next` / `take` / `upgrade` / `rules` / `collection` / `home` | 全部交互的唯一入口 |
| 键盘操作 | 是 | Tab / Enter（`<button class="card">`、槽位按钮） | 可访问性回归入口 |
| 定时任务 | 是（页面内） | `animate()` 的 `setTimeout` 步进（`Math.max(140,440-shown*30)`） | 结算逐步流水；不可从外部直接触发 |
| MQ 消息 | 否 | — | 无 |
| 数据库状态 | 否 | — | 无 DB；唯一持久化为 `localStorage['midnight-hammer:trigger-1']`，可由 `page.addInitScript` 注入 |

### 触发入口结论

- **推荐入口**：`页面加载 + 前端操作`——真实浏览器（系统 Chromium）经 `http://127.0.0.1:4173/` 加载真实页面，用 `page.mouse` 触发真实 `pointermove`、用 `locator.click()` 触发真实点击、用 `page.keyboard` 触发真实 Tab；断言读取 `getComputedStyle` 计算值与 `getBoundingClientRect()` 几何，这是唯一能同时覆盖 CSS 3D 计算值、CSP 对 CSSOM 的放行、指针跟随与命中热区的入口。
- **不推荐入口**：
  - `静态阅读 CSS/TS 源码`：无法证明计算样式、`preserve-3d` 生效、CSP 放行 CSSOM、命中热区一致性，不能替代运行结果。
  - `jsdom / 单元测试`：无布局引擎，`getComputedStyle` 不解析 3D 变换与伪元素，`elementFromPoint` 不存在。
  - `定时任务（animate 步进）`：由 `setTimeout` 内部驱动，不可外部注入；只能通过“点击上拍后观察 MutationObserver”间接验证。
  - `直接改 localStorage 驱动结算`：绕过 UI 会丢失渲染与动画时序，只在畸形存档降级用例中作为注入手段。

---

## 依赖服务

### 应用服务

| 应用 | 是否必需 | 启动方式 | 健康检查 |
|---|---|---|---|
| Vite dev server（`apps/playtest`） | **是** | `npm run dev`（Playwright `webServer` 自动启动，`reuseExistingServer:true`） | `GET http://127.0.0.1:4173/` 返回 200 且含 `#app` |

> 说明：本仓库无 `harness/` 目录、无 `application-harness.yml`、无 Spring 应用，**不存在** profile 概念；测试基线是仓库默认 Vite dev server + 系统浏览器，与 Spec/证据文档记录一致。

### Docker 依赖

| 服务 | 是否必需 | 用途 |
|---|---|---|
| MySQL | 否 | 无数据层 |
| Redis | 否 | 无缓存/锁 |
| Nacos | 否 | 无配置中心 |
| RocketMQ | 否 | 无消息 |
| mock-upstream | 否 | 无外部上游服务；本机亦无 Docker |

---

## 数据准备

| 名称 | 位置 | 初始化 | 清理 |
|---|---|---|---|
| 夜拍种子数据 | 无文件（UI 输入 `#seed`） | `page.locator('#seed').fill('smoke-0' / 'ui-depth' / 'order-ui')` 后点击“开始新夜拍” | 每个用例使用独立 `browser context`，`localStorage` 随上下文销毁 |
| 畸形存档数据 | 无文件（`page.addInitScript`） | 注入 `localStorage['midnight-hammer:trigger-1'] = '{"version":"trigger-1"}'` | 随上下文销毁 |
| 结算/选牌状态数据 | 无文件（真实 UI 操作累积） | 选三张 → 上拍 → 观察逐步结算；打满一场 → 战后选牌 → 升级 | 随上下文销毁 |

> 说明：本变更无 DDL、无 schema、无迁移、无 SQL fixture，故不产生 `fixtures/db/` 目录，也不需要临时 SQL 文件。

### 种子数据扩展

- 是否必需：**否**
- 基线变更：**否**
- 判断依据：本仓库不存在 `harness/tests/fixtures/` 基线 SQL 体系（无 `schema.sql`、无 `init_data.sql`、无数据库）；测试数据全部由“UI 输入的夜拍种子 + `localStorage` 注入”构成，且只在单个 `browser context` 生命周期内有效，不具备跨功能复用价值，因此不新增任何基线数据文件。
- 文件清单：无（不新增 fixture；若后续引入数据库层，再按 `TC-{需求名称}-xxx.sql` 规则补充临时 SQL）

---

## Mock 策略

### Mock 1：系统“减少动态效果”偏好（`prefers-reduced-motion`）

- **方式**：Playwright `page.emulateMedia({reducedMotion:'reduce'})`，在真实浏览器中让 `matchMedia('(prefers-reduced-motion: reduce)')` 为真
- **断言要求**：
  - 指针在卡牌上移动后，卡牌 DOM 不得出现 `--rx/--ry` 写入，计算 `transform` 与静止态逐字符一致
  - `.played .card` 计算 `animation-name` 必须为 `none`
  - 结算必须直接呈现终态（`data-action="next"` 立即可见、`[data-landing]` 计数为 0）
  - 点数 / 名称 / 能力文本仍必须全部存在（信息不丢失）

### Mock 2：粗指针 / 无 hover（`hasTouch` 上下文）

- **方式**：`browser.newContext({hasTouch:true})`，使 `matchMedia('(hover: hover) and (pointer: fine)')` 为假
- **断言要求**：
  - 不得写入倾斜变量、计算 `transform` 在两个指针位置完全一致
  - 静态材质分层仍在（`::before` 仍含 inline `data:image/svg+xml`）
  - 选择、排序、上拍、跳过全部可用并到达终态

### Mock 3：畸形/缺失存档（存储损坏）

- **方式**：`page.addInitScript` 注入 `{"version":"trigger-1"}` 等非法存档
- **断言要求**：
  - 出现 `role="alert"` 提示且首页可用（降级不崩）
  - 不得因新增的指针钩子/动画标记引入额外控制台错误

### Mock 4：浏览器可执行文件替换（环境缺口，非业务 Mock）

- **方式**：临时 Playwright 配置 `launchOptions.executablePath` 指向系统 Chromium（`/usr/bin/chromium-browser` 或 `/opt/chromium.org/chromium/chromium-browser`），不改仓库 `playwright.config.ts`
- **断言要求**：
  - 用例集合与断言强度必须与仓库默认配置完全一致（仅替换可执行文件）
  - 报告必须记录“仓库默认配置在本机的失败原因”，不得把该替换表述为“默认配置通过”

---

## 测试类型选择

| 类型 | 是否采用 | 理由 | 文件位置 |
|---|---|---|---|
| **`node_api`**（主） | 是 | 唯一入口是 HTTP 提供的页面 + 浏览器内交互；用 Node.js（Playwright，Node 运行时）做黑盒自动化，断言落在真实 DOM 计算样式、几何与网络/控制台副作用上 | `openspec/changes/archive/2026-09-22-optimize-playtest-card-depth/test/browser/depth-ui.spec.ts` |
| `manual_smoke`（辅） | 是 | 结算动画“无明显卡顿”的主观观感、材质观感属人工判断；仅在自动化无法判定时作为补充 | `openspec/changes/archive/2026-09-22-optimize-playtest-card-depth/test/reports/` 中的人工核对记录 |
| `java_unit` / `java_integration` | 否 | 本仓库为 TypeScript，无 Java 代码 | — |

**被拒绝的类型**：

- `java_unit` / `java_integration`：仓库无 Java 模块与构建系统。
- 纯 `unit`（jsdom）：无布局/合成引擎，无法验证 3D 变换、伪元素分层、命中热区与 CSP 行为。
- 像素基线对比：Spec 明确不新增像素基线，且无权威设计基线来源。

---

## 覆盖等级

| 维度 | 值 |
|---|---|
| 目标覆盖等级 | `e2e` |
| 最低可接受等级 | `e2e` |
| 降级是否需用户批准 | **是** |

**理由**：本次变更的全部验收项都是“真实浏览器渲染 + 真实指针/键盘交互”的端到端属性（计算样式中的 CSS 3D、CSP 对 CSSOM 的放行、命中热区、逐步结算动画时序、reduced-motion 降级），低等级测试无法观察到这些属性；把最低可接受等级降到 `unit`/`service` 会使“3D 是否真的生效”“点击热区是否错位”等核心风险失去覆盖，因此不允许无批准降级。

---

## 不可替代断言

| ID | 断言内容 | 原因 |
|---|---|---|
| NNA-001 | 真实浏览器中 `.hand .card` 的计算样式必须为 `transform-style: preserve-3d`、`perspective: 900px`，且 `::before`（卡面材质）与 `::after`（投影板）的 `matrix3d` 平移 Z 必须满足 `z(::after) < z(::before) < 0`，卡牌自身 `background-image` 为 `none` | 只有计算样式能证明分层真实生效且材质层位于文本之后；静态阅读 CSS 无法证明伪元素参与合成 |
| NNA-002 | 真实 `page.mouse` 移动过程中，卡牌 DOM 上必须出现由 CSSOM 写入的 `--rx/--ry`，其值随指针位置变化、`|角度| ≤ 8°`，且全程无控制台错误 | 现有 CSP（`style-src 'self'`，无 `unsafe-inline`）下只有 CSSOM 路径可行；CSP 违规只以控制台 error 出现，必须真实页面才能捕获 |
| NNA-003 | 指针移出后 ≤200ms，该卡牌计算 `transform` 必须与静止态逐字符一致；倾斜前后相邻卡牌 `getBoundingClientRect()` 必须完全相等 | “回静止 ≤200ms”与“不引起相邻卡牌重排”是手感与布局的硬指标，只能靠几何测量 |
| NNA-004 | 选中态卡牌 `matrix3d` 的 Z 必须比静止态大 ≥10px 且 `box-shadow` 必须变化（含金色描边环）；清空选择后 Z 与 `box-shadow` 必须与静止态逐字符一致 | 抬升与复原的“完全一致”无法用类名/文本断言替代 |
| NNA-005 | 结算过程中任一时刻 `.played .card[data-landing]` 元素数必须恒为 1，且其 `data-id` 对应的卡名必须等于当前日志末条 `.log p:last-child b`；终态与新一次结算起始必须为 0 个 `[data-landing]` | “过渡只作用于当前揭晓步”“不残留动画状态”依赖真实渲染时序，只能由 MutationObserver 观测 |
| NNA-006 | 点击“跳过动画”后必须立即（≤2s）出现 `data-action="next"`、`[data-landing]` 计数为 0、`.scoreboard strong` 含 `=`，且已入账分数与逐步结算结果一致 | 跳过路径的终态与入账一致性是结算幂等的核心，静态检查无法验证 |
| NNA-007 | `prefers-reduced-motion: reduce` 下不得写入 `--rx/--ry`，`.played .card` 计算 `animation-name` 必须为 `none`，且点数/名称/能力文本仍存在 | 降级必须同时满足“无动效”与“信息不丢失”，两者都需真实媒体查询环境 |
| NNA-008 | 键盘 Tab 必须到达全部 6 张手牌且 `:focus-visible` 为 `solid` 轮廓；`aria-label` 必须仍为 `<卡名>左移` / `<卡名>右移` / `移除`；倾斜状态下卡牌中心 `elementFromPoint` 必须命中该卡牌自身，且倾斜中点击必须选中正确卡牌 | 3D 变换会移动可见与命中区域，热区错位/误触只能靠真实命中测试发现 |
| NNA-009 | 页面产生的全部请求 URL 必须落在 `http://127.0.0.1:4173/` 内；`#app [style]` 计数必须为 0；`trigger.css` 的 `:root` 块之外不得出现颜色字面量（`#hex`/`rgb()`/`rgba()`/`hsl()`/`hsla()`），纹理必须为 inline `data:` URI | 无外部资源、无内联 `style`、令牌层唯一来源是安全与规范契约，需真实网络监听 + 文本扫描双证 |
| NNA-010 | `npm ci`、`npm run build`、`npm test`（11/11）、`npm run test:browser`（10/10）必须通过；`git diff` 必须显示 `packages/core/src/trigger.ts`、`packages/content/src/trigger.ts`、`apps/playtest/index.html` 未被本次改动修改，存档协议 `trigger-1` 与键 `midnight-hammer:trigger-1` 不变 | 既有验证通道与“不改规则内核/存档协议”是本次变更的硬约束，需真实命令输出与 git 证据 |

---

## 降级路径

| 降级场景 | 允许条件 | 需用户批准 |
|---|---|---|
| 仓库默认 `npm run test:browser`（`channel:'chrome'`）在本机无 Google Chrome 时无法启动，改用临时配置指向系统 Chromium 运行同一份用例 | 仅替换浏览器可执行文件，用例集合与断言强度不变；报告须显式记录默认配置的失败原因与替代配置内容 | 是 |
| 结算“无明显卡顿”无法给出稳定的帧率阈值时，改为可判定的近似断言（结算总时长上界 + 逐帧最大间隔上界 + 期间文本可读性）并标注为近似 | 无头浏览器帧时序受宿主负载影响，硬帧率阈值会引入 flaky；须在报告中记录阈值与理由 | 是 |
| 无真实触屏设备时，用 `hasTouch` 上下文模拟粗指针降级 | 本机无触屏硬件；该上下文能真实翻转 `hover/pointer` 媒体查询 | 是 |
| 无 Figma/像素基线，视觉观感（材质是否“值钱”）不作自动评分，仅人工核对截图 | Spec 明确不新增像素基线 | 是 |

---

### 用户决策登记（2026-09-22，节点负责人确认）

| 决策项 | 决策 | 影响 |
|---|---|---|
| 仓库默认 `npm run test:browser`（`channel:'chrome'`）在本机无 Google Chrome | **接受等价配置结果** | 以 `test/browser/playwright.depth.config.ts`（仅替换浏览器可执行文件）运行同一用例集的结果（10/10）作为该命令的有效验证证据；不再要求在本机安装 Google Chrome |
| 证据截图再生成差异（悬停/投影过渡时序导致字节不可复现） | **接受不更新截图** | 保持 `docs/evidence/*.png` 为编码节点提交的既有基线，不复原为本次跑测产生的字节；截图仅作人工核对证据，不作为像素级回归基线 |

> 上述两项均属本方案「降级路径」中已列明、需用户批准的路径，现已被批准，故降级不再构成未决事项。

---

## 测试用例

### TC-001 · 卡牌材质分层与 CSS 3D 纵深声明（1280×800）

| 维度 | 内容 |
|---|---|
| **场景** | 手牌区卡牌在 1280×800 下呈现卡面材质层与投影板分层，并声明透视与厚度 |

**前置条件**：

- 应用经 `http://127.0.0.1:4173/` 可访问，浏览器为系统 Chromium（精细指针、无 reduced-motion）
- 视口 1280×800；已用种子 `smoke-0` 开始新夜拍，`.hand .card` 为 6 张

**操作步骤**：

1. 读取 `.hand .card` 的计算样式（`transform-style` / `perspective` / `transform` / `background-image` / `box-shadow` / `border-width`）
2. 读取该卡牌 `::before` 与 `::after` 的计算样式（`transform` 的 `matrix3d` 平移 Z、`background-image`、`pointer-events`）
3. 对 `box-shadow` 分层解析垂直偏移方向
4. 读取 `.card small` 计算字号

**预期结果**：

- `transform-style: preserve-3d`，`perspective: 900px`，卡牌自身 `transform` 为含非零透视的 `matrix3d`
- 卡牌自身 `background-image: none`（材质画在伪元素上）
- `matrixZ(::after) < matrixZ(::before) < 0`（投影板与卡面分层，材质在文本之后）
- `::before` 的 `background-image` 含 `data:image/svg+xml`（inline 纹理）
- `::after` 的 `pointer-events: none`
- `box-shadow` 至少 2 层且垂直偏移同向（统一光源）
- `.card small` 字号仍为 `10px`（未被本次改动修改）

---

### TC-002 · 三变体在非色相维度可区分

| 维度 | 内容 |
|---|---|
| **场景** | 普通 / 诡物 / 工具三种卡牌在边宽、纹理、投影几何上互不相同 |

**前置条件**：

- 已开始夜拍；打开“收藏”弹层（`.modal` 内 `.compact .card` 含三种变体）

**操作步骤**：

1. 在弹层内分别取 `.card.haunted`、`.card.tool`、`.card:not(.haunted):not(.tool)` 的 `border-width`、`::before` 首个 `background-image`、`box-shadow`（去色）
2. 比较三者签名集合

**预期结果**：

- 三者的（边宽, 纹理, 投影几何）签名互不相同，集合大小为 3
- 三种变体均保留材质层与 3D 分层

---

### TC-003 · 悬停倾斜跟随指针且角度有界（1280×800）

| 维度 | 内容 |
|---|---|
| **场景** | 精细指针在手牌上移动时，该卡牌按指针位置倾斜，角度不超过 8° |

**前置条件**：

- 1280×800；`smoke-0` 已开局；指针先移至视口角落保证无倾斜

**操作步骤**：

1. `page.mouse.move` 到第 2 张手牌的左上角内侧，等待 120ms，读取该卡 `style` 属性与计算 `transform`
2. 移动到同一张卡的右上角，等待 120ms，再次读取
3. 解析两次写入的 `--rx/--ry` 角度

**预期结果**：

- 两次读取的 `style` 属性均含 `--rx`，且两次内容不相同（跟随指针）
- 所有角度绝对值 ≤ 8°
- 倾斜方向与指针位置一致（指针偏左上 → `--ry` 与 `--rx` 符号符合 `nx*max*2` / `-ny*max*2` 的映射）
- 全程无控制台错误（CSP 未拦截 CSSOM 写入）

---

### TC-004 · 指针移出 ≤200ms 复原且不重排相邻卡牌

| 维度 | 内容 |
|---|---|
| **场景** | 指针移出后卡牌在 200ms 内回到静止态，且其他卡牌位置不变 |

**前置条件**：

- 1280×800；已开局；记录未悬停卡牌（第 5 张）的文档坐标

**操作步骤**：

1. 悬停第 2 张卡使其倾斜，记录其计算 `transform`
2. 记录第 5 张卡 `getBoundingClientRect()`
3. 指针移至视口左上角 (5,5)，分别在 ≤200ms 处读取第 2 张卡的 `style` 与计算 `transform`
4. 再次读取第 5 张卡 `getBoundingClientRect()`

**预期结果**：

- 200ms 时第 2 张卡 `style` 属性不再含 `--rx/--ry`，计算 `transform` 与静止态（未悬停卡）逐字符一致
- 第 5 张卡 `getBoundingClientRect()` 前后完全相等（不重排）

---

### TC-005 · 视口矩阵下的倾斜与无横向溢出、文本不被遮挡（1000×700 / 1280×800 / 1440×900）

| 维度 | 内容 |
|---|---|
| **场景** | 在三个视口下逐张倾斜可视卡牌，均无横向溢出且卡牌文本完整 |

**前置条件**：

- 已开局并选中 3 张（选中态抬升同时生效）

**操作步骤**：

1. 依次将视口设为 1000×700、1280×800、1440×900
2. 对每个视口内纵向可见的每张手牌，将指针移到其右上角并等待 150ms
3. 断言 `document.documentElement.scrollWidth <= innerWidth`
4. 断言每张卡牌内 `.card-top b` / `.card-top span` / `strong` / `.ability` / `small` 的矩形完整落在卡牌盒内（允许 ±1px）

**预期结果**：

- 三个视口下倾斜均不产生横向滚动
- 每张卡牌的点数、标签、名称、能力文本、升级/顺序标注均未被材质层或 3D 变换挤出/裁切

---

### TC-006 · 选中 Z 轴抬升、三张顺序可辨、取消后完全复原

| 维度 | 内容 |
|---|---|
| **场景** | 选中三张卡牌：抬升 + 投影变化 + 顺序标注与槽位同索引；清空后完全复原 |

**前置条件**：

- 1280×800；`smoke-0` 已开局；指针移到视口角落等待 250ms（确保静止态）

**操作步骤**：

1. 记录第 1/2/3 张卡的 `data-id`、静止态 `matrixZ` 与 `box-shadow`
2. 记录未选中卡（第 5 张）相对 `.hand` 的矩形
3. 依次点击第 1/2/3 张卡
4. 指针移开并等待 250ms，逐张读取 `matrixZ`、`box-shadow`、`small` 文案，并读取 `.slot b` 文案
5. 再次读取第 5 张卡相对 `.hand` 的矩形
6. 点击“清空选择”，指针移开等待 250ms，逐张复查 `matrixZ` 与 `box-shadow`

**预期结果**：

- 三张选中卡 `matrixZ` 均比静止态大 ≥10px，`box-shadow` 均变化且含金色描边环
- 三张卡的 `small` 分别含 `第1位` / `第2位` / `第3位`，且与 `.slot b` 同索引卡名一致
- 选中不引起 `.hand` 网格重排（未选中卡相对矩形不变）
- 清空后 `matrixZ` 与 `box-shadow` 与静止态逐字符一致

---

### TC-007 · 结算落槌过渡只作用于当前揭晓步

| 维度 | 内容 |
|---|---|
| **场景** | 逐步结算时，任一时刻只有当前揭晓步的卡牌带 `data-landing`，且指向当前日志条目 |

**前置条件**：

- 1280×800；已开局；用 `MutationObserver` 监听 `.played .card[data-landing]` 的出现

**操作步骤**：

1. 选三张并点击“上拍 · 按此顺序”
2. 等待首个 `[data-landing]` 出现，记录该次出现时 `[data-landing]` 数量、`data-id` 与日志末条卡名
3. 等待 `data-action="next"` 可见（终态）
4. 汇总所有观测记录

**预期结果**：

- 观测记录数 > 0，且每条记录的 `[data-landing]` 数量恒为 1
- 每条记录的 `data-id` 对应卡名等于当时日志末条 `.log p:last-child b`
- 终态 `[data-landing]` 计数为 0，`.scoreboard strong` 含 `=`（落槌价已出）

---

### TC-008 · 跳过动画立即终态、重复结算与连续两轮无残留（幂等）

| 维度 | 内容 |
|---|---|
| **场景** | “跳过动画”立即到达终态；第二次结算与连续两轮不携带上一次的动画状态 |

**前置条件**：

- 1280×800；已完成一次结算并进入下一轮（或已回到 `battle`）

**操作步骤**：

1. 记录当前已入账分数
2. 再次选三张并“上拍”，立刻断言新结算起始 `[data-landing]` 计数
3. 点击“跳过动画”，等待 `data-action="next"` 可见（≤2s）
4. 断言 `[data-landing]` 计数、`.scoreboard strong` 内容、`.status strong` 分数
5. 连续点击“跳过动画”两次，断言界面状态不异常

**预期结果**：

- 新一次结算起始 `[data-landing]` 计数为 0（无上一次残留）
- 跳过动画后 ≤2s 出现 `data-action="next"`，`[data-landing]` 计数为 0，`.scoreboard strong` 含 `=`
- 跳过后的入账分数与逐步结算结果一致（≥ 跳过前分数，且与 `.status strong` 一致）
- 重复点击跳过不改变终态、不产生控制台错误

---

### TC-009 · `prefers-reduced-motion: reduce` 降级

| 维度 | 内容 |
|---|---|
| **场景** | 系统减少动态效果开启时，无倾斜、无 3D 过渡，功能与信息不丢失 |

**前置条件**：

- `page.emulateMedia({reducedMotion:'reduce'})`；1280×800；已开局

**操作步骤**：

1. 记录卡牌静止 `transform`
2. 指针在卡牌上移动并等待 200ms，读取 `style` 与计算 `transform`
3. 选三张并“上拍”，等待 `data-action="next"` 可见
4. 读取 `.played .card` 计算 `animation-name` 与点数/名称/能力文本

**预期结果**：

- 卡牌 `style` 不含 `--rx/--ry`，计算 `transform` 与静止态一致
- 结算直接呈现终态（无逐步动画），`[data-landing]` 计数为 0
- `.played .card` 计算 `animation-name` 为 `none`
- 点数、名称、能力文本齐全（信息不丢失）

---

### TC-010 · 键盘可达性、aria-label 与倾斜状态下的点击热区

| 维度 | 内容 |
|---|---|
| **场景** | Tab 可达全部手牌且 `focus-visible` 可见；`aria-label` 不变；倾斜中点击命中正确卡牌 |

**前置条件**：

- 1280×800；已开局

**操作步骤**：

1. 循环按 Tab（≥24 次），收集聚焦到的 `.hand .card` 的 `data-id`、`:focus-visible` 与 `outline-style`
2. 选中一张卡后断言 `<卡名>左移`、`<卡名>右移`、`移除` 按钮可访问
3. 将指针移到某张卡上使其倾斜，在卡内靠近边缘处执行真实点击（`page.mouse.click`）
4. 断言被选中的卡牌 `data-id` 与预期一致，且 `.slot` 中出现该卡名

**预期结果**：

- Tab 可到达全部 6 张手牌，聚焦时 `:focus-visible` 为真且 `outline-style: solid`
- `aria-label` 仍为 `<卡名>左移` / `<卡名>右移`，移除按钮文案仍为 `移除`
- 倾斜状态下卡牌中心 `elementFromPoint` 命中该卡牌自身
- 倾斜中点击选中正确卡牌（无热区错位/误触相邻卡牌）

---

### TC-011 · 粗指针 / 无 hover 降级仍可完整操作

| 维度 | 内容 |
|---|---|
| **场景** | `(hover: hover) and (pointer: fine)` 不匹配时不倾斜，但游戏全流程可用 |

**前置条件**：

- `browser.newContext({hasTouch:true, viewport:{width:1280,height:800}})`

**操作步骤**：

1. 断言媒体查询为假
2. 指针在两个位置移动后读取 `style` 与计算 `transform`
3. 选三张、右移一张、上拍、跳过动画，等待终态

**预期结果**：

- 无倾斜变量写入，两处计算 `transform` 完全一致
- 静态材质分层仍在（`::before` 含 inline `data:image/svg+xml`）
- 选择、排序、上拍、跳过全部可用，终态 `.scoreboard strong` 含 `=`，`[data-landing]` 计数为 0

---

### TC-012 · 收藏弹层 / 战后选牌 / 升级选牌的材质与命中（含滚动容器）

| 维度 | 内容 |
|---|---|
| **场景** | `.compact`（收藏弹层、升级选牌）与 `.rewards`（战后选牌）卡牌保留材质与 3D 分层，文本与命中区正确 |

**前置条件**：

- 1280×800；`smoke-0` 已开局

**操作步骤**：

1. 打开收藏弹层，读取 `.modal .compact .card` 的计算样式与 `::before`/`::after`
2. 断言投影板 `pointer-events: none`、左右与上沿在卡牌盒内、网格间隙处 `elementFromPoint` 不落在任何卡牌上、相邻卡牌中心仍命中自身
3. 断言每张卡文本矩形完整落在卡牌盒内、文档无横向溢出
4. 将视口缩短至 1280×560 使弹层真正滚动，断言 `scrollHeight > clientHeight`、滚动到底后文本仍完整、末张卡与投影板未被裁切
5. 打满一场进入 `.rewards`，读取 `.rewards .card` 的计算样式，并将指针移入某张候选卡验证倾斜生效
6. 收集一张后进入升级态，读取 `.cards.compact .card` 的材质与 3D 分层

**预期结果**：

- 弹层内卡牌 `preserve-3d`、非零透视、`matrixZ(::before) < 0`、材质为 inline `data:` URI
- 投影板不参与命中测试、不夺取相邻卡牌热区；卡牌文本不被裁切；无横向溢出
- 弹层滚动容器内滚动到底后文本与命中仍正确
- `.rewards .card` 具备同样的 3D 声明且可倾斜；升级选牌区卡牌保留材质与 3D

---

### TC-013 · 首页示例牌与结算牌区静态分层、状态/日志区色阶令牌化

| 维度 | 内容 |
|---|---|
| **场景** | `.home-example` 与 `.cards.played` 只做静态分层；顶部状态与日志区色阶/字重来自 `:root` 令牌 |

**前置条件**：

- 首页（未开局）与结算态各一次；1280×800

**操作步骤**：

1. 首页读取 `.home-example span` 的计算 `transform`、`box-shadow`、`background-image`
2. 结算态读取 `.played .card` 的 `::before`/`::after` 与 `transform`
3. 读取 `.status strong`、`.log p` 的计算 `color` / `border-left-width` / `font-variant-numeric`
4. 静态扫描 `trigger.css`：`:root` 块外颜色字面量计数

**预期结果**：

- `.home-example span` 有 `perspective` + `translateZ` 的静态分层与投影，无指针倾斜钩子
- `.played .card` 有材质层与投影板分层（静态，不参与倾斜目标）
- `.status strong` 使用 `tabular-nums` 且颜色为令牌值；`.log p` 有左侧色阶边线
- `:root` 块外颜色字面量计数为 0

---

### TC-014 · CSP 与资源契约（无外部请求、无内联 style、纹理为 inline data:）

| 维度 | 内容 |
|---|---|
| **场景** | 页面在既有 CSP 下无内联 `style` 属性、无外部网络资源、无控制台错误 |

**前置条件**：

- 监听 `request` / `console` / `pageerror`；1280×800

**操作步骤**：

1. 加载首页，断言 `#app [style]` 计数为 0
2. 开始夜拍并触发倾斜，断言 `--rx` 已写入且无控制台错误
3. 断言所有请求 URL 前缀均为 `http://127.0.0.1:4173/`
4. 扫描 `trigger.css`：纹理令牌为 inline `data:image/svg+xml`、无外部文件引用（png/jpg/svg/字体）

**预期结果**：

- `#app [style]` 计数为 0（模板无内联 `style`）
- 倾斜经 CSSOM 生效且无 CSP 违规控制台错误
- 无任何非 `127.0.0.1:4173` 的请求
- 纹理全部为 inline `data:` URI，无新增外部素材

---

### TC-015 · 结算动画时序近似断言（无卡顿）与结算期间可读性

| 维度 | 内容 |
|---|---|
| **场景** | 1280×800 下整段结算动画无长时间主线程停顿，期间文本保持可读 |

**前置条件**：

- 1280×800；`smoke-0`；在页面内安装 `requestAnimationFrame` 采样器记录逐帧间隔

**操作步骤**：

1. 选三张并“上拍”，同时开始逐帧采样
2. 等待终态 `data-action="next"` 可见，停止采样
3. 统计帧数、最大帧间隔、结算总时长；期间抽样读取 `.played .card` 文本矩形是否完整落在卡牌盒内

**预期结果**：

- 结算总时长在合理上界内（3 步 × ≤440ms 步进 + 余量，取 ≤5s）
- 逐帧最大间隔 ≤250ms（无头环境近似阈值，报告中记录）
- 结算期间卡牌点数/名称/能力文本矩形完整（可读性不受动画影响）

> 说明：本用例为**近似**断言，非帧率保证；阈值与理由在报告中显式记录。

---

### TC-016 · 既有验证通道回归（build / test / test:browser）

| 维度 | 内容 |
|---|---|
| **场景** | 仓库既有验证命令在本次变更后仍通过 |

**前置条件**：

- 干净工作区；`npm ci` 已完成

**操作步骤**：

1. `npm run build`（`tsc --noEmit` + `vite build`）
2. `npm test`（`tsx --test tests/*.test.ts`）
3. `npm run test:browser`（Playwright 默认配置）
4. 若默认配置因本机无 Google Chrome 失败，改用临时配置指向系统 Chromium 运行同一份用例集

**预期结果**：

- `npm run build` 通过
- `npm test` 11/11 通过
- 浏览器用例 10/10 通过（默认配置失败原因须记录为环境限制，不得表述为通过）
- 运行前后 `git status` 中除预期的截图再生成外无其他改动；截图如有差异须记录并复原

---

### TC-017 · 回归红线：规则内核、存档协议、文案与 aria-label 未变

| 维度 | 内容 |
|---|---|
| **场景** | 本次改动未触及规则内核、内容、CSP、存档协议与用户可见文案 |

**前置条件**：

- 工作分支 `feat/ui-3d-card-effect-oysk`，可执行 `git diff`

**操作步骤**：

1. `git diff --stat` 检查 `packages/core/src/trigger.ts`、`packages/content/src/trigger.ts`、`apps/playtest/index.html` 是否被修改
2. 断言存档键 `midnight-hammer:trigger-1` 与协议 `version:'trigger-1'` 仍在源码中且未被修改
3. 规则弹层文案仍含 `18 × 2 = 36`；`.ending` 文案仍含 `收藏，已成连锁。`；`.scoreboard strong` 仍含 `=`；日志区仍为 `aria-live="polite"`
4. 畸形存档注入后出现 `role="alert"` 且首页可用

**预期结果**：

- 上述三个文件在本次变更中未被修改
- 存档键/协议、文案、`aria-live`、`role="alert"` 行为全部保持
- 无新增控制台错误

---

## 执行进度

- [x] 方案校验通过
- [x] 环境启动完成
- [x] TC-001 已实现
- [x] TC-001 目标测试通过
- [x] TC-001 NNA 覆盖
- [x] TC-002 已实现
- [x] TC-002 目标测试通过
- [x] TC-002 NNA 覆盖
- [x] TC-003 已实现
- [x] TC-003 目标测试通过
- [x] TC-003 NNA 覆盖
- [x] TC-004 已实现
- [x] TC-004 目标测试通过
- [x] TC-004 NNA 覆盖
- [x] TC-005 已实现
- [x] TC-005 目标测试通过
- [x] TC-005 NNA 覆盖
- [x] TC-006 已实现
- [x] TC-006 目标测试通过
- [x] TC-006 NNA 覆盖
- [x] TC-007 已实现
- [x] TC-007 目标测试通过
- [x] TC-007 NNA 覆盖
- [x] TC-008 已实现
- [x] TC-008 目标测试通过
- [x] TC-008 NNA 覆盖
- [x] TC-009 已实现
- [x] TC-009 目标测试通过
- [x] TC-009 NNA 覆盖
- [x] TC-010 已实现
- [x] TC-010 目标测试通过
- [x] TC-010 NNA 覆盖
- [x] TC-011 已实现
- [x] TC-011 目标测试通过
- [x] TC-011 NNA 覆盖
- [x] TC-012 已实现
- [x] TC-012 目标测试通过
- [x] TC-012 NNA 覆盖
- [x] TC-013 已实现
- [x] TC-013 目标测试通过
- [x] TC-013 NNA 覆盖
- [x] TC-014 已实现
- [x] TC-014 目标测试通过
- [x] TC-014 NNA 覆盖
- [x] TC-015 已实现
- [x] TC-015 目标测试通过
- [x] TC-015 NNA 覆盖
- [x] TC-016 已实现
- [x] TC-016 目标测试通过
- [x] TC-016 NNA 覆盖
- [x] TC-017 已实现
- [x] TC-017 目标测试通过
- [x] TC-017 NNA 覆盖
- [x] 目标回归通过
- [x] 全量回归通过
- [x] 工程校验通过
- [x] 清理完成

---

## 断言设计

### HTTP 断言

**状态码**：

| 状态码 | 含义 |
|---|---|
| 200 | `GET /`、`GET /trigger.css`、`GET /src/main.ts` 等页面自身资源 |
| 404 | 既有 favicon 请求（基线即存在，非本次引入） |

**响应体**：

- `GET /` 返回的 HTML 必须含 `<div id="app">` 与 `<script type="module" src="/src/main.ts">`
- `GET /` 响应头中的 CSP（`Content-Security-Policy`）必须仍为 `style-src 'self'`、`img-src 'self' data:`（由 `apps/playtest/index.html` 声明，本次不改）

**错误码清单**：

| 错误码 | 说明 |
|---|---|
| 无 | 本功能无业务错误码；页面无 JSON API |

> 说明：本功能唯一 HTTP 入口是页面资源加载；业务断言全部落在浏览器内计算样式/几何/事件副作用上（见 NNA-001~009）。

### 数据库断言

| 表名 | 断言 |
|---|---|
| 不适用 | 本项目无数据库、无 DDL、无迁移；本方案不产生 `fixtures/db/` 资产 |

> 持久化等价断言（以 `localStorage` 替代数据库）：
>
> | 键 | 断言 |
> |---|---|
> | `midnight-hammer:trigger-1` | 开始夜拍后写入；刷新页面后“继续上次收藏”可恢复到同一局面（既有用例覆盖）；畸形值 `{"version":"trigger-1"}` 触发 `role="alert"` 且不崩溃 |

### Redis / MQ / Mock 断言

| 组件 | 断言 |
|---|---|
| Redis | 不适用（无缓存/锁） |
| MQ | 不适用（无消息） |
| Mock（reduced-motion） | `matchMedia('(prefers-reduced-motion: reduce)')` 为真；无 `--rx/--ry` 写入；`.played .card` 计算 `animation-name` 为 `none` |
| Mock（粗指针 `hasTouch`） | `matchMedia('(hover: hover) and (pointer: fine)')` 为假；计算 `transform` 在两个指针位置一致；静态材质分层仍在 |
| Mock（畸形存档注入） | `role="alert"` 出现且首页可操作；无新增控制台错误 |
| Mock（浏览器可执行文件替换） | 用例集合与断言强度与仓库默认配置一致；报告中记录默认配置失败原因 |

### 日志与监控断言

| 日志类型 | 说明 |
|---|---|
| 控制台错误 | 除既有 favicon 404 外，`console` 不得出现 `error`（CSP 违规会以 error 形式出现，必须为空） |
| 页面异常 | `pageerror` 必须为空 |
| 网络请求 | 全部请求 URL 必须落在 `http://127.0.0.1:4173/`（无外部资源） |
| 页面日志区 | `.log` 必须仍为 `aria-live="polite"`，结算逐步流水按揭晓步增长 |
| 游戏内提示 | 畸形存档时出现 `role="alert"` 提示；正常流程无 `.error` 区域 |
