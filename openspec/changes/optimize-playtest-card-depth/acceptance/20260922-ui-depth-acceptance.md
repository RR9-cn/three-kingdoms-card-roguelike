# 验收报告 · UI 质感提升与卡牌 3D 纵深

**结论：有条件通过（PASS WITH CONDITIONS）** — 8 项验收标准全部有本次独立实测证据支持，未发现阻塞缺陷；3 项环境/流程条件与 6 项残余风险见 §5、§6，均不改变功能验收结论。

| 项 | 值 |
|---|---|
| 需求 | 《【UI 优化】提升界面质感并为卡牌加入 3D 效果》 |
| 目标仓库 / 分支 | `RR9-cn/three-kingdoms-card-roguelike` @ `feat/ui-3d-card-effect-oysk` |
| 被验收提交（HEAD） | `8ae54c3b287ba2941ed35403969659247e77ac2d`（`git ls-remote origin feat/ui-3d-card-effect-oysk` 与本地 HEAD 一致） |
| 基线 | `origin/main` = `f5ae6b8` |
| 验收节点 | `workflow-instance-node-yevkjyoi68th91b48qk0`（验收归档） |
| 验收执行时间 | 2026-09-22（UTC） |
| 执行环境 | Linux 容器；Node.js 22.21.0 / npm 10.9.4；Playwright 1.63.0；Chromium 135.0.7049.78（`/opt/chromium.org/chromium/chrome`）；本机**无** Google Chrome |
| 权威依据 | 任务需求（REQ-1/REQ-2 + 9 项验收标准）；Spec 产物 `workflow-node-artifact-yevkotznr4b39mae7i3t`（能力 `playtest-visual-depth`）；需求共识产物 `workflow-node-artifact-yevkl4e39cb39mae7hp5`；改动前截图产物 `workflow-node-artifact-yevkl4nx8gth91b420op` |
| 独立验证脚本 | 本次验收自写的 Playwright 脚本 8 个场景（不依赖节点自带用例），原始数据见 §4 与共享产物 bundle `workflow-node-artifact-yevmcxd91cd4thrjveax`（`verification/independent-*.log`、`verification/playwright-*.log`、`screenshots/after-*.png`） |
| 验收提交说明 | 被验收的交付提交为 `8ae54c3`；本报告随后以纯文档提交 `1c7e7e4` 落入仓库，`git diff 8ae54c3..1c7e7e4 -- apps/ packages/ tests/ docs/evidence/` 为空，产品代码、断言与证据未被任何验收动作改动 |
| Review / 测试证据 | `docs/reviews/20260921_ui-depth-card-3d/report.md`（独立 Code Review，`result: passed`，critical/high = 0）、`openspec/changes/optimize-playtest-card-depth/test/reports/20260922T015056Z-test-report.md`（独立测试，17/17）、`test/test-result.yaml`（`result: passed`） |

---

## 1. 结论摘要

- **需求达成**：REQ-1（视觉质感）与 REQ-2（卡牌 3D）在 `apps/playtest` 展示层实现，规则内核、数值、内容、存档协议与信息架构未受影响（§6 红线全部保持）。
- **验收标准**：9 项（任务清单 8 条 + 需求范围「不改动规则内核」1 条）逐条实测，**已满足 8 项、条件满足 1 项（浏览器通道环境）、未满足 0 项、无法确认 2 项（主观观感、真实触屏硬件）**，见 §3。
- **无阻塞缺陷**：本次验收未发现功能缺陷、未发现与 Spec/需求不符的实现行为。
- **条件**：默认 `npm run test:browser` 在本机无法启动浏览器（缺 Google Chrome），以等价配置完整运行同一用例集；该口径已由节点负责人决策接受（测试报告 §0），本次验收独立复现了两种口径的结果。
- **建议**：可进入发布/合并流程；合并顺序与 OpenSpec 归档动作见 §7。

## 2. 验收范围

| 维度 | 范围 |
|---|---|
| 变更面 | `apps/playtest/public/trigger.css`（+223 行）、`apps/playtest/src/main.ts`（+32/-5）、`tests/browser/trigger.spec.ts`（+334）、`docs/evidence/*`（截图与说明）、`docs/reviews/*`、`openspec/changes/optimize-playtest-card-depth/*` |
| 覆盖区域 | 手牌 `.cards.hand`、槽位 `.slots`、结算牌区 `.cards.played`、战后选牌 `.cards.rewards`、收藏/升级弹层 `.cards.compact`、首页示例 `.home-example`、顶部状态 `.status` 与日志 `.log` |
| 不在本次验收范围 | 规则/数值/内容正确性（`packages/*` 未改动，由既有 11 项单元用例覆盖）；Windows/Steam 原生发布验证（README 明确未完成）；产品信息架构与文案（非目标）；主观审美终审（见 §3 备注） |

## 3. 验收标准逐项结果

| # | 验收项（任务原文口径） | 结论 | 本次实测证据（独立于节点自带用例） |
|---|---|---|---|
| 1 | 1280×800 与 1440×900 下卡牌呈现 3D 倾斜与分层投影，无横向溢出、不遮挡点数/标签/名称/能力文本/升级态信息 | **已满足** | 两视口逐张悬停：`perspective:900px` + `transform-style:preserve-3d` + 卡面 `translateZ(-2px)` / 投影板 `translateZ(-16px)`；`documentElement.scrollWidth - innerWidth = 0`（另验 1000×700 亦为 0）；倾斜态下每张卡的 `b/span/strong/small` 矩形全部落在卡牌盒内（±1px）；截图 `after-hover-1280/1440.png` |
| 2 | 悬停倾斜跟随指针，指针移出 ≤200ms 回静止；单卡倾斜不引起相邻卡牌重排 | **已满足** | 同卡 5 个取样点：左上 `rx 7.15°/ry -6.89°`、右上 `rx 7.15°/ry 6.89°`、中心 `0°/0°`，方向随指针、`|角度| ≤ 8.05°`；计算 `transform` 随指针位置改变（并在 `transform:none` 变异下 **不再改变**，证明该判据非恒真）；指针移出后计算 transform 回到静止值（本次实测 18ms，节点用例实测 160ms，均 ≤200ms）；倾斜期间相邻卡牌相对位置逐字符一致 |
| 3 | 已选卡牌明显 Z 轴抬升 + 阴影变化，3 张可辨且顺序可辨；取消后完全复原 | **已满足** | 选中态 `translateZ = 28px`（静止 0 / 悬停 10px）、`box-shadow` 4 层（含金色描边环）；3 张选中角标「第1/2/3位」与槽位 `01/02/03` 卡名按同索引一致；清空后 `translateZ = 0` 且 `transform`/`box-shadow` 与静止态逐字符一致；截图 `after-selected-1280/1440.png`、仓库 `ui-depth-selected-1280.png` |
| 4 | 结算 3D 过渡与逐步流水同步；1280 下掉帧不影响可读；跳过立即终态；重复结算/连续两轮不残留 | **已满足** | 结算期间以 16ms 采样：`[data-landing]` 数量恒 ≤1（实测最大 1），出现序列 `c4→c1→c6→c1`（末次为连锁重触发步），每次 `data-id` 与 `.log p:last-child` 的卡名一致；动画为 `auction-hammer-fall 0.17s`；终态标记数 0；最大帧间隔 22.3ms（118 帧，阈值 400ms）且逐帧卡面文本矩形始终完整；「跳过动画」点击到 `data-action="next"` 出现 33ms（两次独立实测 33ms / 130ms）；结算中打开/关闭收藏弹层不重放（同时刻标记仍 ≤1） |
| 5 | `prefers-reduced-motion: reduce` 时 3D 倾斜与过渡关闭/降级，功能与信息不丢失 | **已满足** | `reducedMotion:'reduce'` 上下文：悬停后无 `--rx/--ry` 写入、计算 transform 与静止态一致；结算**立即**呈现终态（`data-action="next"` 即刻出现、`[data-landing]=0`、`.played .card` 计算 `animation-name: none`）；卡面点数/标签/名称/能力/标注与 `.log` 4 行、`.scoreboard = 69` 全量保留；截图 `after-reduced-1280.png`。备注：reduced-motion 下选中/悬停**静态** Z 位移仍生效（无过渡、无动画），符合「关闭或降级为无动效」口径，已记录 |
| 6 | 键盘可达性保持：Tab 可达、focus-visible 可见、左右移/移除 aria-label 不变；3D 变换不导致点击热区错位或误触 | **已满足** | Tab 连续可达 6 张手牌且 `:focus-visible = true`、轮廓 `solid 3px rgb(233,185,86)`；`aria-label` 仍为 `<卡名>左移` / `<卡名>右移`（`移除` 按钮文案未变）；倾斜态下卡牌中心点 `elementFromPoint` 命中该卡自身；网格间隙（12px）命中容器 `.cards.hand` 而非任何卡牌 → 投影板未夺取相邻热区 |
| 7 | 不新增外部网络资源，满足现有 CSP（`style-src 'self'`、`img-src 'self' data:`） | **已满足** | 全程 7 个请求全部同源（`http://127.0.0.1:4173`），**非本机请求 0**；`index.html` 与 CSP 元标签逐字节未变（`git diff` 0 行）；模板不产生内联 `style` 属性（未悬停时 `#app [style] = 0`，悬停时 1 = CSSOM 写入）；`:root` 外颜色字面量 0；4 个卡面纹理均为 inline `data:image/svg+xml`；控制台唯一 error 为既有 favicon 404（`index.html` 未改、未引用 favicon，属基线既有）；旁证：`page.addStyleTag` 被 CSP 拒绝，证明内联 `<style>` 不可用而实现走 CSSOM |
| 8 | 仓库既有验证通过：`npm run build`、`npm test`、`npm run test:browser`；受影响截图/断言同步更新并说明 | **条件满足** | `npm ci` 通过；`npm run build` 通过（`dist/assets/index-qK0h60DS.js` 18.57 kB，与测试节点产物同哈希 → 可复现）；`npm test` **11/11**；`npm run test:browser` 默认配置在本机**因缺 Google Chrome 无法启动**（`Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`，10 项用例全部未执行，非断言失败），以等价配置（仅替换浏览器可执行文件）运行完整用例集 **27/27 通过**（既有 3 + 本次新增 7 + 深度用例 14 + 变异探针 3）。该口径已由负责人决策接受。断言与截图在本次变更中同步更新并说明（`tests/browser/trigger.spec.ts` +7 用例、`docs/evidence/UI_DEPTH_V09.md` 对照表与截图差异说明） |
| 9 | 需求范围红线：不改动 `packages/core`、`packages/content` 规则与数值；存档协议 `trigger-1` 与存档键不变 | **已满足** | `packages/core/src/trigger.ts`、`packages/content/src/trigger.ts`、`apps/playtest/index.html`、`playwright.config.ts`、`package.json` 与 `origin/main` **逐字节同哈希**；运行时实测 `localStorage` 仅 `midnight-hammer:trigger-1`（`version: 'trigger-1'`）；`git diff origin/main...HEAD -- packages/` 为空 |

**备注（无法自动确认的项，不计为缺口）**：

- *主观观感（“更值钱/更可信”）*：本次以截图对比 + 客观断言为准（设计决策 D-04/R9）。改动后的卡面确有一致的材质层（纸纹/磨砂/拉丝，4 种 inline 纹理）、统一光源（投影各层位移同向向下：2/14/31px）、暗色色阶与字重节奏；强度按设计决策 D-07/D-08 偏克制，未出现“过度形变”。是否“足够有质感”属人工审美终审，建议由业务负责人在 `docs/evidence/ui-depth-*.png` 对比上确认。
- *真实触屏硬件降级*：以 `hasTouch` 上下文模拟（无倾斜、仍可完整操作），未做真实设备核对（测试报告 R6）。
- *结算“无卡顿”*：以帧间隔近似（最大 22.3ms）与非遮挡可读性为准，非帧率保证（测试报告 R5）。

## 4. 本次独立验证方法与原始数据

方法：将被验收 HEAD 复制到临时目录（`node_modules` 软链），自写 Playwright 脚本直接驱动真实 Chromium 加载真实 Vite 页面；**不使用**节点自带断言作为结论依据，仅在 §3 中作为交叉印证。原始日志见共享产物 `verification/independent-*.log`。

| 场景 | 关键原始数据 |
|---|---|
| 手牌结构 | `.hand .card` = 6；`.hand` 计算 `display: grid`；未悬停时 `#app [style]` = 0 |
| 悬停倾斜（1280） | 卡面 `::before` 纹理 = `data:image/svg+xml…`、混合模式 `soft-light,soft-light,normal`；静止投影 = `0 1px 0 / 0 14.04px / 0 31.39px` 三层同向；右上角 `rx 7.15deg / ry 6.89deg`，左上 `rx 7.15deg / ry -6.89deg`，中心 `0/0`；`|angle| ≤ 8.05°` |
| 恢复静止 | 指针移出后计算 transform 回到静止值：**18ms**（本次脚本）；节点用例逐 20ms 采样：**160ms** |
| 相邻卡牌稳定 | 倾斜前后相邻卡相对 `.hand` 矩形逐字符一致；网格间隙 `elementFromPoint` → `.cards.hand` |
| 溢出矩阵 | 1000×700 / 1280×800 / 1440×900 逐张倾斜（每张 3 个取样点）：`scrollWidth - innerWidth` 最大 **0** |
| 文本不遮挡 | 倾斜态下每张卡 `b/span/strong/small` 矩形均在卡牌盒内（±1px）：`true` |
| 选中 | `translateZ = 28px`、选中数 3、投影 4 层、角标 `牌面点数 · 第1/2/3位`、槽位卡名 `长明烛/鎏金古瓶/裂纹镜`；清空后 `translateZ = 0` 且与静止态逐字符一致 |
| 结算 | `[data-landing]` 最大同时 1；出现序列 `c4→c1→c6→c1`，每次与 `.log p:last-child b` 卡名一致；`animation: auction-hammer-fall 0.17s`；终态标记 0；最大帧间隔 **22.3ms**；跳过 → 终态 **33ms / 130ms**（两次独立实测）；弹层开合不重放 |
| 降级 | reduced-motion：无倾斜变量、transform 同静止、结算即时终态、`animation-name: none`、文本完整；粗指针（hasTouch）：无倾斜变量、点击选中仍生效 |
| 键盘 | Tab 依次到达 6 张手牌，`:focus-visible = true`、轮廓 `solid 3px rgb(233,185,86)`；`aria-label` = `长明烛左移/长明烛右移` 等不变 |
| 契约扫描 | `:root` 外颜色字面量 0；`url()` 非 `data:` 引用 0；`data:image/svg+xml` 纹理 4；`main.ts` 中 `style="` 0 处；非本机请求 0；仅 1 条既有 favicon 404 |
| 变异对照（证明本报告判据非恒真） | 正常：两个指针位置计算 transform **不同**；注入 `.hand .card{transform:none!important}`（经 CSSOM `insertRule`，因 CSP 拒绝 `addStyleTag`）后：**相同** → 判据有效 |

## 5. 条件、缺口与风险

**无未满足项，无阻塞项。** 以下为条件与残余风险（均已记录，不改变功能验收结论）：

| ID | 类型 | 内容 | 影响 | 严重度 | 建议责任方 | 下一步动作 |
|---|---|---|---|---|---|---|
| G1 | 环境（已决策接受） | 仓库默认 `npm run test:browser` 使用 `channel:'chrome'`，本机无 Google Chrome 且无 root 无法安装 → 该命令在本机恒失败（`main` 基线同样如此，`playwright.config.ts` 未变） | 默认命令无法在本机复现；已用等价配置跑完整用例集（27/27） | 低 | 环境/集成 | 在具备 Google Chrome 的验收或 CI 环境复跑一次默认命令；如需长期收口，另行评审“浏览器通道可覆盖”的配置改动（**本次未改仓库配置**） |
| G2 | 环境 | Node.js 22.21.0 低于 README 要求的 Node 24 | 现有全部命令通过；未覆盖 Node 24 专属行为 | 低 | 环境 | 在 Node 24 环境复跑 `npm ci && npm run build && npm test` |
| G3 | 文档一致性 | 投影板 `--auction-shadow-plane-inset:4% 4% -9%` 使投影下沿超出卡牌盒高度 9%（≈22px），与 `tasks.md` 2.3「不超出卡牌盒」**字面**不符 | 无功能影响：投影板 `pointer-events:none`、左右不侵入 12px 网格间隙（实测间隙命中容器而非卡牌）、单行网格纵向外扩落在空白；弹层 22px < 30px 内边距未见裁切 | 低 | Spec / 编码 | 合并前收敛措辞（把该条表述为「不超出卡牌盒水平边界且不夺取热区」）或调整取值；已在 `docs/evidence/UI_DEPTH_V09.md` 与测试报告 R3 记录 |
| G4 | 合并风险 | 并行分支 `optimize/product-ui-kkrx`（`optimize-playtest-ui-consistency`）重写同一份 `trigger.css`，其不变量含 `--auction-*` 令牌层、`:root` 外零颜色字面量、`.card small` ≥12px 与对比度 ≥4.5:1、`aria-pressed`、弹层 `role="dialog"`/焦点管理、700px 无溢出 | 合并顺序未定；若合并后语义被改写可能使其断言失败 | 中 | 集成 / 编码 | 先落地其一再 rebase 另一方；合并后**双方**用例集各复跑一次（本次改动已遵守其令牌化与“不改卡面端点色/字号/语义”约定：`:root` 外 0 处颜色字面量、`.card small` 仍 10px、`.card` 仍为语义化 `<button>`） |
| G5 | 证据可靠性 | `docs/evidence/*.png` 在重跑时字节不可复现（悬停/投影过渡时序噪声） | 截图仅作人工核对证据，不作像素级回归基线 | 低 | 编码 / 测试 | 已由负责人决策“不更新截图”；如需像素回归，另立变更固定动画时序或改用裁剪级截图 |
| G6 | 覆盖边界 | 无像素基线；材质“观感”未自动评分；结算“无卡顿”为近似断言；粗指针以 `hasTouch` 模拟 | 结论边界已声明 | 低 | 测试 | 需要更强结论时补真实桌面/触屏人工核对 |

## 6. 红线核对（回归契约）

| 红线 | 结果 | 证据 |
|---|---|---|
| `.hand` 仍 `display: grid`、6 张可点击卡牌按钮 | 保持 | 独立实测 + 节点用例 |
| `data-action` / `data-id` / `data-kind` / `data-bonus`、结算牌 `tabindex="-1"` | 保持 | 独立实测 `elementFromPoint`/DOM 查询 + 节点用例 A8/C2 |
| 按钮文案与交互顺序未增删改序 | 保持 | 节点用例（`开始新夜拍`/`上拍 · 按此顺序`/`跳过动画`/`下一轮` 等全流程可走通） |
| `aria-label`（`<卡名>左移` / `<卡名>右移` / `移除`） | 保持 | 独立实测 |
| `.scoreboard strong` 含 `=`、规则弹层含 `18 × 2 = 36`、`.ending` 含 `收藏，已成连锁。` | 保持 | 独立实测 `= 69`；节点用例 TC-017 |
| `:focus-visible`、`aria-live` 日志区、`role="alert"` 错误区 | 保持 | 独立实测 |
| 存档键与协议 `midnight-hammer:trigger-1` / `trigger-1` | 保持 | 运行时实测 + `packages/*` 逐字节未变 |
| 无新增依赖、无外部网络资源、无内联 `style` 属性 | 保持 | `package.json`/`package-lock.json` 未变（同哈希）；请求全同源；`#app [style]` 未悬停时为 0 |

## 7. 归档清单与后续动作

**归档清单**

- 被验收提交：`8ae54c3`（分支 `feat/ui-3d-card-effect-oysk`，远端可见）；实现提交 `e47c8e4`；证据提交 `4e51a90`/`d8a351d`；Review 提交 `dc12da5`/`a494758`；测试提交 `969ddc4`/`b22ae4e`/`8ae54c3`。
- Spec 与设计：`openspec/changes/optimize-playtest-card-depth/{proposal,design,tasks}.md`、`specs/playtest-visual-depth/spec.md`（共享产物 `workflow-node-artifact-yevkotznr4b39mae7i3t`）。
- 视觉证据：`docs/evidence/UI_DEPTH_V09.md`、`ui-depth-{before,hover,selected,settlement,reduced,collection}-*.png`；被用例自动覆盖并说明的 `trigger-battle/reward/victory.png`。
- 测试资产与报告：`openspec/changes/optimize-playtest-card-depth/test/`（测试方案、`depth-ui.spec.ts` 14 项、`mutation-probe.spec.ts` 3 项、Playwright JSON 报告、12 张状态/变异截图、`test-result.yaml`）。
- 代码评审：`docs/reviews/20260921_ui-depth-card-3d/{report.md,result.yaml}`。
- 本验收报告与其独立验证证据：`openspec/changes/optimize-playtest-card-depth/acceptance/20260922-ui-depth-acceptance.md` + 共享产物 bundle `workflow-node-artifact-yevmcxd91cd4thrjveax`（独立脚本原始日志、等价/默认配置运行日志、本次独立截图 8 张）。

**建议后续动作**

1. **发布/合并**：本次交付达到可发布状态（有条件通过，条件见 §5）；建议先与 `optimize/product-ui-kkrx` 商定合并顺序，合并后复跑两边用例集。
2. **OpenSpec 归档**：本次验收**未**擅自移动 `openspec/changes/optimize-playtest-card-depth/` 到 `archive/`、也未把 `playtest-visual-depth` 写入 `openspec/specs/`（该归档动作与“合并到 main”同步执行更安全，且并行分支也在改同一批规格）。建议在合并到 `main` 时一并执行归档。
3. **环境收口**：在具备 Google Chrome 与 Node 24 的环境复跑 `npm run test:browser` 与 `npm test`（G1/G2）。
4. **文本收敛**：按 G3 收敛 `tasks.md` 2.3 的表述或投影取值。
5. **留观项**：若业务认为质感强度不足，应作为**新变更**提出（本次按 D-07/D-08 的量级边界交付，无过度形变、无外部素材依赖）。

---

**验收判定：有条件通过**。条件为环境（G1/G2）与流程（G4）项，均不涉及本次交付的功能、验收标准与红线；未满足项 0、阻塞项 0。
