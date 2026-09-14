# 三国 · 三张定天下

Steam PC 单人买断方向的三国卡牌肉鸽。当前唯一版本是 **v0.7 简明计分版**：每手从六张牌中选择三张，基础攻势为“三张点数之和 × 阵型倍率”，再由将星、成长与随机整编推动爆发。

先选关羽、周瑜或刘备作为开局核心，完成八关征程；每关胜利后直接进入军中市集，在3名武将与1个公开整编之间使用军资。支持1–6选牌、Enter出牌或进入下一手、自动存档与原生最小化暂停。首页“连锁试玩 · 直达张角”提供不写入正式存档的固定测试局面。

## 运行与打包

需要 Node.js 24；依赖锁定，浏览器测试使用本机 Google Chrome。

```sh
npm ci
npm run dev                 # http://127.0.0.1:4173
npm run desktop             # 编译并启动桌面游戏
npm test                    # 当前规则、将星、事务与存档
npm run test:browser        # 当前浏览器流程
npm run simulate:forge      # 三个开局核心，各200个相同种子
npm run eval:ai --silent -- --request docs/examples/ai-eval/simulate-batch.json
npm run analyze:choices     # 固定样本的构筑选牌分歧诊断
npm run test:desktop:forge  # macOS桌面完整征程与恢复
npm run package:mac         # macOS arm64
npm run package:win         # Windows x64交叉打包
```

macOS应用位于 `release/ThreeCardKingdoms-darwin-arm64/ThreeCardKingdoms.app`。Windows目录内的exe必须连同整个同级目录分发。

## 当前内容

当前新局包含12位活跃将星、5个槽、6种阵型、6类随机定向整编和8关征程。整编固定8军资，买下后再选择目标；每关最多一次，离开市集即作废。多位将星可以从对子、连阵、同兵种或最右牌发起“额外计分”，其余将星继续追击或响应，不限制固定流派。普通关只提高目标，第4关张宝与第8关张角才改变出牌规则；八关通关后可保留构筑进入极限挑战。

马超追击、陆逊连营、稀有招募和单手纪录构成冲分循环。连锁揭晓后，本手最终攻势自动全额入账。

这是可玩开发原型。Windows原生验证、五人试玩、完整正式美术、声音、Steam商店页面与上传尚未完成。macOS桌面数据位于 `~/Library/Application Support/ThreeCardKingdoms`。

## 项目结构

- [当前游戏设计](docs/GAME_DESIGN.md)
- [当前将星内容](docs/CONTENT.md)
- [当前验证记录](docs/evidence/SIMPLE_SCORING_V07.md)
- [AI本地评测接口](docs/AI_EVALUATION_API.md)
- [v0.7选牌分歧诊断](docs/evidence/CHOICE_DIVERGENCE_V07.md)
- [v0.7选牌分歧人工审核](docs/evidence/CHOICE_DIVERGENCE_REVIEW_V07.md)
- `packages/core/src/forge.ts`：纯规则内核
- `packages/content/src/forge.ts`：数值与效果配置
- `apps/playtest/src/main.ts`：当前游戏界面
- `apps/desktop/`：隔离的Electron桌面壳
- `apps/playtest/public/assets/`：当前游戏素材
