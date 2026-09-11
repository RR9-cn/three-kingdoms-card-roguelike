# 三国 · 三张定天下

Steam PC 单人买断方向的三国卡牌肉鸽。当前默认是 **v0.6 可控连锁版**：六张选三张，通过武将、军宝、成长和战后随机整编，挑战递增的敌军目标。追击落空会积攒军势，玩家可以主动消耗军势，保底下一次符合条件的追击。

先试「启程」→选关羽、周瑜或刘备→普通进军。每关胜后征募、整编、逛商店。支持1–6选牌、Enter出牌/下一手、自动存档与原生最小化暂停。

只想检查新版连锁时，点击首页“可控连锁试玩 · 直达张角”。第一手选第1、2、6张并出牌，追击落空后军势正好达到2；收兵进入下一手，点击“聚势”，再打出含对子的三张牌，即可看到保底追击。试玩退出后恢复原征程，不写入正式存档。

## 运行与打包

需要 Node.js 24；依赖锁定，浏览器测试使用本机 Google Chrome。

```sh
npm ci
npm run dev                 # http://127.0.0.1:4173
npm run desktop             # 编译并启动桌面游戏
npm test                    # 新旧规则、组件、事务与存档
npm run test:browser         # 新旧浏览器流程
npm run simulate:forge      # 三个开局核心，各200个相同种子
npm run test:desktop:forge   # 新版macOS桌面完整征程与恢复
npm run package:mac         # macOS arm64
npm run package:win         # Windows x64交叉打包
```

应用位于 `release/ThreeCardKingdoms-darwin-arm64/ThreeCardKingdoms.app`；Windows目录内的exe必须连同整个同级目录分发。

## 内容与边界

22个组件、5个槽、4类随机正向整编、8关、开局选核心、逐步结算、即时预览、刷新/买卖/替换。每场胜利后可随机获得复制阵牌、升点、强化或牌型升级中的一项，也可跳过换3军资。默认随机种子，可输入 `forge-v051-7` 重玩完整征程测试种子；首页试玩使用独立的固定局面，不会暗中改变正式征程。

这是可玩开发原型，尚未验证真人重复游玩的吸引力。本轮加入“落空也推进”的军势循环和四档连锁反馈；第8关张角继续使用 PixelLab 待机、受击、雷法变招与败亡动作。张宝和其他角色仍使用代码图形。Windows原生、五人试玩、完整正式美术、Steam商店与上传均未完成。

主界面链接可进入v0.1旧版，旧规则和测试继续保留。新旧存档分别存储，不强制迁移；桌面和浏览器不共享存档。macOS桌面数据位于 `~/Library/Application Support/ThreeCardKingdoms`。

## 文档与结构

- [当前游戏设计](docs/GAME_DESIGN.md)、[20组件内容表](docs/CONTENT.md)、[体验验证](docs/EXPERIENCE_AND_VALIDATION.md)。
- [新版证据](docs/evidence/FORGE_V02.md)、[Steam发行准备](docs/STEAM_RELEASE.md)。
- `packages/core/src/forge.ts`：纯规则；`packages/content/src/forge.ts`：新版数值/效果配置。
- `apps/playtest/src/main.ts`：默认构筑界面；`legacy.ts`：旧界面。
- `apps/desktop/`：隔离Electron桌面壳；`art-prototype/`：早期美术来源，保持原样。
- `docs/history/`：v0.1设计快照；`openspec/`：现行变更与历史任务状态。

最新打磨与验证：[v0.3.1 关卡反馈](docs/evidence/FORGE_V031.md)。`npm run compare:forge` 可运行同种子换牌策略对照。

第4关张宝、第8关张角为两阶段首领战；阶段变化与留牌应对见 [当前规则](docs/GAME_DESIGN.md)。

首领版工程证据：[v0.4验证](docs/evidence/FORGE_V04.md)。

本版保留追击令／连营鼓、得分提升稀有招募概率、结算后押分、单手纪录及通关后极限挑战，并将战后整编收拢为一次随机正向结果。旧存档保留，新规则需新征程。

最新证据：[v0.5 连锁冲分与押分](docs/evidence/FORGE_V05.md)。

随机整编验证：[v0.5.1 战后整编](docs/evidence/FORGE_V051.md)。

张角演出验证：[v0.5.2 PixelLab Boss 动画](docs/evidence/BOSS_ANIMATION_V052.md)。

可控连锁验证：[v0.6 军势与保底追击](docs/evidence/CONTROLLED_PACHINKO_V06.md)。
