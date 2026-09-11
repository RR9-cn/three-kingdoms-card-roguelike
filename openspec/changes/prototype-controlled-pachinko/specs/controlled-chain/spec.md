## ADDED Requirements

### Requirement: Failed pursuit builds momentum

系统 SHALL 在持有追击令的真实重触发未能追加时获得1军势，上限5；预览、无重触发出牌和未持有追击令 SHALL NOT 改变军势。

#### Scenario: A real pursuit check fails
- **WHEN** 一次重触发后的35%追击判定失败且军势未满
- **THEN** 本手流水显示追击失败并获得1军势，状态与存档同步增加

#### Scenario: Previewing a hand
- **WHEN** 玩家反复选择牌查看保底预览
- **THEN** 军势与随机流保持不变

### Requirement: Player can guarantee the next eligible pursuit

系统 SHALL 允许持有追击令且至少有2军势的玩家在选牌阶段聚势，立即消耗2军势，使下一次真实追击判定保底成功。没有产生重触发的出牌 SHALL NOT 消耗已聚势状态。

#### Scenario: Primed retrigger is played
- **WHEN** 玩家聚势后打出会产生重触发的三张牌
- **THEN** 第一次追击必定成功且不消费enemy随机数，后续追击继续按35%判定

#### Scenario: Primed hand has no retrigger
- **WHEN** 玩家聚势后打出没有重触发来源的三张牌
- **THEN** 本手正常结算且聚势状态保留到下一次符合条件的追击

### Requirement: Momentum is deterministic run state

军势与聚势状态 SHALL 跨手牌、关卡和重启保存，并 SHALL 随动作序列确定性重放；新状态 SHALL 使用独立v7存档，不覆盖旧v6征程。

#### Scenario: Restart while primed
- **WHEN** 玩家聚势后退出并继续v7征程
- **THEN** 军势余额、聚势状态和所有随机流与退出前一致

### Requirement: Chain feedback has four truthful tiers

界面 SHALL 根据已揭晓的追加次数区分0次蓄势、1次追击、2次连营与3次破军，并显示军势获得、花费与保底状态。减少动态效果 SHALL 保留信息但移除非必要动画。

#### Scenario: Pursuit chain reaches two additions
- **WHEN** 本手已经揭晓两次追加
- **THEN** 界面进入连营反馈层级，显示真实追加次数且不提前暴露下一次判定
