# 午夜落槌 · 藏品连锁

当前唯一版本为 **v0.9 三场纯卡牌构筑验证版**。每张卡自带点数与能力，抽六选三并排列，按顺序触发点数、热度与连锁。战后收集一张新卡，再给任意一张卡+2点。已移除旧版炸金花牌型、贵宾系统与旧运行代码。

```sh
npm ci
npm run dev            # http://127.0.0.1:4173
npm run desktop        # 构建并启动当前桌面版
npm test
npm run test:browser   # 完整三场、收集、升级、恢复及排序
npm run test:desktop   # macOS本机启动与结算恢复冒烟
npm run build
npm run package:mac
npm run package:win
```

需要Node.js 24，浏览器测试使用本机Chrome。12种卡牌、10张起始牌、3场、每场4轮及2次撤换。测试种子 `smoke-0` 可观察完整流程，仍需自己选择、排序和收集。

- [当前设计](docs/GAME_DESIGN.md)
- [卡牌内容](docs/CONTENT.md)
- [AI交互协议v2](docs/AI_PLAY_API.md)
- [批量回归](docs/AI_EVALUATION_API.md)
- [验证证据](docs/evidence/TRIGGER_PROTOTYPE_V09.md)

当前内核：`packages/core/src/trigger.ts`；内容：`packages/content/src/trigger.ts`；界面：`apps/playtest/src/main.ts`。历史实验报告只供参考，不代表当前规则。Windows原生验证及Steam发行尚未完成；打包内部目录仍使用ThreeCardKingdoms名称。
