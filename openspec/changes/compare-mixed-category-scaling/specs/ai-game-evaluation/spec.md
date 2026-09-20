## ADDED Requirements

### Requirement: 异域商瞬时规则比较

评测调参 SHALL 支持异域商在三种类别时使用正式`+4热度`或候选`当前热度×1.8`，默认与空调参 MUST 保持正式规则一致。

#### Scenario: 空调参与正式规则
- **WHEN** 评测未提供`sunquanMode`或指定`add-four`
- **THEN** 三种类别仍增加4热度且结果与当前正式规则相同

#### Scenario: 候选乘算模式
- **WHEN** 评测指定`sunquanMode`为`times-1.8`
- **THEN** 三种类别不再增加4热度，并在现有加法热度之后将当前热度乘以1.8

### Requirement: 开放生态接受瞬时调参

`simulate_open_ecology` SHALL 接受经过严格校验的`overrides`并将其一致应用于自适应购买预览、逐手选择深度和实际结算，同时不得写入存档或正式内容。

#### Scenario: 相同种子配对
- **WHEN** 两次开放生态请求使用相同种子与局数但不同异域商模式
- **THEN** 响应分别报告完整聚合指标，并且正式游戏默认行为不变
