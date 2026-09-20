## Why

The current 12-guest reward pool can produce a viable run, but repeated runs encounter the same additional-bidding core too often. Four already implemented, save-compatible guests can widen card-selection priorities without adding a new player action or scoring concept.

## What Changes

- Add 估价师 (`blade`), 异域商 (`sunquan`), 黑金侯 (`lvbu`), and 守夜人 (`simayi`) to the new-run guest reward pool.
- Keep the opening three guests, five guest slots, shop size, rarity rules, prices, and all ability values unchanged.
- Update player-facing content counts and roster documentation from 12 to 16 active guests.
- Extend roster tests to prove the four guests can appear while all 22 stable IDs remain loadable.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `build-engines`: The new-run reward pool expands from 12 to 16 active guests using four existing one-condition effects.

## Impact

This changes the active content list in `packages/content/src/forge.ts`, deterministic shop-offer sequences for new runs, roster assertions, and documentation. It does not change save schema, scoring, actions, or the AI interface contract.
