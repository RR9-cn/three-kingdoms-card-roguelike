# 三国 · 三张定天下

Steam PC 单人买断方向的三国卡牌肉鸽。当前唯一版本是 **v0.7 简明计分版**：每手从六张牌中选择三张，基础攻势为“三张点数之和 × 阵型倍率”，再由武将、军宝、成长与随机整编推动爆发。

先选关羽、周瑜或刘备作为开局核心，完成八关征程；每关胜利后依次征募、随机整编并进入商店。支持1–6选牌、Enter出牌或进入下一手、自动存档与原生最小化暂停。首页“连锁试玩 · 直达张角”提供不写入正式存档的固定测试局面。

## 运行与打包

需要 Node.js 24；依赖锁定，浏览器测试使用本机 Google Chrome。

```sh
npm ci
npm run dev                 # http://127.0.0.1:4173
npm run desktop             # 编译并启动桌面游戏
npm test                    # 当前规则、组件、事务与存档
npm run test:browser        # 当前浏览器流程
npm run simulate:forge      # 三个开局核心，各200个相同种子
npm run test:desktop:forge  # macOS桌面完整征程与恢复
npm run package:mac         # macOS arm64
npm run package:win         # Windows x64交叉打包
```

macOS应用位于 `release/ThreeCardKingdoms-darwin-arm64/ThreeCardKingdoms.app`。Windows目录内的exe必须连同整个同级目录分发。

## 当前内容

当前包含22个组件、5个槽、6种阵型、4类随机正向整编和8关征程。阵型倍率依次为×1、×2、×3、×4、×6、×10；阵型升级只增加倍率。第4关张宝与第8关张角是两阶段首领，八关通关后可保留构筑进入极限挑战。

追击令、连营鼓、稀有招募、结算后押分和单手纪录构成冲分循环。游戏内押分只使用本局分数，不涉及真钱。

这是可玩开发原型。Windows原生验证、五人试玩、完整正式美术、声音、Steam商店页面与上传尚未完成。macOS桌面数据位于 `~/Library/Application Support/ThreeCardKingdoms`。

## 项目结构

- [当前游戏设计](docs/GAME_DESIGN.md)
- [当前组件内容](docs/CONTENT.md)
- [当前验证记录](docs/evidence/SIMPLE_SCORING_V07.md)
- `packages/core/src/forge.ts`：纯规则内核
- `packages/content/src/forge.ts`：数值与效果配置
- `apps/playtest/src/main.ts`：当前游戏界面
- `apps/desktop/`：隔离的Electron桌面壳
- `apps/playtest/public/assets/`：当前游戏素材
