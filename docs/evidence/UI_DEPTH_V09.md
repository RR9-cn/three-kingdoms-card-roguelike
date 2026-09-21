# v0.9 界面质感与卡牌 3D 纵深验证

对应 OpenSpec 变更 `optimize-playtest-card-depth`（能力 `playtest-visual-depth`）。本文件记录改动前基线与改动后验收对照。改动前基线提交于 Spec 阶段；改动后章节由编码节点（工作分支 `feat/ui-3d-card-effect-oysk`）补齐，未实际完成项保持未勾选。

## 改动前基线（提交于 Spec 阶段）

- 仓库基线：`main@f5ae6b8`（工作分支 `feat/ui-3d-card-effect-oysk`）。
- 环境：Chromium 135.0.7049.78；Node.js 22.21.0（低于 README 要求的 24）；npm 10.9.4。
- 截图（1280×800 与 1440×900，含 2 张已选牌与 3 个槽位）：
  - `docs/evidence/ui-depth-before-1280.png`
  - `docs/evidence/ui-depth-before-1440.png`

改动前特征：卡牌为平面渐变 + 单层投影，仅 `translateY(-4px)` 悬浮；无透视、厚度、材质与统一光源；卡牌变体主要靠色相区分。

### 基线验证结果（本机实测）

| 命令 | 结果 |
|---|---|
| `npm ci` | 通过 |
| `npm run build`（`tsc --noEmit` + `vite build`） | 通过（`dist/assets/index-*.js` 16.80 kB） |
| `npm test` | 11/11 通过 |
| `npm run test:browser` | 仓库默认配置因 `channel:'chrome'` 且本机无 Chrome 失败；改用临时配置（`launchOptions.executablePath` 指向 `/opt/chromium.org/chromium/chromium-browser`）后 3/3 通过 |

### 技术探针结论（影响实现路径）

| 结论 | 说明 |
|---|---|
| `<button>` 上 `preserve-3d` 生效 | 带 `translateZ(-40px)` 的投影板宽 102.76 → 98.56、left 15.55 → 5.94，卡牌无需包裹层 |
| 祖先 `overflow:auto` 不阻断卡牌自身分层 | 滚动容器内与无滚动容器内投影板矩形一致（98.56/14.78/left 15.94），仅存在边界裁切风险 |
| CSP 拦截内联 `style` 属性、放行 CSSOM | 内联 `style` 被拒并产生控制台错误；`element.style.setProperty('--rx','8deg')` 生效 |
| 投影板参与命中测试 | `elementFromPoint` 命中投影板，故投影板必须 `pointer-events: none` |
| 基线控制台 | 存在 1 条既有 404（favicon），非本次引入；CSP 违规以控制台 error 出现而非 `pageerror` |

### 改动后证据清单（编码节点，见下方「改动后」章节）

- [x] 提交 1280×800 与 1440×900 的悬停倾斜、选中抬升、结算落槌、reduced-motion 状态截图
- [x] 更新被浏览器用例自动覆盖的既有截图（`trigger-battle.png`、`trigger-reward.png`、`trigger-victory.png`），并说明差异
- [x] 填写下方对照表

## 改动后（编码节点，工作分支 `feat/ui-3d-card-effect-oysk`）

实现提交：`e47c8e4` — `feat(playtest): layered card material and CSS-3D depth`（基线 `a6ec99a`，工作分支 `feat/ui-3d-card-effect-oysk`）。改动面仅 `apps/playtest` 展示层、浏览器断言与证据截图。

### 实现摘要

| 区域 | 改动 |
|---|---|
| `:root` 令牌层 | 新增 93 个 `--auction-*` 令牌：页面色阶与字重节奏、统一光源方向、4 个 inline `data:image/svg+xml` 卡面纹理、三变体内描边/边宽/投影、3D 参数、落槌时序。`:root` 之外颜色字面量 **0** 处 |
| 卡牌材质 | 卡牌自身 `background: transparent`；材质层落在 `::before`（`translateZ(-2px)`，纸纹/磨砂/拉丝 + 随 `--mx/--my` 位移的高光 + 内描边），投影板落在 `::after`（`translateZ(-16px)`、`pointer-events:none`、`inset` 不超出卡牌盒） |
| 3D 纵深 | 卡牌自身声明 `perspective:900px` 与 `transform-style:preserve-3d`，统一变换为 `perspective(...) translateZ(var(--tz)) rotateX(var(--rx)) rotateY(var(--ry))`，替换原 `translateY(-4px)` / `translateY(-5px)`；无新增包裹层 |
| 指针倾斜 | `main.ts` 在 `#app` 上委托 `pointermove` / `pointerleave`，rAF 合帧后以 CSSOM `setProperty` 写入 `--rx/--ry/--mx/--my`；仅 `(hover:hover) and (pointer:fine)` 且非 reduced-motion 时挂载；角度上限 8°（读自 `--auction-tilt-max`），静止矩形缓存于滚动/缩放/渲染重建后失效 |
| 选中抬升 | `--tz: 28px` + 三层同向投影 + 金色描边环；既有"第 N 位"标注加同色角标，与槽位 `01/02/03` 同索引对应 |
| 落槌过渡 | `@keyframes auction-hammer-fall`（沿 Z 压落 + 回弹，170ms）与 `auction-hammer-shadow`（投影收紧再扩散）；由 `data-landing` 触发，只作用于 `result.steps[shown-1].id`，牌面全程正向、不翻面、无牌背 |
| 降级 | `@media(prefers-reduced-motion:reduce)` 追加 `.card{--rx:0deg!important;--ry:0deg!important}`；指针钩子在 reduced-motion 下不挂载；信息与控制全保留 |

### 实测关键技术坑

| 现象 | 处理 |
|---|---|
| Chromium 把**正 Z** 的伪元素绘制在卡牌文本之上，材质层会盖住点数/名称/能力文本 | 材质层必须落在文本之后（负 Z）；同时卡牌自身 `background` 与 `.card:hover` 的 `background` 显式保持 `transparent`，否则通用 `button:hover` 底色会盖住材质层 |
| 3D 变换后卡牌的命中矩形随变换位移，指针停在卡角会反复进出产生抖动 | 停留判定使用**静止矩形**（`inTiltRect`），并补 `pointerleave` / 无 `relatedTarget` 的 `pointerout` 清理 |
| 令牌自查发现 1 处未定义引用与 1 处冗余字面量 | 补 `--auction-home-bg`；`--auction-vignette` 改用 `--auction-floor` |

### 截图

新增（1280×800 与 1440×900）：

- `docs/evidence/ui-depth-hover-1280.png` — 悬停倾斜：第 2 张倾斜、其余静止，相邻卡牌未重排
- `docs/evidence/ui-depth-hover-1440.png` — 1440 悬停 + 3 张已选抬升与顺序角标
- `docs/evidence/ui-depth-selected-1280.png` — 3 张已选：Z 轴抬升、更强投影、"第 1/2/3 位"角标
- `docs/evidence/ui-depth-settlement-1280.png` — 结算第 3 步落槌：同一时刻只有当前揭晓步的卡牌带过渡
- `docs/evidence/ui-depth-reduced-1280.png` — `prefers-reduced-motion: reduce`：无倾斜、无过渡、信息完整

被浏览器用例自动覆盖更新的既有截图（用例、取景与状态节点均未改动，仅呈现变化）：

- `docs/evidence/trigger-battle.png`、`trigger-reward.png`、`trigger-victory.png` — 仍取自原有用例的同一状态（正常三场通关流程中的战斗界面 / 战后选牌 / 通关结算），差异仅为新增的卡面材质、分层投影与统一暗色色阶。按 Spec「Verification stays green」条款在本次变更中同步更新，未放宽任何断言。

### 验证命令与结果（本机实测）

| 命令 | 结果 |
|---|---|
| `npm ci` | 通过（79 个包） |
| `npm run build`（`tsc --noEmit` + `vite build`） | 通过（`dist/assets/index-qK0h60DS.js` 18.57 kB，gzip 8.24 kB） |
| `npm test` | **11/11 通过** |
| `npm run test:browser`（仓库默认配置） | 失败：`Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`——既有环境限制（设计风险 R7），与本变更无关，未改仓库配置 |
| `npx playwright test --config=<临时配置>`（`launchOptions.executablePath` 指向 `/opt/chromium.org/chromium/chromium-browser`） | **9/9 通过**（既有 3 项 + 本次新增 6 项） |
| 静态自查 | `:root` 外颜色字面量 0；`--auction-*` 无未定义引用；`apps/playtest` 无内联 `style=`；无新增外部 URL 引用；CSS 花括号配对 |

环境：Chromium 135.0.7049.78；Node.js 22.21.0（低于 README 要求的 24）；npm 10.9.4。

## 验收对照表

| 验收项 | 改动前 | 改动后 | 证据 |
|---|---|---|---|
| 3D 倾斜与分层投影（1280/1440） | 无 | 通过：卡牌自带 `perspective:900px` + `preserve-3d`，卡面 `translateZ(-2px)`、投影板 `translateZ(-16px)`，三层同向投影 | 用例 4 + `ui-depth-hover-1280/1440.png` |
| 悬停跟随指针、移出 ≤200ms 复原、相邻卡牌不重排 | 无 | 通过：`--rx/--ry` 随指针变化且 `≤8°`，移出后清除变量并在既有 `transition: transform .15s` 内复原；相邻卡牌 `getBoundingClientRect()` 前后完全一致 | 用例 4 |
| 选中 Z 轴抬升与 3 张顺序可辨、取消后复原 | 仅 `translateY(-5px)` | 通过：`translateZ(28px)` 且投影含金色描边环；三张同选时"第 1/2/3 位"角标与槽位 `01/02/03` 同索引；清空后 `translateZ` 与 `box-shadow` 与静止态逐字符一致 | 用例 5 + `ui-depth-selected-1280.png` |
| 结算落槌过渡与步进同步、跳过立即终态、无残留 | 无 3D 过渡 | 通过：MutationObserver 记录每次 `[data-landing]` 出现时数量恒为 1 且指向当前揭晓步；终态与新一次结算起始标记数均为 0；"跳过动画"立即出现 `data-action="next"` | 用例 6 + `ui-depth-settlement-1280.png` |
| `prefers-reduced-motion: reduce` 降级 | 仅关闭过渡，未关闭 transform | 通过：指针钩子不挂载、无倾斜变量、`.played .card` 计算 `animation-name` 为 `none`、结算直接终态、点数/名称/能力文本齐全 | 用例 7 + `ui-depth-reduced-1280.png` |
| 粗指针 / 无 hover 降级 | 无倾斜（本就无 3D） | 通过：`hasTouch` 上下文下 `(hover:hover) and (pointer:fine)` 为 false，卡牌在两个指针位置的计算 `transform` 完全一致且无倾斜变量；静态材质分层仍在；选择、排序、上拍、跳过全部可用并到达终态 | 用例 9 |
| 键盘可达性与点击热区 | 通过 | 通过：`.hand .card` 6 张全部 Tab 可达且 `:focus-visible` 为 `solid` 轮廓；`aria-label`（左移/右移/移除）不变；变换后卡牌中心点命中自身 | 用例 8 |
| 无横向溢出（1000/1280/1440，另加验 700×800） | 1280 基线 `scrollWidth == innerWidth` | 通过：四个视口在倾斜 + 三张已选状态下 `scrollWidth ≤ innerWidth` | 用例 4 |
| 无新增外部资源、满足 CSP | 通过 | 通过：`:root` 外颜色字面量 0、纹理为 inline `data:` URI、`#app [style]` 计数 0、无新增控制台错误、请求全部落在 `http://127.0.0.1:4173/` | 用例 4/8 |
| 既有验证（build/test/test:browser） | 11/11、3/3 | 通过：`build` 通过、`npm test` 11/11、浏览器用例 9/9（默认配置受本机无 Chrome 限制，见 R7） | 命令输出 |
