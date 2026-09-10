## ADDED Requirements

### Requirement: Persistent composable builds
系统 SHALL 提供22个有独立效果的组件，共享5槽；支持成长、逐牌重触发、倍率、经济以及调整触发顺序。开局 SHALL 在三个公开核心中选一，随后的随机候选不保证配套。

#### Scenario: Growth and retrigger combination
- **WHEN** 关羽与张飞同在且出对子
- **THEN** 关羽成长一次，张飞只重触发第一张对子牌的逐牌效果，不重复整手成长

### Requirement: Random positive post-battle editing
系统 SHALL 在每场胜利后提供一次随机正向整编或跳过获得3军资。随机整编 SHALL 在复制随机阵牌、随机阵牌升点、随机阵牌强化及随机牌型升级四类合法结果中等概率选择一类，再随机选择合法目标；达到上限的类别从当次池中排除。结果在本局保留，复制创建新ID。随机池 SHALL 不包含删牌或改兵种。

#### Scenario: One persisted random edit
- **WHEN** 玩家接受战后随机整编
- **THEN** 系统只应用一个合法正向结果、展示具体变化并进入商店，下一战仍保留该变化

#### Scenario: Ineligible random category
- **WHEN** 牌库已满且全部阵牌均为9点
- **THEN** 复制与升点不参与本次抽取，只在强化与牌型升级中等概率选择

### Requirement: Atomic economy and reward choices
系统 SHALL 提供战后征募、一次整编、商店、刷新、买卖和显式替换。奖励候选在状态中持久化，重复或无效命令不改变军资、成长或随机数。

#### Scenario: Full slots and insufficient money
- **WHEN** 五槽已满或买入资金不足且未提供有效替换
- **THEN** 不扣军资、不删除旧组件、不授予新组件

### Requirement: Finite campaign and run report
系统 SHALL 提供八关，最后达标胜利，出牌耗尽未达标失败；结算展示构筑、最大攻势与已通关数。

#### Scenario: Fresh run
- **WHEN** 重新开局
- **THEN** 旧局组件成长和改牌不带入，不增加永久战斗属性

### Requirement: Score-weighted rarity
系统 SHALL 在本关最高已入账单手达到普通目标的50%和100%时提升品质权重，分别为75/22/3、65/30/5、50/40/10。先抽品质后抽个体，排除已持有和本批已抽取，空品质权重归零后归一化。候选 SHALL 持久化。

#### Scenario: Provisional score does not boost rarity
- **WHEN** 尚未收兵或押分结算
- **THEN** 临时分数不提高招募品质，最终结算后才更新本关最高分

### Requirement: Post-victory challenge
八关胜利后系统 SHALL 允许保留构筑、牌库、成长及纪录继续极限挑战，继续提供胜后奖励、整编和商店。失败 SHALL 保留已完成基础八关的状态。

#### Scenario: Continue after victory
- **WHEN** 玩家选择进入极限挑战
- **THEN** 完成奖励流程后进入下一层，目标递增且不重置构筑
