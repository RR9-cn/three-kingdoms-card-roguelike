# general-only-roster Specification

## Purpose
Present every permanent build component as an auction guest while preserving stable save-compatible mechanics.

## Requirements
### Requirement: 将星名单只包含三国人物
系统 SHALL 将全部 22 个稳定永久构筑内容改为超自然拍卖行的贵宾、鉴定师与工作人员，后台交易厅和五个贵宾席位中不得显示三国人物、军队或军宝牌。

#### Scenario: 浏览完整内容名单
- **WHEN** 玩家查看所有可获得的永久构筑内容
- **THEN** 每个名称都指向一名拍卖行人物并拥有与拍卖相关的能力描述

### Requirement: 人物化调整保持机械兼容
系统 MUST 保留原 22 个内容的稳定 ID、品质、价格、效果数值与触发顺序，并 SHALL 允许现有 v8 存档恢复相同机械能力。

#### Scenario: 恢复含旧人物 ID 的存档
- **WHEN** 游戏载入一个贵宾席位含有既有稳定 ID 的 v8 存档
- **THEN** 该席位显示对应的拍卖行人物且提供与调整前相同的效果

#### Scenario: 比较固定种子结果
- **WHEN** 调整前后以相同种子和相同动作运行一局
- **THEN** 抽牌、计分、现金与关卡结果保持一致

### Requirement: 玩家界面使用统一术语
系统 SHALL 在后台交易厅、贵宾席位、规则说明和当前版文档中将永久构筑人物统一称为“贵宾”，品质名称 SHALL 为常客、名流和传奇。

#### Scenario: 阅读构筑相关界面
- **WHEN** 玩家依次进入规则和后台交易厅界面
- **THEN** 界面使用“贵宾”说明永久构筑且不显示“将星”“武将”或“军宝”
