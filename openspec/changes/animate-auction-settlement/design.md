## Context

The client already reveals deterministic `Score.steps` over time and highlights the active guest, but all selected lots are immediately static and the right ledger carries most of the explanation. The core result already contains enough public information to stage the settlement without changing the rule engine or save schema.

## Goals / Non-Goals

**Goals:**
- Give every hand a clear visual sequence: lots, set, guest bidding, hammer price.
- Keep the visible animation synchronized with the already revealed `Score.steps`.
- Let players permanently prefer fast settlement and let reduced-motion users see an immediate result.
- Preserve the existing ledger and causal chain for detailed inspection.

**Non-Goals:**
- New scoring phases, random rolls, currencies, guests, or encounter rules.
- Asset-heavy character animation or cinematic boss sequences.
- Changes to the core package, save schema, or AI playtest protocol.

## Decisions

- Add a pure presentation helper that maps the current visible step count to a small settlement stage model. This keeps phase labels and active-lot/guest information testable without DOM timing.
- Keep `animation` as the revealed score-step boundary. Add a short opening beat before the first step and a hammer beat after the last step rather than introducing a second rules timeline.
- Render a compact central overlay with four named beats. The detailed ledger remains on the right and continues to use the same revealed boundary.
- Persist a `fastSettlement` boolean in local storage. Fast mode shortens timers but does not skip causality; the existing direct-result action remains available.
- Use CSS transforms, opacity, stamps, glow, and a CSS gavel. No new bitmap dependency is required for the prototype.

## Risks / Trade-offs

- [Long chains could become slow] → Accelerate later revealed steps, add persistent fast mode, and retain direct result.
- [Animation could imply a different calculation order] → Derive every visual state from the exact visible `Score.steps` prefix.
- [Layout could overflow at 1280×720] → Keep the stage overlay inside the existing played area and cover it with browser viewport tests.
- [Motion can be uncomfortable] → Honor `prefers-reduced-motion` by revealing and banking immediately, with all animation rules disabled.
