# AI交互试玩接口 v1

这套接口让AI直接在公开游戏状态上完成一局征程，不需要截图、鼠标操作或逐项试选。会话保存在本地`.ai-play/`目录；接口不会返回随机状态、抽牌堆顺序或其他未来信息。

## 调用方式

每次调用向`play:ai`传入一个JSON请求：

```bash
npm run play:ai --silent <<'JSON'
{"schemaVersion":1,"operation":"start","seed":"review-01","starter":"liubei"}
JSON
```

响应中的`sessionId`用于后续调用，`turn`用于拒绝重复或过期决策。也可以将请求写入文件后使用`--request 文件路径`。

## 五个操作

### `start`

```json
{"schemaVersion":1,"operation":"start","seed":"review-01","starter":"liubei","pressure":false}
```

创建会话并直接进入第一关战斗。`starter`可选`guanyu`、`zhouyu`、`liubei`。

### `observe`

```json
{"schemaVersion":1,"operation":"observe","sessionId":"响应中的ID"}
```

重新读取当前公开局面，不推进游戏。

### `act`

```json
{"schemaVersion":1,"operation":"act","sessionId":"响应中的ID","turn":2,"decision":{"type":"play","cards":[1,3,6]}}
```

战斗局面会一次返回六张手牌和全部20种三牌组合。为减少token，每个组合按照`combinationFields`声明的顺序使用短数组：手牌编号、阵型、保底攻势、Boss惩罚与确定触发。AI直接引用编号出牌，无需分别调用预览。

可用决策：

- `play`：`{"type":"play","cards":[1,3,6]}`。接口自动完成结算、入账、胜负判断和补牌，并在`lastResult`返回保底攻势、实际攻势与触发摘要。
- `discard`：`{"type":"discard","cards":[2,4]}`。
- `buy_general`：`{"type":"buy_general","offer":2}`；五将已满时增加`"replace":3`。
- `buy_edit`：购买当前公开整编。
- `apply_edit`：普通整编使用`target`牌库编号；研习使用1–6的`category`；改编同时传`suit`。
- `sell_general`：`{"type":"sell_general","general":2}`。
- `refresh`：刷新武将货架。
- `depart`：`{"type":"depart","pressure":false}`，离开市集并直接开始下一关。
- `extend`：通关后进入极限挑战市集。

### `history`

```json
{"schemaVersion":1,"operation":"history","sessionId":"响应中的ID"}
```

只返回紧凑决策记录，适合AI在通关或失败后总结构筑与关卡体验。

### `close`

```json
{"schemaVersion":1,"operation":"close","sessionId":"响应中的ID"}
```

删除本地会话。

## 调用量

原本UI试玩的一次选牌通常需要截图、三次点击、出牌、等待结算和继续等多次操作。接口把它压缩为一次`act`。普通一局预计需要约20–40次小型JSON调用，具体取决于战斗手数和市集购买次数。批量平衡仍使用`eval:ai`；需要AI亲自判断每一步时使用`play:ai`。
