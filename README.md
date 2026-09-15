# 午夜落槌 · 诡物拍卖行

Steam PC 单人买断方向的卡牌肉鸽。你经营一家只在午夜开门的拍卖行：每轮从六件来路不明的拍品中选三件成组上拍，邀请各怀心思的贵宾举牌，把不起眼的藏品炒成天价。

当前唯一可玩版本是 **v0.8 题材验证版**。它完整保留 v0.7 已确定的简单规则：三件拍品的估值相加，再乘藏品组合热度；贵宾、声望与目录调整继续推动追加竞价。题材改版没有改变目标、概率、经济、随机流、稳定 ID 或存档结构。

开场从老鉴定师、策展人、淘金客中邀请一位，完成八场夜拍。每场结束后进入贵宾休息室，在三位贵宾和一项公开目录调整之间使用现金。首页“竞价试玩 · 直达最后一槌”提供不写入正式存档的固定测试局面。

## 运行与打包

需要 Node.js 24；依赖锁定，浏览器测试使用本机 Google Chrome。

```sh
npm ci
npm run dev                 # http://127.0.0.1:4173
npm run desktop             # 编译并启动桌面游戏
npm test                    # 当前规则、贵宾、事务与存档
npm run test:browser        # 当前浏览器流程
npm run simulate:forge      # 三个开场贵宾，各200个相同种子
npm run eval:ai --silent -- --request docs/examples/ai-eval/simulate-batch.json
npm run analyze:choices     # 固定样本的构筑选牌分歧诊断
npm run test:desktop:forge  # macOS桌面完整夜拍与恢复
npm run package:mac         # macOS arm64
npm run package:win         # Windows x64交叉打包
```

macOS 应用仍位于 `release/ThreeCardKingdoms-darwin-arm64/ThreeCardKingdoms.app`。该内部产品名暂时保留，以免把题材验证与发布迁移混在一起。Windows 目录内的 exe 必须连同整个同级目录分发。

## 当前内容

新局包含 12 位活跃贵宾、5 个席位、6 种藏品组合、6 类随机定向目录调整和 8 场夜拍。目录调整固定 8 现金，买下后再选择目标；每场最多一次，离开休息室即作废。多位贵宾可以从成对藏品、年代序列、主题专场或压轴拍品发起“追加竞价”，其他贵宾继续响应，不限制固定流派。

普通场只提高成交目标，第 4 场假面掮客与第 8 场终局收藏家才改变上拍规则。八场成交后可保留构筑进入无尽夜拍。红手套的再次举牌、抬价人的响应、来宾稀有度和最高成交纪录构成冲分循环。

这是可玩开发原型。Windows 原生验证、陌生玩家试玩、完整正式美术、声音、Steam 商店页面与上传尚未完成。macOS 桌面数据仍位于 `~/Library/Application Support/ThreeCardKingdoms`。

## 项目结构

- [当前游戏设计](docs/GAME_DESIGN.md)
- [当前贵宾内容](docs/CONTENT.md)
- [indienova 宣发与首轮真人测试计划](docs/INDIENOVA_OUTREACH.md)
- [Steam 发行准备](docs/STEAM_RELEASE.md)
- [AI 本地评测接口](docs/AI_EVALUATION_API.md)
- `packages/core/src/forge.ts`：纯规则内核
- `packages/content/src/forge.ts`：数值与公开内容配置
- `apps/playtest/src/main.ts`：当前游戏界面
- `apps/desktop/`：隔离的 Electron 桌面壳
