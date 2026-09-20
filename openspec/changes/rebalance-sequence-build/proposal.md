## Why

The same-category build owns a three-card bidding opener, a multiplicative finisher, and several generic responders, while the sequence build opens only one extra bid. In 100 automated random-opening runs, all 20 victories contained 策展人, so viable builds are concentrating around one route.

## What Changes

- Make 编目师 start one additional bid for each of the three cards in a sequence instead of only the lowest-valued card.
- Keep the trigger on the existing 年代序列 and 连号专场 combinations; add no new keyword or action.
- Extend evaluation output with sequence and 策展人-independent victory evidence.
- Remove the evaluator's implicit fallback to the old three fixed opening preferences for newly active random guests.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `build-engines`: Sequence builds gain a three-card opener comparable to the existing same-category opener.
- `ai-game-evaluation`: Build concentration reports distinguish independent sequence wins from builds that still rely on 策展人.

## Impact

This changes one existing guest effect, deterministic scores for hands containing 编目师 and a sequence, evaluation policy/metrics, tests, and current documentation. It does not change encounters, targets, resources, shop rules, or other guest values.
