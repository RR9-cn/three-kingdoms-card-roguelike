## Context

All four requested guests already exist in the 22-ID content registry and their scoring branches are covered by compatibility tests. New-run rewards are constrained by `COMPANION_IDS`, so widening that list is sufficient to make them available through the existing rarity sampler and shop.

## Goals / Non-Goals

**Goals:**
- Expand new-run rewards from 12 to 16 guests.
- Add high-value, mixed-category, triple-rank, and last-hand incentives using existing rules.
- Preserve deterministic behavior for a given version after the roster change.

**Non-Goals:**
- Changing any guest text, price, rarity, effect value, or trigger order.
- Adding starters, slots, shop offers, card types, resources, or encounters.
- Claiming the expanded pool is balanced before playtesting.

## Decisions

- Append `blade`, `sunquan`, `lvbu`, and `simayi` to `COMPANION_IDS`. Appending keeps the intentional original roster grouping readable while making all four eligible for the existing sampler.
- Keep the three starter choices unchanged. The new guests are discovery content and do not increase opening complexity.
- Update count assertions and add explicit inclusion checks. Existing effect-composition tests remain the source of truth for their mechanics.

## Risks / Trade-offs

- [A larger pool makes specific guests less reliable to find] → Keep three shop offers and refresh economics unchanged for this bounded test, then measure build diversity before changing access.
- [New deterministic seeds produce different shops] → Treat this as an intentional content-version behavior change for new runs; stable v8 saves and IDs remain compatible.
- [One added route may dominate] → Do not tune values in the same change; use later batch and human playtests to isolate that result.
