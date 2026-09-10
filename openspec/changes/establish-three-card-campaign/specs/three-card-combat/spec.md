## ADDED Requirements

### Requirement: Three-card scoring combat
系统 SHALL 在六张手牌中选择三个不同物理ID出牌，使用六种牌型，累计攻势达标即胜；每关4次出牌、2次换牌。换牌接受1–3张不同手牌。所有计分 SHALL 按配置、重复触发、组件顺序和取整规则执行。

#### Scenario: Last hand can win
- **WHEN** 最后一次出牌使攻势达到目标
- **THEN** 判定胜利，先于出牌耗尽失败检查

### Requirement: Explainable non-mutating preview
系统 SHALL 显示所选牌型、基础、倍率、连锁来源与最终值；预览和实际出牌使用同一结算函数，预览不写回成长或随机数。

#### Scenario: Repeated previews
- **WHEN** 玩家反复选同一手牌
- **THEN** 成长不提前发生，实际出牌时只成长一次，无随机追加时最终攻势与保底预览一致，有追加时只增加收益

### Requirement: Public pressure and bosses
关卡 SHALL 战前公开目标与规则；加压仅战前一次，目标×1.5并增加8军资胜利奖励。Boss 修改在计分前公开，不使用对手暗牌随机判负。

#### Scenario: Deterministic boss penalty
- **WHEN** Boss 对指定牌型施加限制
- **THEN** 预览与实际结算均包含该限制，不能在出牌后才告知

### Requirement: Counterplay to public threats
系统 SHALL 在第4关首领第一阶段按本手是否换牌施加0.65伏击修正；第7关按首张出牌与上一手首牌是否同兵种施加0.5变阵修正。UI SHALL 在出牌前说明修正与应对方式，预览与实算一致；换牌仅解除当前手伏击，不额外给予出牌次数。

#### Scenario: Scout breaks ambush
- **WHEN** 玩家在第4关首领第一阶段换掉至少一张牌
- **THEN** 本手伏击修正解除，仍在第一阶段时下一手重新生效，剩余换牌次数不恢复

#### Scenario: Pressure retains cost with seal
- **WHEN** 持虎符选择加压
- **THEN** 目标倍率为1.5，虎符倍率仅1.25，不出现目标增长低于伤害增长的倒挂

### Requirement: Prepare for the next threat
系统 SHALL 在征募、整编和商店预告下一关固定目标和规则；选中三牌展示顺序 SHALL 与实际手牌从左至右结算一致。目标依次为140、300、650、1400、2500、3800、5600、8000，不随构筑动态变化。

#### Scenario: Prepare before entering ambush
- **WHEN** 玩家第三关胜利后选择奖励
- **THEN** 已能看到下一关伏击规则和1400目标，在进场前有机会调整构筑和牌库

### Requirement: Two-phase named bosses
系统 SHALL 在第4关张宝和第8关张角展示身份、剩余兵力、阶段规则、变招与击败反馈。累计削减40%目标兵力后下一手进入第二阶段。单手伤害 SHALL 全额累计，出牌和换牌次数不刷新，可以一手击败首领。

#### Scenario: Breakthrough without damage truncation
- **WHEN** 一手攻势跨过阶段阈值
- **THEN** 本手按出牌前规则计算并全额累计，收兵或押分结算后存档恢复保留该阶段结果；下一手才使用新规则

#### Scenario: Zhang Bao changes tactics
- **WHEN** 张宝第二阶段玩家重复上一手牌型
- **THEN** 攻势乘0.5且预览提前展示，换牌不再解除该效果

#### Scenario: Reserve a scheme card against thunder
- **WHEN** 张角第二阶段玩家选择三张牌
- **THEN** 若未选中的现有手牌包含谋牌则正常计分，否则攻势乘0.6；未来补牌不参与判定

### Requirement: Bounded stochastic bursts
系统 SHALL 以追击令在重触发后35%概率追加计分，单手最多三次追加；连营鼓每次成功追加使当前倍率乘1.5。预览 SHALL 不推进随机，不显示尚未揭晓的事件。

#### Scenario: No retrigger source
- **WHEN** 只有追击令而没有重触发事件
- **THEN** 不抽追加判定，不凭空增加收益

### Requirement: Optional wager settlement
系统 SHALL 在每手结算后允许收兵或押本手20%（向下取整），50%成功加押注、50%失败减押注，每手最多一次。累计攻势、最高纪录和品质 SHALL 在最终入账时更新，之前已入账分数不得倒扣。

#### Scenario: Lose a lethal hand
- **WHEN** 追击失败使本手不足以过关且手数已经耗尽
- **THEN** 保留扣除押注后的本手分数与既有纪录，确认后判负；重新加载不重抽结果
