## ADDED Requirements

### Requirement: Pursuit remains a simple random chain

系统 SHALL 仅在真实重触发后以35%概率尝试追加，成功后继续判定且单手最多追加3次。系统 SHALL NOT 提供军势、聚势、概率累积或追击保底状态。

#### Scenario: Pursuit check fails
- **WHEN** 一次重触发后的35%追击判定失败
- **THEN** 本次连锁结束，且不产生需要玩家管理的新资源

### Requirement: Chain feedback has four truthful tiers

界面 SHALL 根据已揭晓的追加次数区分0次未响、1次追击、2次连营与3次破军。减少动态效果 SHALL 保留信息但移除非必要动画。

#### Scenario: Pursuit chain reaches two additions
- **WHEN** 本手已经揭晓两次追加
- **THEN** 界面进入连营反馈层级，显示真实追加次数且不提前暴露下一次判定
