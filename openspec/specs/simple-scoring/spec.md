# simple-scoring Specification

## Purpose
Define the public appraised-value-times-room-heat formula and six collection-pattern multipliers.

## Requirements
### Requirement: Base scoring uses card points and formation multiplier
系统 SHALL 将三件拍品每次计价产生的估值与公开加估值效果相加，再乘以组合热度和买家修正。组合 SHALL NOT 额外提供基础估值。

#### Scenario: Unmodified pair
- **WHEN** 玩家上拍7、7、2且没有贵宾、修复或买家修正
- **THEN** 系统计算 `(7 + 7 + 2) × 2 = 32` 成交价

### Requirement: Formations use one multiplier dimension
系统 SHALL 对散件、成对藏品、年代序列、主题专场、连号专场、传世三件套分别使用1、2、3、4、6、10热度；组合每次升级 SHALL 只增加1热度。

#### Scenario: Upgraded straight
- **WHEN** 年代序列升级一次且玩家上拍2、3、4
- **THEN** 系统使用4热度且不增加固定估值

### Requirement: Component position does not change score
系统 SHALL 先应用加估值与加热度效果，再应用所有乘热度效果；交换持有贵宾的位置 SHALL NOT 改变相同拍品的成交价。

#### Scenario: Additive and multiplicative components coexist
- **WHEN** 玩家持有策展人和大收藏家并上拍相同的三件拍品
- **THEN** 无论贵宾展示顺序如何，最终成交价保持相同

### Requirement: The formula is visible and consistent
界面 SHALL 将原计分量称为估值，并说明最终成交价等于估值乘热度再乘买家修正；组合表 SHALL 只为每种藏品组合显示热度倍率。

#### Scenario: Player previews a hand
- **WHEN** 玩家选满三件拍品
- **THEN** 预览显示当前累计估值、热度、组合条件和保底成交价
