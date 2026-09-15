# point-breakdown Specification

## Purpose
Explain the source of accumulated points and each point increase during preview and settlement.
## Requirements
### Requirement: 点数来源可拆解

系统 SHALL 在选择三张阵牌后，将乘算前的累计点数拆为阵牌、强化、重触发和将星四个来源，并 MUST 保证四项之和等于显示的累计点数。

#### Scenario: 预览普通一手
- **WHEN** 玩家选择三张没有强化且没有点数型将星触发的阵牌
- **THEN** 面板将三张牌面之和显示为阵牌点数，其余三项显示为零

#### Scenario: 结算含重触发的一手
- **WHEN** 一张阵牌被张飞、诸葛亮或马超再次计分
- **THEN** 再次计入的点数显示在重触发项而不是原始阵牌项

### Requirement: 流水显示点数变化

系统 SHALL 在每个增加点数的结算步骤旁显示本次增加值和步骤完成后的累计点数。

#### Scenario: 累计点数发生变化
- **WHEN** 一个结算步骤使累计点数从24增加到48
- **THEN** 该步骤显示“+24 → 48点”

