import {writeFileSync} from 'node:fs';
import {COMPANIONS} from '@three-card/content';
writeFileSync('docs/CONTENT.md','# 构筑版内容 v0.7\n\n22个常驻组件，共享5槽。开局可选关羽、周瑜、刘备；其余通过征募或商店获得。本文由运行配置生成。\n\n| 组件 | 定位 | 标价 | 效果 |\n|---|---|---:|---|\n'+Object.values(COMPANIONS).map(c=>`| ${c.name} | ${c.role} | ${c.price} | ${c.text} |`).join('\n')+'\n\n完整计分、经济、整编与关卡规则见 GAME_DESIGN.md。名称印章和牌面使用代码排版；当前像素素材位于 `apps/playtest/public/assets/`。\n');
