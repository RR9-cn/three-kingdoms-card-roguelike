## Context

`apps/playtest/public/trigger.css` is one minified line of 6028 bytes containing 59 colour literals, 54 of them distinct, with no `:root` colour token. The UI markup lives in template strings inside a 36-line minified `apps/playtest/src/main.ts`. Behavioural accessibility is partly present: `button:focus-visible` / `input:focus-visible` with a 3px outline and 3px offset, one `aria-live` region, one `role="alert"` error surface, and a `prefers-reduced-motion: reduce` block.

Measured baseline (WCAG 2.1 relative luminance):

| Element | Value | Background | Ratio | Floor |
|---|---|---|---|---|
| Card annotation | `#4c5549` | normal card dark end `#c6b789` | 3.90:1 | 4.5:1 |
| Card annotation | `#4c5549` | haunted card dark end `#aa8f91` | 2.61:1 | 4.5:1 |
| Card annotation | `#4c5549` | tool card dark end `#92aaa3` | 3.15:1 | 4.5:1 |
| Card body text | `#26312d` | haunted card dark end `#aa8f91` | 4.52:1 | 4.5:1 (tight, passes) |
| Muted text | `#a9b2a0` | page field `#111b1c` | 7.99:1 | pass |
| Body text | `#eee1bd` | page field `#111b1c` | 13.48:1 | pass |
| Gold accent | `#d5b36b` | page field `#111b1c` | 8.76:1 | pass |
| Control border | `#827352` | button fill `#1a2928` | 3.25:1 | pass |
| Header divider | `#645e41` | page field `#111b1c` | 2.69:1 | decorative, no floor |

## Decisions

**Token namespace `--auction-*`.** The product is a midnight-auction theme with no existing design document; the namespace keeps the playtest UI independent from the desktop workbench tokens (the two products share no visual language).

**Tokenise 1:1, then consolidate.** Because there are 54 distinct values, the token layer is created by naming every literal by role, then merging only same-family shades that are visually indistinguishable. No value changes except the card annotation corrections. There is no token-count budget for the game (unlike the workbench); the testable invariant is "zero colour literals outside `:root`".

**Format before semantics, in its own commit.** A 6KB single-line file produces a diff that hides behavioural change. Formatting first, with tests run on that commit, separates mechanical churn from semantic change and lets each be reverted independently.

**Card annotation contrast needs per-variant values.** The measured minimum darkening of `#4c5549` that reaches 4.5:1 differs per variant because the gradients have different dark ends: normal `#434b41` (4.54:1), haunted `#2b302a` (4.52:1), tool `#373d35` (4.52:1). A single shared value cannot satisfy all three without dropping the haunted and tool cards far below the floor or darkening the normal card beyond a minimum step. Raising the font size alone does not satisfy the requirement, so both changes ship together. This is recorded as a Spec-stage refinement of audit item G-05.

**Dialog focus return needs a distinct handle.** The in-dialog close buttons currently reuse the same `data-action` as the header toggles (`rules`, `collection`). Focus return must therefore be driven by an explicit reference to the opening toggle, not by `data-action`. Implementation may add a `data-role` attribute, an `id`, or capture the trigger element at open time; the contract is only that focus lands on the header toggle.

**No new dependency.** Assertions reuse `node:test` via the existing `tsx --test tests/*.test.ts` glob (so the new contract test sits at `tests/ui-contract.test.ts`, not in a subdirectory) and the existing Playwright setup.

## Risks

- **The minified `main.ts` is edited by hand.** Template-string edits are error-prone; mitigation is to change attributes and add keyboard handling only, never the render structure, and to rely on the three existing browser cases plus the new assertions.
- **`test:browser` requires local Chrome** (`channel: 'chrome'`). If unavailable, the missing verification must be recorded with its impact rather than claimed as passing.
- **Escape handling must not break the settlement flow.** The key listener must be scoped to an open dialog and must not interfere with the settlement animation, the skip control or the reduced-motion path.
- **Per-variant annotation tokens grow the token set.** Accepted: the game has no token budget and per-variant minimum steps preserve more of the original appearance than a single darker shared value.
- **Format-only commit touches every line.** Mitigation is that it is committed alone with the full test suite run on it.

## Out of scope

- Splitting `main.ts` into modules, introducing a UI framework, restructuring the render functions, or changing game rules, values, card content, random behaviour, settlement animation timing, the save key `trigger-1`, the AI evaluation contract `schemaVersion 2`, `apps/desktop` or the packaging chain.
- A skip link: it would add a new interactive stop, which conflicts with the confirmed "interaction order unchanged" constraint. Recorded as a deferred item.
