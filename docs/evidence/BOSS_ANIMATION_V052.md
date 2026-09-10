# v0.5.2 张角 Boss 动画验证

## 玩家可见变化

第8关张角现在按战斗状态播放四组独立像素动作：等待选牌时呼吸待机，攻势待入账时受击，跨过40%兵力进入第二阶段时施放“九天雷动”，归零后播放败亡。第二阶段同时出现暗场、法环和两道雷线，受击使用短促闪白与位移，击败后降低色彩与亮度。

动作只读取已经公开的界面状态，不推进核心规则、牌序或随机流。系统启用“减少动态效果”时，角色与特效停止循环，保留静态首帧。v0.5.2没有改变schemaVersion6/contentVersion0.5.1，现有v0.5.1征程可以继续。

## 素材

本轮按用户指定使用 PixelLab MCP 创建张角角色 `86a62d1c-6444-4226-8b63-8abf1a1a397f`，并生成待机4帧、受击6帧、雷法9帧、败亡7帧，共26张透明PNG。完整提示词、生成组ID和动画ID登记在 `apps/playtest/public/assets/bosses/zhang-jiao/manifest.json`。素材保持原始136×136画布，页面以像素化缩放显示。

## 自动验证

- `tests/browser/boss.spec.ts` 验证四种状态、阶段阈值与减少动态效果，并保留1280×720截图。
- `npm test` 验证规则、组件、事务和存档不受演出改动影响。
- `npm run test:browser` 验证完整浏览器流程。
- macOS arm64与Windows x64目录包均重新生成；macOS打包应用执行完整征程、随机整编、极限挑战、最小化和重启恢复。

截图：`boss-zhangjiao-hit.png`、`boss-zhangjiao-thunder.png`、`boss-zhangjiao-defeat.png`。桌面验证结果写入 `forge-v052-desktop-smoke.json`。Windows仍是交叉打包，尚未在Windows机器原生运行。
