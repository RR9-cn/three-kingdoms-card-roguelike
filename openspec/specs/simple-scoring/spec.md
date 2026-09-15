# simple-scoring Specification

## Purpose
Define the public points-times-multiplier scoring formula and the six formation multipliers.
## Requirements
### Requirement: Base scoring uses card points and formation multiplier

系统 SHALL 将三张牌每次计分产生的点数与公开加点数效果相加，再乘以阵型倍率和敌军修正。阵型 SHALL NOT 额外提供基础点数。

#### Scenario: Unmodified pair
- **WHEN** 玩家打出7、7、2且没有组件、强化或敌军修正
- **THEN** 系统计算 `(7 + 7 + 2) × 2 = 32` 攻势

### Requirement: Formations use one multiplier dimension

系统 SHALL 对散阵、合击、连阵、同袍、同袍连阵、三军同心分别使用1、2、3、4、6、10倍率；阵型每次升级 SHALL 只增加1倍率。

#### Scenario: Upgraded straight
- **WHEN** 连阵升级一次且玩家打出2、3、4
- **THEN** 系统使用4倍率且不增加固定点数

### Requirement: Component position does not change score

系统 SHALL 先应用加点数与加倍率效果，再应用所有乘倍率效果；交换持有组件的位置 SHALL NOT 改变相同手牌的得分。

#### Scenario: Additive and multiplicative components coexist
- **WHEN** 玩家持有周瑜和孙策并打出相同的三张牌
- **THEN** 无论组件展示顺序如何，最终攻势保持相同

### Requirement: The formula is visible and consistent

界面 SHALL 将计分量称为点数，并说明最终攻势等于点数乘倍率再乘敌军修正；规则表 SHALL 只为阵型显示倍率。

#### Scenario: Player previews a hand
- **WHEN** 玩家选满三张牌
- **THEN** 预览显示当前累计点数、倍率、阵型条件和最终攻势
