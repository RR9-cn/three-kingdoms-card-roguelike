# build-engines Specification

## Purpose
Define the active general roster and require its freely combinable abilities to create meaningfully different card-selection preferences.
## Requirements
### Requirement: 活跃名单支持自由组合

系统 SHALL 只在新局商店中提供12位活跃将星，并 SHALL 让玩家能用现有的对子、低点、同兵种、连阵和额外计分规则自由组合启动、响应、成长与爆发效果。

#### Scenario: 查看活跃将星
- **WHEN** 玩家在新局中持续购买和刷新将星
- **THEN** 候选只来自12位活跃名单且多种发起与响应效果可自由组合

#### Scenario: 旧存档持有退役人物
- **WHEN** 玩家载入含有其他稳定人物ID的v8存档
- **THEN** 人物仍可显示和结算但不会进入新的奖励池

### Requirement: 将星组合改变选牌

系统 SHALL 让不同将星组合对对子、低点、同兵种、连阵或额外计分产生不同偏好，而不在玩家界面规定固定构筑配方。

#### Scenario: 比较不同将星组合
- **WHEN** 多组代表性将星组合面对同一组六张阵牌
- **THEN** 至少两组选择的最佳三张牌不同
