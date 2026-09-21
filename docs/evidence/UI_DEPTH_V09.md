# v0.9 界面质感与卡牌 3D 纵深验证

对应 OpenSpec 变更 `optimize-playtest-card-depth`（能力 `playtest-visual-depth`）。本文件记录改动前基线与验收对照；**改动后章节与截图由编码节点补齐，未完成项保持未勾选**。

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

## 改动后（待编码节点完成）

- [ ] 提交 1280×800 与 1440×900 的悬停倾斜、选中抬升、结算落槌、reduced-motion 状态截图
- [ ] 更新被浏览器用例自动覆盖的既有截图（`trigger-battle.png`、`trigger-reward.png`、`trigger-victory.png`），并说明差异
- [ ] 填写下方对照表

## 验收对照表

| 验收项 | 改动前 | 改动后 | 证据 |
|---|---|---|---|
| 3D 倾斜与分层投影（1280/1440） | 无 | 待填 | 截图 + 断言 |
| 悬停跟随指针、移出 ≤200ms 复原、相邻卡牌不重排 | 无 | 待填 | 断言 |
| 选中 Z 轴抬升与 3 张顺序可辨、取消后复原 | 仅 `translateY(-5px)` | 待填 | 断言 + 截图 |
| 结算落槌过渡与步进同步、跳过立即终态、无残留 | 无 3D 过渡 | 待填 | 断言 |
| `prefers-reduced-motion: reduce` 降级 | 仅关闭过渡，未关闭 transform | 待填 | 断言 |
| 键盘可达性与点击热区 | 通过 | 待填 | 断言 |
| 无横向溢出（1000/1280/1440） | 1280 基线 `scrollWidth == innerWidth` | 待填 | 断言 |
| 无新增外部资源、满足 CSP | 通过 | 待填 | 静态断言 + 控制台 |
| 既有验证（build/test/test:browser） | 11/11、3/3 | 待填 | 命令输出 |
