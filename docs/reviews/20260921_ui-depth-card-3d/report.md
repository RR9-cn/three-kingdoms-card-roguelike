# Code Review Report

**时间**：2026-09-21 14:05:00 UTC
**分支**：`feat/ui-3d-card-effect-oysk` vs `origin/main`
**diff 命令**：`git diff origin/main...HEAD`
**commit 列表**：`origin/main(f5ae6b8)..HEAD(4e51a90)`
- `a6ec99a` docs: spec playtest card depth and material presentation
- `e47c8e4` feat(playtest): layered card material and CSS-3D depth
- `4e51a90` docs(evidence): record v0.9 depth verification and tick tasks

**改动文件数**：19（其中二进制截图 8 个、文档 5 个、代码/断言 3 个）
**改动行数**：+1130 / -5（文本）
**Spec 来源**：`openspec/changes/optimize-playtest-card-depth/specs/playtest-visual-depth/spec.md`（能力 `playtest-visual-depth`；由 AI-Spec 节点产出并经控制面登记为产物 `workflow-node-artifact-yevkotznr4b39mae7i3t`，视为权威 Spec；配套 `proposal.md` / `design.md` / `tasks.md` 同目录）
**规范来源**：`references/business-code-review-rules.md`（本仓库无 REF-1 `docs/code-review-risk-patterns.md`、无 REF-2 `docs/coding-standards/`，使用内置风险框架；无 Java 改动，未加载 REF-G）
**启动 Reviewer**：BusinessCode

**生命周期登记**：本环境无 `fshows` CLI，不存在 Lifecycle 上下文，故按只读 Review 流程输出兼容报告，**未登记任何生命周期门禁**（未执行 `lifecycle artifact start/complete`，未创建或修改 `lifecycle.yaml`）。

---

## 分诊清单

| # | 文件 | 风险等级 | 所属轴 | 疑似问题 |
|---|------|---------|--------|----------|
| 1 | `apps/playtest/public/trigger.css` | MEDIUM | Both | 一次性重写整份样式表（+223 行）：令牌层、材质伪元素、3D 变换、落槌关键帧、reduced-motion 分支；需核对是否引入 `:root` 外颜色字面量、是否改变既有端点色/字号、是否削弱可读性 |
| 2 | `apps/playtest/src/main.ts` | MEDIUM | Both | 新增指针事件委托与一次性落槌标记；需核对事件契约、降级路径、渲染后清理、无内联 `style`、无文案/`aria-label` 变更 |
| 3 | `tests/browser/trigger.spec.ts` | LOW | Spec | 新增 6 项断言；需核对是否放宽或改写了既有 3 项断言 |
| 4 | `docs/evidence/UI_DEPTH_V09.md` | LOW | Spec | 证据文档与验收对照表是否与实现一致 |
| 5 | `openspec/changes/optimize-playtest-card-depth/tasks.md` | LOW | Spec | 勾选项是否与实现一致（7.3 未勾选） |
| 6 | `docs/evidence/*.png`（8 个） | LOW | — | 截图基线更新，非本次代码风险 |

> 所属轴：Standards（规范违反）/ Spec（需求偏离）/ Both（两轴都涉及）

---

## Reviewer Matrix

| Reviewer | 是否启动 | 覆盖范围 | 触发原因 | 审查模板 |
|----------|----------|----------|----------|----------|
| Data | 否 | — | diff 内无 DDL/DML、无 `*Mapper.xml`、无实体字段、无索引/事务/迁移改动；存档协议 `trigger-1` 与存档键未改（`git diff origin/main...HEAD -- packages/` 为空） | `references/data-review-rules.md` |
| BusinessCode | 是 | `apps/playtest/public/trigger.css`、`apps/playtest/src/main.ts`、`tests/browser/trigger.spec.ts`（+ Spec/证据文档对照） | 展示层业务链路、状态机（结算步进/终态）、降级路径、CSP 与可访问性契约、Spec 语义 | `references/business-code-review-rules.md` |

---

## 专家审查原始发现

### Data Reviewer

未启动：无数据层改动（见 Reviewer Matrix）。

### Business Code Reviewer（第 1 轮，reviewedHead `4e51a90`）

```yaml
- reviewer: BusinessCode
  file: apps/playtest/src/main.ts
  line: 51
  axis: Spec
  severity: LOW
  type: judgement call
  evidence: "倾斜经 el.style.setProperty 写 --rx/--ry/--mx/--my，元素 DOM 会实际挂上 style 属性；而 spec.md:145/155 要求 MUST NOT add an HTML inline style attribute / no inline style attribute is used。design E3/D-03 明确以 CSSOM 规避 CSP，属已记录取舍，测试仅在倾斜前查 #app [style]。"
  reference: "spec.md:145,155；design.md D-03/E3"
  recommendation: "在 spec 澄清该条款仅指模板标记，或让断言覆盖倾斜后路径。"
  confidence: medium
- reviewer: BusinessCode
  file: tests/browser/trigger.spec.ts
  line: 92
  axis: Spec
  severity: LOW
  type: partial implementation
  evidence: "视口循环只断言 documentElement.scrollWidth<=innerWidth，未断言 spec.md:50 要求的「点数/标签/名称/能力/升级标注未被遮挡」，与注释声称覆盖遮挡不符。"
  reference: "spec.md:50"
  recommendation: "补一条遮挡/命中断言（如 elementFromPoint 或文本对比）。"
  confidence: medium
- reviewer: BusinessCode
  file: apps/playtest/public/trigger.css
  line: 190
  axis: Spec
  severity: LOW
  type: scope creep
  evidence: "新增 .log p border-left、.scoreboard strong text-shadow、.slot small letter-spacing/字重、.eyebrow/.status strong 字重、font-variant-numeric 等非卡面样式；spec.md 六条 Requirement 只约束卡面材质/3D/令牌/契约，未要求这些表面。"
  reference: "spec.md:4-170；tasks.md:1.4"
  recommendation: "收敛到卡面相关规则，或在 spec 登记该色阶/字重范围。"
  confidence: low
```

该 Reviewer 同时核实无问题：① `:root` 外颜色字面量为空、无外部 URL、卡面渐变端点色/文本色/`.card small` 10px 未变；② 材质层为负 Z，确在文本之后，角度 ≤8°、无横向溢出；③ 指针钩子单次注册、`isConnected` 校验、≤150ms 复原、不重排相邻卡；④ `data-landing` 仅落 `steps[shown-1].id`，跳过/恢复/reduced-motion 均不带标记，`armLanding` 的 `setTimeout` 捕获旧节点，重建后不会误摘新标记；⑤ reduced-motion 以 `!important` 关 `--rx/--ry` 且 `finePointer()` 为假；⑥ 既有契约（文案/`aria-label`/grid/6 button/`data-*`/`tabindex=-1`/`aria-live`/`role=alert`/`:focus-visible`）保持；⑦ 既有 3 个用例仅 import 行变更，未放宽。

### Business Code Reviewer（第 2 轮，reviewedHead `d8a351d`，仅审增量）

已核实 `git diff 4e51a90...d8a351d -- apps/` 为空（无产品代码改动），增量仅测试断言、证据文档与重生成截图。

- 增量新问题：新增两条断言均非恒真（文本包含断言可因负 margin/绝对定位溢出而失败；CSSOM 倾斜断言依赖真实写入 `--rx` 且 `errors` 为空，可捕获 CSP 违规）。未见新 Critical/HIGH。
- 裁决：CR-SPEC-001 确认 FALSE_POSITIVE；CR-SPEC-002 确认已修复；CR-SPEC-003 确认 FALSE_POSITIVE（附注）。
- 结论：仍无 Critical/HIGH、无 NEEDS_DISCUSSION。

### Business Code Reviewer（第 3 轮，reviewedHead `273e2f5`，仅审增量）

增量：新增收藏弹层用例 + 截图 + 证据文档（`git diff d8a351d...273e2f5 -- apps/` 为空）。

```yaml
- reviewer: BusinessCode
  file: tests/browser/trigger.spec.ts
  line: 293
  axis: Spec
  severity: MEDIUM
  type: wrong implementation
  evidence: "注释与证据文档称『投影板不超出卡牌盒』『未被滚动容器裁切』，但断言只校验 pointerEvents；left/right 取值后从未断言。"
  reference: "design.md R13/D-11；spec.md:50,126"
  recommendation: "断言投影板矩形与卡牌盒关系并覆盖底行；或修正令牌/证据文档措辞。"
  confidence: high
- reviewer: BusinessCode
  file: tests/browser/trigger.spec.ts
  line: 294
  axis: Spec
  severity: LOW
  type: partial implementation
  evidence: "用例名/注释称『inside its scroll container』，但 1280×800 下 .modal scrollH==clientH==656，弹层并未滚动，滚动容器场景未被真正触发。"
  reference: "spec.md:50；design.md R13"
  recommendation: "增补 .modal scrollHeight>clientHeight 后再验裁切，或删去『滚动容器』措辞。"
  confidence: high
- reviewer: BusinessCode
  file: tests/browser/trigger.spec.ts
  line: 297
  axis: Spec
  severity: LOW
  type: judgement call
  evidence: "命中断言取卡牌自身中心；伪元素命中测试返回宿主元素，故 ::after 即使 pointer-events 非 none 也无法被该断言发现。"
  reference: "tasks.md 2.3"
  recommendation: "改为对相邻卡牌中心做 elementFromPoint 断言。"
  confidence: medium
```

### Business Code Reviewer（第 4 轮，reviewedHead `444ed7a`，仅审增量）

增量：改写断言与证据文档（`git diff 273e2f5...444ed7a -- apps/` 为空）。

**该轮 Reviewer 撤回第 3 轮 MEDIUM 的裁切前提**：其第 3 轮用 `.modal` 的**内容盒**下沿（699）作为 `overflow:auto` 的裁切边，主 Agent 实测指出裁切边应为**padding 盒**（728）；Reviewer 用像素法独立复核后确认「内容盒 699 至 padding 盒 728 之间确有投影板像素」，撤回「被裁切 21px」的结论。

```yaml
- reviewer: BusinessCode
  file: tests/browser/trigger.spec.ts
  line: 305
  axis: Spec
  severity: LOW
  type: partial implementation
  evidence: "间隙命中断言取样点 y=a.top+8，而投影板上沿 inset≈9.22px，该点不在投影板内；注入 4% -20% -9% + pointer-events:auto 后该断言仍通过。真正保障来自已单独断言的 pointer-events:none。"
  reference: "tasks.md 2.3"
  recommendation: "取样点改到投影板纵向覆盖范围（如卡高中部），或恢复对相邻卡牌中心的命中断言；并修正因果表述。"
  confidence: high
- reviewer: BusinessCode
  file: tests/browser/trigger.spec.ts
  line: 289
  axis: Standards
  severity: LOW
  type: judgement call
  evidence: "clipBottom 用 borderTopWidth 近似 padding 盒下沿（应为 borderBottomWidth）；末段 `v.length===3?v[2]:v[2]` 为死三元。"
  reference: "none"
  recommendation: "改用 borderBottomWidth 并去掉死三元；纯整洁性，不阻塞。"
  confidence: high
```

### Business Code Reviewer（第 5 轮，reviewedHead `b1335fe`，仅审增量）

增量：间隙取样点移至卡高中部并提前执行、补相邻卡牌命中断言、整洁性修正（`git diff 444ed7a...b1335fe -- apps/` 为空）。前两项确认闭环。

```yaml
- reviewer: BusinessCode
  file: tests/browser/trigger.spec.ts
  line: 335
  axis: Spec
  severity: LOW
  type: wrong implementation
  evidence: "`shadowBottom:r.bottom+b` 符号写反（inset 下沿 b 为负，正确为 r.bottom-b）；把外扩放大到 -300% 时该断言仍通过，即无法失败；与同文件 `bottom-insetBottom` 写法不一致。"
  reference: "design.md R13；tasks.md 2.3"
  recommendation: "改为 r.bottom-b，并复核滚动到底状态；现有循环断言已覆盖未滚动状态，故不阻塞合入。"
  confidence: high
```

### Business Code Reviewer（第 6 轮，reviewedHead `f30be96`，仅审增量）

增量：符号修正 + 补滚动态断言（`git diff b1335fe...f30be96 -- apps/` 为空）。Reviewer 独立复现：滚动到底 `cardBottom 501.375 ≤ clip 531`、`shadowBottom 523.375 < 531`；`scrollTop=0` 时两条断言均失败，证明新断言真正依赖滚动状态、非恒真；`inset` 下沿 `-300%` 时投影板断言失败，恒真问题消除。

**结论：该 LOW 已闭环；仍无 Critical/HIGH、无 NEEDS_DISCUSSION；可以合入。** 非阻塞建议：把 `:334/:336` 的裁切边计算抽成共享 helper，避免同类符号错误再现（已登记为遗留建议项）。

---

## Standards 轴审查结果

> 由主 Agent 从专家 reviewer 原始发现中归并去重后产出。逐文件/hunk 报告每处违反已文档化规范的改动，引用规范出处，区分硬违反（hard violation）与判断题（judgement call），跳过工具已强制的项。

### [LOW] tests/browser/trigger.spec.ts:289 — 裁切边计算用了 `borderTopWidth`，并存在死三元

- **Finding ID**：CR-STD-001
- **来源 Reviewer**：BusinessCode（第 4 轮）
- **疑似问题**：`clipBottom` 以 `borderTopWidth` 近似 padding 盒下沿（1px 均匀边框下等价，但语义错位）；末段 `v.length===3?v[2]:v[2]` 为死三元。
- **规范出处**：none（项目本地 REF-2 不存在，按内置整洁性判断）
- **违反类型**：judgement call
- **状态**：CONFIRMED（已在 `b1335fe` 修复：改用 `borderBottomWidth`、去掉死三元）
- **说明**：Reviewer 明确标注「纯整洁性，不阻塞」。

其余自查（无发现）：

- 项目本地规范：REF-1（`docs/code-review-risk-patterns.md`）与 REF-2（`docs/coding-standards/`）在本仓库**不存在**，故按内置风险框架判断；本次改动无 Java、无数据层、无 RPC/MQ/Redis/鉴权，内置框架中的高风险分类均未命中。
- 仓库约定 `AGENTS.md`：逐条自查无违反——规则内核（`packages/*`）未引用 DOM 且未改动；未写入凭据/令牌；未完成的任务保持未勾选（`tasks.md` 7.3 在推送确认后才勾选）；未把单元测试表述为 Windows 原生或 Steam 发布验证。
- Standards 轴发现总数：1（LOW，已修复）。

---

## Spec 轴审查结果

### [LOW] apps/playtest/src/main.ts:51 — CSSOM 写入会产生 `style` 属性，是否违反「MUST NOT add an HTML inline `style` attribute」

- **Finding ID**：CR-SPEC-001
- **来源 Reviewer**：BusinessCode
- **发现类型**：实现有误（judgement call）
- **Spec 原文引用**：`spec.md`「The presentation change keeps every existing contract」：*"It MUST NOT add a runtime dependency, an external network resource or an HTML inline `style` attribute."*；场景 *"no inline `style` attribute is used, no new external request is made, and `style-src 'self'` and `img-src 'self' data:` remain sufficient"*
- **疑似问题**：`el.style.setProperty()` 会在 DOM 上实际挂出 `style` 属性，字面读法似与该条款冲突。
- **深度研究结论**（主 Agent 自查 + 第 2 轮 Reviewer 确认）：**FALSE_POSITIVE**。该条款的语境（CSP `style-src 'self'`、`img-src 'self' data:`「仍然够用」）指向模板标记层的内联 `style`；而同一份 Spec 的 3D Requirement 又要求 *"moving the pointer across an interactive card SHALL tilt that card by setting `rotateX` and `rotateY` from the pointer position"*——在无 `'unsafe-inline'` 的 CSP 下，若把 CSSOM 写入也判为违规，则该 Requirement 不可实现，Spec 自相矛盾。design 的 E3（实测内联 `style` 属性被 CSP 拦截并产生控制台错误、CSSOM `setProperty` 放行）与 D-03 已把 CSSOM 记为唯一可行路径。
- **证据**：`apps/playtest` 源码与 `index.html` 中 `style="` 出现次数为 0（`grep -c`）；构建产物 `dist/assets/index-*.js`、`dist/index.html` 中 `style="` 计数为 0；浏览器用例 4/8 断言模板渲染后 `#app [style]` 计数为 0，且真实倾斜后 `--rx` 已写入、`errors` 为空（无 CSP 违规）。
- **修复建议**：建议 Spec 侧把该条款明确为「模板标记层的内联 `style` 属性」（Spec 文本归属 AI-Spec 节点，本节点不擅自修改已确认 Spec）。
- **状态**：FALSE_POSITIVE

### [LOW] tests/browser/trigger.spec.ts:92 — 视口断言未覆盖「文本未被遮挡」

- **Finding ID**：CR-SPEC-002
- **来源 Reviewer**：BusinessCode
- **发现类型**：部分实现
- **Spec 原文引用**：`spec.md`「Bounded tilt does not overflow」：*"the document scroll width does not exceed the viewport width and no card's point value, tag, name, ability text or upgrade annotation is covered"*（对应任务验收项「1280×800 与 1440×900 视口下…无横向溢出、不遮挡点数/标签/名称/能力文本/升级态信息」）
- **疑似问题**：原视口循环只断言 `scrollWidth ≤ innerWidth`，注释声称覆盖遮挡但实际未断言。
- **深度研究结论**：**CONFIRMED**（断言覆盖不足，非产品缺陷）。
- **证据**：第 1 轮 `tests/browser/trigger.spec.ts` 的视口循环只有 `scrollWidth` 断言。
- **修复建议**：补几何包含断言并扩大倾斜覆盖。
- **已执行修复**：提交 `d8a351d`（仅测试与证据文档）——视口循环改为逐张倾斜每个可视卡牌（含决定右边界的那一张），并对每张卡牌的 `.card-top b`/`.card-top span`/`strong`/`.ability`/`small` 断言其矩形完整落在卡牌盒内。变异验证：把 `.ability` 加 `margin-right:-40px` 时该用例失败（横向溢出断言先失败），把 `.card small` 设为 `display:none` 时包含断言在 `trigger.spec.ts:104` 失败，证明断言非恒真。第 2 轮 Reviewer 复核确认已修复，并提示该断言验证的是**几何包含**、绘制顺序仍由 `matrixZ(face) < 0` 间接覆盖——此提示已记录为遗留说明（见「遗留说明与建议项」）。
- **状态**：CONFIRMED（已修复）

### [LOW] apps/playtest/public/trigger.css:190 — 页面色阶/字重属 scope creep

- **Finding ID**：CR-SPEC-003
- **来源 Reviewer**：BusinessCode
- **发现类型**：scope creep
- **Spec 原文引用**：`spec.md` 六条 Requirement（未显式包含页面色阶/字重）；反证引用 `proposal.md`「What Changes」第一条 *"在 `apps/playtest/public/trigger.css` 建立统一的暗色拍卖色阶、字重节奏与卡牌材质层"* 与 `tasks.md` 1.4 *"统一 `.status`、`.log`、`.scoreboard`、`h1`/`h2`/`.eyebrow`、`.slot` 的色阶与字重节奏"*；任务需求 REQ-1 *"背景、标题、正文、比分与日志建立统一的暗色拍卖主题色阶与字重节奏"*
- **疑似问题**：`.log p` 左边框、`.scoreboard strong` 文字辉光、`.slot small` 字距与字重、`.eyebrow`/`.status strong` 字重、`font-variant-numeric` 等是否超出 Spec。
- **深度研究结论**：**FALSE_POSITIVE**。这些正是 `proposal.md` 与 `tasks.md` 1.4 的显式要求（`spec.md` 未为该范围单列 Requirement 属 Spec 覆盖缺口，而非实现越界）；且全部取值走 `:root` 令牌，满足「New visual values live in the `:root` token layer」Requirement（已核验 `:root` 外颜色字面量为 0）。第 2 轮 Reviewer 确认 FALSE_POSITIVE，并建议将该范围回填 Spec 以消歧。
- **证据**：`proposal.md`「What Changes」第一条；`tasks.md` 1.4（已勾选）；`:root` 外颜色字面量脚本核验为 0。
- **修复建议**：建议 Spec 侧补一条页面色阶/字重范围的 Requirement（Spec 文本归属 AI-Spec 节点，本节点不擅自修改）。
- **状态**：FALSE_POSITIVE

### [MEDIUM] tests/browser/trigger.spec.ts:293 — 收藏弹层的「投影板未被裁切」声明缺乏支撑

- **Finding ID**：CR-SPEC-004
- **来源 Reviewer**：BusinessCode（第 3 轮）
- **发现类型**：实现有误（证据/断言与声明不一致）
- **Spec 原文引用**：`spec.md:50`（"no card's point value, tag, name, ability text or upgrade annotation is covered"）；`design.md` R13/D-11
- **疑似问题**：注释与证据文档称「投影板不超出卡牌盒」「未被滚动容器裁切」，但断言只校验 `pointer-events`，`left/right` 取值后从未断言。
- **深度研究结论**：**部分成立、部分被推翻**。成立的：断言确实只校验了 `pointer-events`，声明缺乏支撑（已修复）。被推翻的：Reviewer 第 3 轮以 `.modal` 的**内容盒**下沿（699）为裁切边，判定「被裁切 21px」；主 Agent 实测 `overflow:auto` 的裁切边是 **padding 盒**（728），投影板下沿 ≈721 < 728，**未裁切**；Reviewer 第 4 轮以像素法独立复核后**撤回**该结论。
- **证据**：1280×800 `.modal` border box 71..729、`borderTopWidth` 1px、`scrollHeight == clientHeight == 656`；底行卡牌 bottom 698.19 + 外扩 22.37 = 720.56 < 728.19。像素法：投影板外扩带区（y 701–711）与弹层内边距带区（y 716–726）截图哈希不同 → 地面投影确实渲染。1280×560：`scrollHeight 656 > clientHeight 502`（真滚动），滚动到底后 `shadowBottom 523.375 < clip 531`。
- **修复**：`444ed7a` 起把断言改为可验证的几何事实（`pointer-events:none`、`insetX/insetTop > 0`、`insetBottom < 0`、`-insetBottom < padding`、`bottom - insetBottom < clipBottom`），并新增 1280×560 真滚动阶段；证据文档改写为实测几何并新增「已知取舍与偏差」表，明确记录投影板纵向超出卡牌盒 9%（≈22px）与 `tasks.md` 2.3 字面措辞「不超出卡牌盒」的偏差，以及满足其实质目的（`pointer-events:none` + 横向不越界 + 单行网格）的依据。
- **状态**：CONFIRMED（已修复；Reviewer 的裁切前提经复核后撤回）

### [LOW] tests/browser/trigger.spec.ts:294 — 「滚动容器」场景未被真正触发

- **Finding ID**：CR-SPEC-005
- **来源 Reviewer**：BusinessCode（第 3 轮）
- **发现类型**：部分实现
- **Spec 原文引用**：`design.md` R13
- **状态**：CONFIRMED（已在 `444ed7a` 修复：新增 1280×560 阶段并断言 `.modal scrollHeight > clientHeight`、`scrollWidth <= clientWidth`）

### [LOW] tests/browser/trigger.spec.ts:297/305 — 命中区断言无法发现投影板夺取热区

- **Finding ID**：CR-SPEC-006
- **来源 Reviewer**：BusinessCode（第 3、4 轮）
- **发现类型**：部分实现
- **Spec 原文引用**：`tasks.md` 2.3（投影板不得遮挡相邻卡牌点击热区）
- **状态**：CONFIRMED（已在 `b1335fe` 修复：取样点移到投影板纵向覆盖范围内并提前到几何断言之前执行；补相邻卡牌中心命中断言。变异验证：`inset 4% -20% -9%` + `::after{pointer-events:auto}` 时该断言失败，基线通过）

### [LOW] tests/browser/trigger.spec.ts:335 — `shadowBottom` 符号写反导致断言恒真

- **Finding ID**：CR-SPEC-007
- **来源 Reviewer**：BusinessCode（第 5 轮）
- **发现类型**：实现有误
- **Spec 原文引用**：`design.md` R13
- **状态**：CONFIRMED（已在 `f30be96` 修复：改为 `r.bottom - b`；并补一条真正依赖滚动状态的断言 `cardBottom <= clipBottom`。变异验证：`scrollTop = 0` 时该用例失败；`inset` 下沿 `-300%` 时投影板断言失败）

---

## 汇总

- **总扫描项**：6（HIGH: 0, MEDIUM: 2, LOW: 4），另 9 个二进制截图与 6 个文档按 LOW 快速记录
- **深度研究项**：0（无 HIGH/Critical）
- **确认问题**：6（Critical: 0, HIGH: 0, MEDIUM: 1, LOW: 5）——全部已修复（CR-SPEC-004/005/006/007、CR-STD-001）
- **排除误报**：2（CR-SPEC-001、CR-SPEC-003）
- **Reviewer 撤回项**：1（CR-SPEC-004 的「被裁切 21px」前提，经主 Agent 实测 + Reviewer 像素法复核后撤回）
- **整体风险评级**：**可合入**（Reviewer 第 6 轮明确结论）

### Reviewer 覆盖小结

- 启动 Reviewer：BusinessCode（第 1–2 轮 1 个 agent；第 3–6 轮因会话重置另起 1 个同职责 agent，共 2 个 agent、6 轮）
- 覆盖文件：`apps/playtest/public/trigger.css`、`apps/playtest/src/main.ts`、`tests/browser/trigger.spec.ts`，并以 Spec/`proposal`/`design`/`tasks`/证据文档做对照
- 未覆盖原因：Data Reviewer 未启动——diff 内无 DDL/DML、无 `*Mapper.xml`、无实体字段与索引/事务/迁移改动，且 `git diff origin/main...HEAD -- packages/` 为空、存档协议 `trigger-1` 与存档键未改，不命中 Data Reviewer 的启动信号
- 环境说明：本环境无 `fshows` CLI，不存在 Lifecycle 上下文，未登记任何生命周期门禁（详见报告头）

### 跨 Reviewer 归并记录

- 无跨 reviewer 重复或冲突（仅启动 1 个 Reviewer）。
- CR-SPEC-003 与 CR-SPEC-001 均被主 Agent 从「Spec 字面」降级为 FALSE_POSITIVE，理由分别是「`proposal.md`/`tasks.md` 显式要求」与「与同一 Spec 的 3D Requirement 自相矛盾」，第 2 轮 Reviewer 均确认。

### Standards 轴小结

- 发现总数：1（LOW）
- 最严重问题：CR-STD-001「裁切边计算用 `borderTopWidth` + 死三元」——纯整洁性，已在 `b1335fe` 修复

### Spec 轴小结

- 发现总数：6（MEDIUM 1 / LOW 5；其中 2 条为误报）
- 最严重问题：CR-SPEC-004「收藏弹层『投影板未被裁切』声明缺乏支撑」——断言与证据措辞已按实测几何改写（`444ed7a`），Reviewer 的「被裁切」前提经复核后撤回；其次 CR-SPEC-002 已在 `d8a351d` 补齐断言并通过变异验证

> 不跨轴选唯一最严重项——两轴分离的目的就是防止一轴掩盖另一轴。

### 必须修复项

无（不存在 CONFIRMED 的 HIGH 或 Critical）。所有 CONFIRMED 的 MEDIUM/LOW（CR-SPEC-002/004/005/006/007、CR-STD-001）均已在 `d8a351d`、`444ed7a`、`b1335fe`、`f30be96` 修复，并以变异验证证明断言非恒真。

### 遗留说明与建议项（未阻塞，已登记）

1. **断言语义澄清（Reviewer 第 2 轮建议）**：视口循环中的文本断言验证的是**几何包含**（文本矩形完整落在卡牌盒内），绘制顺序（材质层不覆盖文本）由 `matrixZ(::before) < 0` 与 `matrixZ(::after) < matrixZ(::before)` 两条断言间接覆盖，另有截图人工核对。为避免后续误解，已在此登记；如需在测试代码内加注释，属可选优化。
2. **Spec 覆盖缺口回填（Reviewer 第 2 轮建议）**：建议 Spec 侧（a）把「MUST NOT add an HTML inline `style` attribute」明确为模板标记层；（b）为页面色阶/字重节奏补一条 Requirement。Spec 文本由 AI-Spec 节点确认并登记为产物 `workflow-node-artifact-yevkotznr4b39mae7i3t`，本节点不擅自修改，故仅登记为建议项。
3. **测试整洁性（Reviewer 第 6 轮建议）**：把收藏弹层用例中 `:334/:336` 的裁切边计算抽成共享 helper，避免同类符号错误再现。非阻塞，登记为后续测试提交的改进项。
4. **环境限制（设计风险 R7）**：`npm run test:browser` 的仓库默认配置写死 `channel:'chrome'`，本机无 `/opt/google/chrome/chrome`，故以临时配置指向系统 Chromium 运行；未修改仓库配置。

### 规范关联分析

**数据规范模板命中**：
- 未启动 Data Reviewer，无命中。

**业务代码规范模板命中**：
- `references/business-code-review-rules.md#需求语义` — CR-SPEC-002（Spec 要求「文本未被遮挡」的断言部分实现，已修复）；CR-SPEC-001/CR-SPEC-003 经裁决为误报。
- `references/business-code-review-rules.md#状态机`、`#幂等`、`#异常处理`、`#安全权限` — 经 Reviewer 核实无违反（结算步进/终态、重复结算与跳过幂等、降级路径、CSP 与无敏感信息）。

**fskill-code-java-guide 命中**：
- 无 Java 改动，未加载 REF-G。

**REF-1（项目本地高风险模式库）命中**：
- REF-1 文档不存在（`docs/code-review-risk-patterns.md` 缺失），使用内置框架。

**REF-2（项目本地规范）违反项**：
- REF-2 目录不存在（`docs/coding-standards/` 缺失）；改按仓库 `AGENTS.md` 约定自查，无违反。

---

## 门禁证据

- `reviewedHead`：`f30be9617910faa9569bee991f547cd0b9eaa067`（第 6 轮审查覆盖的修订）
- 结论：**passed**（confirmedCritical 0 / confirmedHigh 0 / needsDiscussion 0；Reviewer 第 6 轮明确「可以合入」）
- 审查历史：`4e51a90`（第 1 轮）→ `d8a351d`（第 2 轮）→ `273e2f5`（第 3 轮）→ `444ed7a`（第 4 轮）→ `b1335fe`（第 5 轮）→ `f30be96`（第 6 轮）。产品代码自 `e47c8e4` 起未再改动，第 3–6 轮增量仅 `tests/browser/trigger.spec.ts` 与 `docs/evidence/UI_DEPTH_V09.md`（`git diff <base>...<head> -- apps/ packages/` 均为空）。
- 说明：`report.md` 与 `result.yaml` 本身不属于被审查的代码改动，在本报告生成后单独提交。

