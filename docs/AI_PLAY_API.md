# 卡牌构筑AI接口 v2

调用 `npm run play:ai --silent -- --request request.json`，也可标准输入单个JSON。只支持schemaVersion 2，旧贵宾/牌型协议已删除。持久会话无需UI操作。

```json
{"schemaVersion":2,"operation":"start","seed":"smoke-0"}
```

返回sessionId、seq、phase、手牌hand、公开收藏collection、剩余轮数、撤换数、目标。手牌含实牌id、点数、类别、完整能力。choices只返回最多6个保底高分顺序供参考，玩家可任意指定三张顺序，不应只选第一项。

```json
{"schemaVersion":2,"operation":"act","sessionId":"返回的ID","seq":0,"decision":{"type":"play","ids":["c4","c6","c7"]}}
```

seq必须使用最新返回值。play按ids顺序触发并入账一次，进入result；使用next才补牌或进入奖励。观察、预览不推进随机。

| 阶段 | decision |
|---|---|
| battle | `{"type":"play","ids":["a","b","c"]}` 或 `{"type":"swap","ids":["a"]}`，撤换1–3张 |
| result | `{"type":"next"}` |
| reward | `{"type":"take","kind":"mirror"}`，从offers选一种 |
| upgrade | `{"type":"upgrade","id":"c6"}`，任选一张实牌+2点，进入下一场 |
| victory / defeat | 本局结束，读取history然后close |

其他操作：

```json
{"schemaVersion":2,"operation":"observe","sessionId":"返回的ID"}
```

```json
{"schemaVersion":2,"operation":"preview","sessionId":"返回的ID","ids":["c4","c6","c7"]}
```

`history`和`close`同observe的字段结构。history返回动作和结算，close删除该会话。过期seq、无效ID和不合法阶段操作不会改变状态。并发操作被会话锁拒绝，重新observe后再试。

不能读取.ai-play原始会话来获取未来牌序或随机状态。接口不接受隐藏状态替换。JSON测试不能评价动画、美术或桌面手感。
