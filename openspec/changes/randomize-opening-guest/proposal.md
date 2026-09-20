## Why

Choosing one of three fixed opening guests makes every run begin from a solved archetype menu. A single seeded random arrival gives the run an immediate constraint and lets the expanded active roster affect replay variety from the first decision.

## What Changes

- A new player run reveals one random opening guest from the active 16-guest pool instead of offering three fixed choices.
- The opening guest uses the existing rarity sampler and is reproducible from the run seed.
- The player confirms the revealed guest, then chooses normal or pressured entry as before.
- The AI play interface may omit `starter` to use the public random opening; an explicit active guest ID remains available for focused test fixtures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `build-engines`: New runs begin with one seeded random active guest rather than three fixed opening choices.

## Impact

This changes new-run initialization, opening UI copy, AI play request validation, tests, and current documentation. It does not change scoring, rarity weights, guest effects, shop size, save schema, or existing saved runs.
