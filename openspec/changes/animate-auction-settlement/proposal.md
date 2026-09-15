## Why

The auction rules already produce readable causal settlement data, but the playable client presents most of that result as a static ledger. A staged settlement animation can turn the existing causal chain into the game's signature moment while helping players understand why the hammer price changed.

## What Changes

- Animate the three selected lots into a short base-valuation phase.
- Reveal the formed set and heat multiplier as a stamped second phase.
- Highlight each triggered guest beside its renewed bid result in causal order.
- Finish with a hammer-price count-up whose intensity reflects the result and marks new records.
- Add a persistent fast settlement option and respect reduced-motion preferences.
- Keep scoring, randomness, guest rules, encounter rules, and AI JSON interfaces unchanged.

## Capabilities

### New Capabilities

- `settlement-animation`: Defines the staged, skippable auction settlement presentation and its accessibility behavior.

### Modified Capabilities

- `settlement-causality`: Requires the playable settlement presentation to preserve the rule engine's causal order and distinguish ordinary settlement from guest-triggered bidding.

## Impact

The change affects the browser and Electron playtest client, primarily `apps/playtest/src/main.ts`, settlement presentation helpers, CSS, and browser coverage. The deterministic core result and JSON playtest interfaces remain compatible.
