## Context

New runs currently expose three fixed internal starter IDs. The game already has a seeded, rarity-aware sampler for the active guest pool, and the opening screen already supports rendering guest cards. Reusing both keeps the change small.

## Goals / Non-Goals

**Goals:**
- Make the first guest vary across runs.
- Keep the result deterministic for a supplied seed.
- Let every active guest appear at the opening according to existing rarity weights.
- Preserve focused AI and automated tests that need a fixed guest.

**Non-Goals:**
- Adding rerolls, draft currencies, extra choices, or opening bonuses.
- Changing rarity weights, guest balance, or later shop behavior.
- Migrating old internal action and request field names.

## Decisions

- Initialize `recruits` with one result from the existing active-pool sampler. The player sees the result before confirming it, so the random constraint is transparent.
- Keep the existing `starter` action for save compatibility and deterministic test setup. Player UI can only submit the one revealed ID.
- Make the AI `starter` request field optional. Omission follows the public random path; an explicit active ID replaces the revealed offer only for targeted evaluation.

## Risks / Trade-offs

- [A weak or specialized guest can make the first run harder] → This is the intended roguelike constraint; verify every active guest can enter the first battle without invalid state.
- [A legendary opening can create a high-roll] → Reuse the current 3% base legendary weight rather than flattening rarity.
- [Seeded offer sequences shift because opening consumes reward RNG] → Treat this as intentional new-run behavior and preserve loaded saves unchanged.
