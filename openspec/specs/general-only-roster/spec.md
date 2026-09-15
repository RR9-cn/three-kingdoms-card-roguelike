# general-only-roster Specification

## Purpose
Present every permanent build component as a Three Kingdoms general while preserving stable save-compatible mechanics.
## Requirements
### Requirement: 将星名单只包含三国人物

系统 SHALL 让全部 22 个永久构筑内容以三国人物身份呈现，商店和五个构筑槽位中不得出现独立军宝牌。

#### Scenario: 浏览完整内容名单
- **WHEN** 玩家查看所有可获得的永久构筑内容
- **THEN** 每个名称都指向一名三国人物

### Requirement: 人物化调整保持机械兼容

系统 MUST 保留原 22 个内容的稳定 ID、品质、价格、效果数值与触发顺序，并 SHALL 允许现有 v8 存档恢复相同机械能力。

#### Scenario: 恢复含原军宝 ID 的存档
- **WHEN** 游戏载入一个构筑槽位含有原军宝稳定 ID 的 v8 存档
- **THEN** 该槽位显示对应的新武将且提供与调整前相同的效果

#### Scenario: 比较固定种子结果
- **WHEN** 调整前后以相同种子和相同动作运行一局
- **THEN** 抽牌、计分、军资与关卡结果保持一致

### Requirement: 玩家界面使用统一术语

系统 SHALL 在商店、构筑槽位、规则说明和当前版文档中将永久构筑内容统一称为“将星”，品质名称 SHALL 为良将、名将和传奇。

#### Scenario: 阅读构筑相关界面
- **WHEN** 玩家依次进入规则和商店界面
- **THEN** 界面使用“将星”说明永久构筑且不要求玩家区分武将与军宝
