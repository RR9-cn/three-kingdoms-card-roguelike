## ADDED Requirements

### Requirement: Versioned isolated resume
系统 SHALL 为当前内容版本使用独立版本化双槽存档，保留历史版本存档，恢复精确阶段、候选、牌库、成长与随机状态；损坏时尝试上一槽并提示。

#### Scenario: Resume pending reward
- **WHEN** 奖励出现后重启
- **THEN** 相同候选与军资恢复，不重新生成奖励

### Requirement: Deterministic validated actions
内核 SHALL 无平台依赖，使用序号和合法性校验；拒绝重复ID、阶段不符、资源不足、未知内容和过期命令。无效命令不推进RNG。

#### Scenario: Double play
- **WHEN** 同一序号出牌命令提交两次
- **THEN** 只消耗一次出牌与执行一次成长

### Requirement: Desktop readable build interface
界面 SHALL 在1280×720及1440×900支持选牌、构筑、预览、整编与商店；1–6选牌、Enter出牌或下一手、Esc关闭弹窗。界面不显示未来牌序/RNG，失焦与最小化暂停，恢复不改变局面。

#### Scenario: Confirm result before next hand
- **WHEN** 出牌结算完成
- **THEN** 显示结算步骤与明确继续按钮，重复点击原出牌位置不进入下一手

### Requirement: Separate native and release evidence
Electron SHALL 保持沙箱、隔离、关闭Node与拒绝外部导航；构建包含离线资源与旧版页面。浏览器、macOS、Windows原生与Steam发布 SHALL 分开记录。

#### Scenario: Windows cross build
- **WHEN** 仅生成Windows包
- **THEN** 原生与Steam发布仍标记待验证
