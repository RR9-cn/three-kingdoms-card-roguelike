import {writeFileSync} from 'node:fs';
import {COMPANIONS,COMPANION_IDS} from '@three-card/content';
writeFileSync('docs/CONTENT.md','# 将星内容 v0.7\n\n12位活跃将星，共享5槽。开局可选关羽、周瑜、刘备；其余通过征募或商店获得。旧存档中的其他人物仍可使用，但不会进入新奖励池。本文由运行配置生成。\n\n| 将星 | 定位 | 标价 | 战法 |\n|---|---|---:|---|\n'+COMPANION_IDS.map(id=>COMPANIONS[id]).map(c=>`| ${c.name} | ${c.role} | ${c.price} | ${c.text} |`).join('\n')+'\n\n将星不属于固定套装。张飞、周瑜、赵云和诸葛亮可以发起额外计分；所有写着“额外计分”的响应都能接入。曹操、荀彧和孙策从换牌、裁军与同兵种方向改变任意组合的经营方式。完整规则见 GAME_DESIGN.md。\n');
