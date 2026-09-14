# AI本地评测接口 v1

这组接口让AI用一次工具调用在本地运行数百局，只读取聚合结果和少量代表种子。模拟策略只读取公开的 `ForgeView`；响应不包含未来抽牌顺序、随机状态或逐手原始日志。

## 调用

传入文件：

```bash
npm run eval:ai --silent -- --request docs/examples/ai-eval/simulate-batch.json
```

通过标准输入：

```bash
cat docs/examples/ai-eval/inspect-run.json | npm run eval:ai --silent
```

CLI成功时只向标准输出写入JSON。无效请求以非零状态退出，并向标准错误输出一行原因。所有请求必须包含 `"schemaVersion": 1`。

## `simulate_batch`

批量运行并返回每个开局的征程胜率，以及逐关的到达数、失败率、一手通关率、通关手数中位数、最高单手/目标的中位数与90分位、换牌次数中位数。最多返回12条异常提示，每个开局只给出中位、高爆发和首个失败三个代表种子。

请求示例见 [`simulate-batch.json`](examples/ai-eval/simulate-batch.json)。`runsPerStarter`范围为1–5000，默认200；`starters`默认包含三个开局；`policy`可选`counterplay`或`greedy`。

## `inspect_run`

重放一个确定种子，最多返回八条逐关摘要。摘要包含结果、使用手数和换牌数、最高单手、阵型、当时持有武将、最高单手中的武将触发计数，以及关后的武将和整编购买。

请求示例见 [`inspect-run.json`](examples/ai-eval/inspect-run.json)。它适合检查批量接口返回的中位、高爆发或失败种子，不应用来代替分布统计。

## `compare_rules`

在相同种子和策略上配对比较2–8个方案。响应只给出各开局胜率变化，以及相对基线绝对变化最大的12项逐关指标，避免返回每个方案的完整重复报表。

请求示例见 [`compare-rules.json`](examples/ai-eval/compare-rules.json)。首版支持两个临时参数：

- `liubeiMultiplier`：刘备每次低点牌计分增加的倍率，范围0–50。
- `stageTargets`：以1–8为键覆盖关卡目标，范围1–1万亿。

临时参数通过规则函数参数传递，不写入源码、存档或桌面游戏。空方案 `{}` 与正式规则完全一致。

## 输出边界

`meta.localRuns`表示本地实际执行局数。例如三个开局、每个200局、三个比较方案等于1800局，但仍只返回一个有界JSON。`rawLogs`固定为`false`。

自动策略用于发现回归、路线差异和异常种子，不能证明游戏好玩、公平或代表真人胜率。推荐流程是先批量统计，再检查3–5个代表种子，最后用配对比较验证一个数值假设。
